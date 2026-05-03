// Edge Function — Gera UMA cobrança específica (manual)
// Body: { contrato_id, vencimento, valor_extras?, descricao_extras?, valor_abatimento?, descricao_abatimento?, despesas_ids?: string[], billing_type? }

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json()
    const {
      contrato_id, vencimento, valor_extras: valExtrasIn = 0, descricao_extras: descExtrasIn,
      valor_abatimento: valAbatIn = 0, descricao_abatimento: descAbatIn,
      despesas_ids = [], billing_type = 'BOLETO',
    } = body
    if (!contrato_id) return json({ error: 'contrato_id obrigatório' }, 400)
    if (!vencimento) return json({ error: 'vencimento obrigatório' }, 400)

    const cRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=id,numero,valor_aluguel,valor_condominio,valor_iptu,valor_outros,dia_vencimento,multa_atraso_pct,juros_dia_pct`)
    const cArr = await cRes.json()
    const c = cArr[0]
    if (!c) return json({ error: 'Contrato não encontrado' }, 404)

    const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${contrato_id}&papel=in.(locatario,hospede)&select=id,nome,cpf_cnpj,email,telefone,asaas_customer_id&order=ordem&limit=1`)
    const partes = await pRes.json()
    const locatario = partes[0]
    if (!locatario) return json({ error: 'Locatário não cadastrado' }, 400)
    if (!locatario.cpf_cnpj) return json({ error: 'Locatário sem CPF/CNPJ' }, 400)

    // Buscar despesas selecionadas (pra somar/categorizar)
    let valorExtras = Number(valExtrasIn) || 0
    let valorAbatimento = Number(valAbatIn) || 0
    const descExtrasArr: string[] = []
    const descAbatArr: string[] = []
    if (descExtrasIn) descExtrasArr.push(descExtrasIn)
    if (descAbatIn) descAbatArr.push(descAbatIn)
    const despesasAbatidas: any[] = []

    if (Array.isArray(despesas_ids) && despesas_ids.length > 0) {
      const lista = despesas_ids.map((id: string) => `"${id}"`).join(',')
      const dRes = await sb(`/rest/v1/contratos_despesas?id=in.(${lista})&select=id,quem_paga,valor,saldo_pendente,descricao,status,cobranca_id`)
      const desp = await dRes.json()
      for (const d of desp || []) {
        if (d.cobranca_id) continue
        const v = Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor)
        if (d.quem_paga === 'locatario') {
          valorExtras += v
          descExtrasArr.push(d.descricao)
        } else if (d.quem_paga === 'locador') {
          valorAbatimento += v
          descAbatArr.push(d.descricao)
        }
        despesasAbatidas.push({ ...d, val: v })
      }
    }

    const valorBase = Number(c.valor_aluguel || 0) + Number(c.valor_condominio || 0) + Number(c.valor_iptu || 0) + Number(c.valor_outros || 0)
    const totalAntes = valorBase + valorExtras
    let abatimentoAplicado = valorAbatimento
    let saldoSobra = 0
    if (valorAbatimento > totalAntes) {
      abatimentoAplicado = totalAntes
      saldoSobra = valorAbatimento - totalAntes
    }
    const valorTotal = Math.max(0, totalAntes - abatimentoAplicado)

    if (valorTotal <= 0) {
      return json({ error: 'Valor total ficou zero — abatimento maior que cobrança' }, 400)
    }

    // Customer
    const customerId = await garantirCustomer(locatario)

    // Calcular ref_mes
    const [y, m] = vencimento.split('-')
    const refMes = `${y}-${m}`

    // Já existe pra esse mes?
    const exRes = await sb(`/rest/v1/contratos_cobrancas?contrato_id=eq.${contrato_id}&referencia_mes=eq.${refMes}&select=id`)
    const ex = await exRes.json()
    if (Array.isArray(ex) && ex.length > 0) {
      return json({ error: `já existe cobrança para ${refMes}` }, 400)
    }

    const payPayload: any = {
      customer: customerId,
      billingType: billing_type,
      value: valorTotal,
      dueDate: vencimento,
      description: `Aluguel ${refMes} · Contrato ${c.numero}`,
      externalReference: contrato_id,
      fine: { value: Number(c.multa_atraso_pct || 2) },
      interest: { value: Number(c.juros_dia_pct || 0.033) * 30 },
    }
    const pay = await asaas('/payments', { method: 'POST', body: JSON.stringify(payPayload) })
    const payData = await pay.json()
    if (!pay.ok) return json({ error: 'Asaas payment erro', detail: payData }, pay.status)

    let pixQr: string | null = null
    try {
      const pixRes = await asaas(`/payments/${payData.id}/pixQrCode`)
      if (pixRes.ok) {
        const pixData = await pixRes.json()
        pixQr = pixData.encodedImage || pixData.payload || null
      }
    } catch {/* ignora */}

    const cobInsert = await sb(`/rest/v1/contratos_cobrancas`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id,
        asaas_payment_id: payData.id,
        asaas_invoice_url: payData.invoiceUrl || null,
        asaas_bank_slip_url: payData.bankSlipUrl || null,
        asaas_pix_qrcode: pixQr,
        valor: valorBase,
        valor_extras: valorExtras,
        descricao_extras: descExtrasArr.filter(Boolean).join(' · ') || null,
        valor_abatimento: abatimentoAplicado,
        descricao_abatimento: descAbatArr.filter(Boolean).join(' · ') || null,
        vencimento,
        status: 'pendente',
        referencia_mes: refMes,
        enviado_em: new Date().toISOString(),
      }),
    })
    const cobArr = await cobInsert.json()
    const cobranca = Array.isArray(cobArr) ? cobArr[0] : cobArr

    for (const d of despesasAbatidas) {
      await sb(`/rest/v1/contratos_despesas?id=eq.${d.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ cobranca_id: cobranca.id, saldo_pendente: 0 }),
      })
    }
    if (saldoSobra > 0) {
      const primeira = despesasAbatidas.find((d) => d.quem_paga === 'locador')
      if (primeira) {
        await sb(`/rest/v1/contratos_despesas?id=eq.${primeira.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ saldo_pendente: saldoSobra, cobranca_id: null }),
        })
      }
    }

    await sb(`/rest/v1/contratos_eventos`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id,
        tipo: 'observacao',
        descricao: `Cobrança manual ${refMes} · ${valorTotal.toFixed(2)} · vence ${vencimento}`,
        metadados: { payment_id: payData.id, valor_total: valorTotal },
      }),
    })

    return json({
      ok: true,
      cobranca_id: cobranca.id,
      payment_id: payData.id,
      invoice_url: payData.invoiceUrl,
      bank_slip_url: payData.bankSlipUrl,
      pix_qrcode: pixQr,
      valor_total: valorTotal,
      valor_extras: valorExtras,
      valor_abatimento: abatimentoAplicado,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})
