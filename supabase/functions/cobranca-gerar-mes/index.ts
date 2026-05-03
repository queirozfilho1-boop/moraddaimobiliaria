// Edge Function — Geração mensal automática de cobranças
// Body: { ano?: number, mes?: number, contrato_id?: string, dry_run?: boolean }
// Para contratos com cobranca_modo='automatica' e vencimento <= hoje+5 dias.
// Inclui despesas aprovadas com abater_em='aluguel' (extras/abatimento)
// e gera cobrança no Asaas.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sb(path: string, init: RequestInit = {}) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(init.headers || {}),
    },
  })
}

async function asaas(path: string, init: RequestInit = {}) {
  const ASAAS_BASE = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3'
  const ASAAS_KEY = Deno.env.get('ASAAS_API_KEY')!
  return fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: {
      'access_token': ASAAS_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function garantirCustomer(locatario: any) {
  if (locatario.asaas_customer_id) return locatario.asaas_customer_id
  // Tenta achar por CPF
  if (locatario.cpf_cnpj) {
    const cpfClean = locatario.cpf_cnpj.replace(/\D/g, '')
    const lookup = await asaas(`/customers?cpfCnpj=${cpfClean}`)
    const lookupData = await lookup.json().catch(() => ({}))
    if (lookup.ok && Array.isArray(lookupData?.data) && lookupData.data.length > 0) {
      const customerId = lookupData.data[0].id
      await sb(`/rest/v1/contratos_partes?id=eq.${locatario.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ asaas_customer_id: customerId }),
      })
      return customerId
    }
  }
  // Cria novo
  const cust = await asaas('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: locatario.nome,
      cpfCnpj: (locatario.cpf_cnpj || '').replace(/\D/g, ''),
      email: locatario.email || undefined,
      mobilePhone: locatario.telefone ? locatario.telefone.replace(/\D/g, '') : undefined,
      externalReference: locatario.id,
    }),
  })
  const custData = await cust.json()
  if (!cust.ok) throw new Error(`Asaas customer: ${JSON.stringify(custData)}`)
  await sb(`/rest/v1/contratos_partes?id=eq.${locatario.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ asaas_customer_id: custData.id }),
  })
  return custData.id
}

async function processarContrato(c: any, ano: number, mes: number, dryRun: boolean): Promise<{ ok: boolean; motivo?: string; cobranca_id?: string; payment_id?: string; valor_total?: number }> {
  const dia = c.dia_vencimento || 5
  const mesStr = String(mes).padStart(2, '0')
  const diaStr = String(dia).padStart(2, '0')
  const vencimento = `${ano}-${mesStr}-${diaStr}`
  const refMes = `${ano}-${mesStr}`

  // Já existe?
  const exRes = await sb(`/rest/v1/contratos_cobrancas?contrato_id=eq.${c.id}&referencia_mes=eq.${refMes}&select=id`)
  const ex = await exRes.json()
  if (Array.isArray(ex) && ex.length > 0) {
    return { ok: false, motivo: `já existe cobrança pra ${refMes}` }
  }

  // Locatário
  const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${c.id}&papel=in.(locatario,hospede)&select=id,nome,cpf_cnpj,email,telefone,asaas_customer_id&order=ordem&limit=1`)
  const partes = await pRes.json()
  const locatario = partes[0]
  if (!locatario) return { ok: false, motivo: 'locatário não cadastrado' }
  if (!locatario.cpf_cnpj) return { ok: false, motivo: 'locatário sem CPF/CNPJ' }

  // Despesas aprovadas/executadas pendentes (abater_em='aluguel')
  const dRes = await sb(`/rest/v1/contratos_despesas?contrato_id=eq.${c.id}&abater_em=eq.aluguel&status=in.(aprovada,executada)&cobranca_id=is.null&select=id,quem_paga,valor,saldo_pendente,descricao`)
  const despesas: any[] = await dRes.json().catch(() => [])

  const valorBase = Number(c.valor_aluguel || 0) + Number(c.valor_condominio || 0) + Number(c.valor_iptu || 0) + Number(c.valor_outros || 0)
  let valorExtras = 0
  let valorAbatimento = 0
  const descExtrasArr: string[] = []
  const descAbatArr: string[] = []
  const despesasAbatidas: any[] = []
  for (const d of despesas) {
    const valDespesa = Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor)
    if (d.quem_paga === 'locatario') {
      valorExtras += valDespesa
      descExtrasArr.push(d.descricao)
      despesasAbatidas.push({ ...d, val: valDespesa })
    } else if (d.quem_paga === 'locador') {
      valorAbatimento += valDespesa
      descAbatArr.push(d.descricao)
      despesasAbatidas.push({ ...d, val: valDespesa })
    }
  }

  // Limita abatimento a (valorBase + valorExtras)
  const totalAntes = valorBase + valorExtras
  let abatimentoAplicado = valorAbatimento
  let saldoAbatimentoSobra = 0
  if (valorAbatimento > totalAntes) {
    abatimentoAplicado = totalAntes
    saldoAbatimentoSobra = valorAbatimento - totalAntes
  }
  const valorTotal = Math.max(0, totalAntes - abatimentoAplicado)

  if (dryRun) {
    return {
      ok: true,
      motivo: 'dry_run',
      valor_total: valorTotal,
    }
  }

  if (valorTotal <= 0) {
    return { ok: false, motivo: 'valor zero após abatimento — registrar manualmente' }
  }

  // Garantir customer
  let customerId: string
  try {
    customerId = await garantirCustomer(locatario)
  } catch (err) {
    return { ok: false, motivo: `customer: ${err instanceof Error ? err.message : 'erro'}` }
  }

  // Criar cobrança no Asaas
  const billingType = 'BOLETO'
  const payPayload: any = {
    customer: customerId,
    billingType,
    value: valorTotal,
    dueDate: vencimento,
    description: `Aluguel ${refMes} · Contrato ${c.numero}`,
    externalReference: c.id,
    fine: { value: Number(c.multa_atraso_pct || 2) },
    interest: { value: Number(c.juros_dia_pct || 0.033) * 30 }, // mensal aprox
  }
  const pay = await asaas('/payments', { method: 'POST', body: JSON.stringify(payPayload) })
  const payData = await pay.json()
  if (!pay.ok) {
    return { ok: false, motivo: `Asaas: ${JSON.stringify(payData).slice(0, 300)}` }
  }

  // Pix qrcode (opcional)
  let pixQr: string | null = null
  try {
    const pixRes = await asaas(`/payments/${payData.id}/pixQrCode`)
    if (pixRes.ok) {
      const pixData = await pixRes.json()
      pixQr = pixData.encodedImage || pixData.payload || null
    }
  } catch {/* ignora */}

  // Inserir cobrança
  const cobInsert = await sb(`/rest/v1/contratos_cobrancas`, {
    method: 'POST',
    body: JSON.stringify({
      contrato_id: c.id,
      asaas_payment_id: payData.id,
      asaas_invoice_url: payData.invoiceUrl || null,
      asaas_bank_slip_url: payData.bankSlipUrl || null,
      asaas_pix_qrcode: pixQr,
      valor: valorBase,
      valor_extras: valorExtras,
      descricao_extras: descExtrasArr.join(' · ') || null,
      valor_abatimento: abatimentoAplicado,
      descricao_abatimento: descAbatArr.join(' · ') || null,
      vencimento,
      status: 'pendente',
      referencia_mes: refMes,
      enviado_em: new Date().toISOString(),
    }),
  })
  const cobArr = await cobInsert.json()
  const cobranca = Array.isArray(cobArr) ? cobArr[0] : cobArr
  if (!cobranca?.id) return { ok: false, motivo: 'falha ao inserir cobranca' }

  // Vincular despesas
  for (const d of despesasAbatidas) {
    await sb(`/rest/v1/contratos_despesas?id=eq.${d.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ cobranca_id: cobranca.id, saldo_pendente: 0 }),
    })
  }
  // Saldo de sobra de abatimento — distribui na primeira despesa locador
  if (saldoAbatimentoSobra > 0) {
    const primeira = despesasAbatidas.find((d) => d.quem_paga === 'locador')
    if (primeira) {
      await sb(`/rest/v1/contratos_despesas?id=eq.${primeira.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ saldo_pendente: saldoAbatimentoSobra, cobranca_id: null }),
      })
    }
  }

  await sb(`/rest/v1/contratos_eventos`, {
    method: 'POST',
    body: JSON.stringify({
      contrato_id: c.id,
      tipo: 'observacao',
      descricao: `Cobrança ${refMes} gerada · ${valorTotal.toFixed(2)} · vence ${vencimento}`,
      metadados: { payment_id: payData.id, valor_total: valorTotal },
    }),
  })

  return { ok: true, cobranca_id: cobranca.id, payment_id: payData.id, valor_total: valorTotal }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = !!body.dry_run

    let ano = body.ano as number | undefined
    let mes = body.mes as number | undefined
    if (!ano || !mes) {
      // Próximo mês cujo vencimento está em <= 5 dias
      const hoje = new Date()
      // Tenta o mês corrente; se já passou do dia ou falta > 5 dias, vai pro próximo
      ano = hoje.getFullYear()
      mes = hoje.getMonth() + 1
    }

    let q = `/rest/v1/contratos_locacao?cobranca_modo=eq.automatica&select=id,numero,valor_aluguel,valor_condominio,valor_iptu,valor_outros,dia_vencimento,multa_atraso_pct,juros_dia_pct,status,tipo`
    if (body.contrato_id) q += `&id=eq.${body.contrato_id}`
    else q += `&status=in.(ativo,inadimplente)`

    const cRes = await sb(q)
    const contratos = await cRes.json()
    if (!Array.isArray(contratos)) return json({ error: 'falha listar contratos', detail: contratos }, 500)

    const hoje = new Date()
    const hojeStr = hoje.toISOString().slice(0, 10)
    const geradas: any[] = []
    const puladas: any[] = []
    const erros: any[] = []

    for (const c of contratos) {
      const dia = c.dia_vencimento || 5
      const venc = new Date(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}T12:00:00`)
      const diff = (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      // Se forçaram contrato_id, não filtra janela
      if (!body.contrato_id && diff > 5) {
        puladas.push({ contrato_id: c.id, motivo: `vencimento em ${diff.toFixed(0)}d > 5` })
        continue
      }
      try {
        const r = await processarContrato(c, ano!, mes!, dryRun)
        if (r.ok) geradas.push({ contrato_id: c.id, numero: c.numero, ...r })
        else puladas.push({ contrato_id: c.id, numero: c.numero, motivo: r.motivo })
      } catch (err) {
        erros.push({ contrato_id: c.id, erro: err instanceof Error ? err.message : 'erro' })
      }
    }

    return json({
      ok: true,
      ano,
      mes,
      hoje: hojeStr,
      total: contratos.length,
      geradas: geradas.length,
      puladas: puladas.length,
      erros: erros.length,
      detalhes: { geradas, puladas, erros },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})
