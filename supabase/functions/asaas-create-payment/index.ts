// Edge Function — Cria cobrança AVULSA (manual) no Asaas
// Body: { contrato_id, valor?, vencimento?, descricao? }
// Diferente de asaas-create-subscription: gera UMA cobrança só, sem recorrência.

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST')   return json({ error: 'Method not allowed' }, 405)

  try {
    const { contrato_id, valor: valorIn, vencimento: vencIn, descricao } = await req.json()
    if (!contrato_id) return json({ error: 'contrato_id obrigatório' }, 400)

    const cRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=id,numero,valor_aluguel,valor_condominio,valor_iptu,valor_outros,dia_vencimento`)
    const cArr = await cRes.json()
    const c = cArr[0]
    if (!c) return json({ error: 'Contrato não encontrado' }, 404)

    const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${contrato_id}&papel=eq.locatario&select=id,nome,cpf_cnpj,email,telefone,asaas_customer_id&order=ordem&limit=1`)
    const partes = await pRes.json()
    const locatario = partes[0]
    if (!locatario) return json({ error: 'Locatário não cadastrado' }, 400)
    if (!locatario.cpf_cnpj) return json({ error: 'Locatário sem CPF/CNPJ' }, 400)

    // Garantir customer
    let customerId = locatario.asaas_customer_id
    if (!customerId) {
      const cust = await asaas('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: locatario.nome,
          cpfCnpj: locatario.cpf_cnpj.replace(/\D/g, ''),
          email: locatario.email || undefined,
          mobilePhone: locatario.telefone ? locatario.telefone.replace(/\D/g, '') : undefined,
          externalReference: locatario.id,
        }),
      })
      const custData = await cust.json()
      if (!cust.ok) return json({ error: 'Asaas customer erro', detail: custData }, cust.status)
      customerId = custData.id
      await sb(`/rest/v1/contratos_partes?id=eq.${locatario.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ asaas_customer_id: customerId }),
      })
    }

    // Defaults
    const valor = Number(valorIn) || (
      Number(c.valor_aluguel || 0) + Number(c.valor_condominio || 0) +
      Number(c.valor_iptu || 0) + Number(c.valor_outros || 0)
    )
    let vencimento = vencIn
    if (!vencimento) {
      const hoje = new Date()
      const next = new Date(hoje.getFullYear(), hoje.getMonth(), c.dia_vencimento || 5)
      if (next <= hoje) next.setMonth(next.getMonth() + 1)
      vencimento = next.toISOString().split('T')[0]
    }

    // Buscar proprietários pra Split
    const splitArr: Array<{ walletId: string; fixedValue?: number }> = []
    const cImovelRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=imovel_id,taxa_admin_pct,taxa_admin_minima,valor_aluguel`)
    const cImovel = (await cImovelRes.json())[0]
    if (cImovel?.imovel_id) {
      const propRes = await sb(`/rest/v1/imoveis_proprietarios?imovel_id=eq.${cImovel.imovel_id}&select=participacao_pct,proprietarios(asaas_wallet_id,repasse_modo)`)
      const props = await propRes.json()
      const taxaPct = Number(cImovel.taxa_admin_pct || 10) / 100
      const taxaMin = Number(cImovel.taxa_admin_minima || 0)
      const taxaCalc = Math.max(Number(cImovel.valor_aluguel || 0) * taxaPct, taxaMin)
      const valorRepassavel = valor - taxaCalc
      for (const ip of props || []) {
        const prop = ip.proprietarios as any
        if (prop?.asaas_wallet_id && prop?.repasse_modo === 'split') {
          const partic = Number(ip.participacao_pct || 100) / 100
          splitArr.push({
            walletId: prop.asaas_wallet_id,
            fixedValue: Math.round(valorRepassavel * partic * 100) / 100,
          })
        }
      }
    }

    // Criar cobrança avulsa
    const payPayload: any = {
      customer: customerId,
      billingType: 'BOLETO',
      value: valor,
      dueDate: vencimento,
      description: descricao || `Cobrança avulsa · Contrato ${c.numero}`,
      externalReference: contrato_id,
      fine:     { value: 2 },
      interest: { value: 1 },
    }
    if (splitArr.length > 0) payPayload.split = splitArr

    const pay = await asaas('/payments', {
      method: 'POST',
      body: JSON.stringify(payPayload),
    })
    const payData = await pay.json()
    if (!pay.ok) return json({ error: 'Asaas payment erro', detail: payData }, pay.status)

    // Salvar cobrança no banco (webhook PAYMENT_CREATED também faz isso, redundância segura)
    await sb(`/rest/v1/contratos_cobrancas`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id,
        asaas_payment_id: payData.id,
        asaas_invoice_url: payData.invoiceUrl || null,
        asaas_bank_slip_url: payData.bankSlipUrl || null,
        valor,
        vencimento,
        status: payData.status || 'PENDING',
      }),
    })

    await sb(`/rest/v1/contratos_eventos`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id,
        tipo: 'observacao',
        descricao: `Cobrança avulsa criada · ${valor.toFixed(2)} · vence ${vencimento}`,
        metadados: { payment_id: payData.id, customer_id: customerId },
      }),
    })

    return json({
      ok: true,
      payment_id: payData.id,
      invoice_url: payData.invoiceUrl,
      bank_slip_url: payData.bankSlipUrl,
      valor,
      vencimento,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
