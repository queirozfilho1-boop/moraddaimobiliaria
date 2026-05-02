// Edge Function — Cria cliente + assinatura recorrente no Asaas para um contrato
// Body: { contrato_id }

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
    const { contrato_id } = await req.json()
    if (!contrato_id) return json({ error: 'contrato_id obrigatório' }, 400)

    // Buscar contrato + locatário
    const cRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=id,numero,valor_aluguel,valor_condominio,valor_iptu,valor_outros,dia_vencimento,data_inicio,data_fim,asaas_subscription_id`)
    const cArr = await cRes.json()
    const c = cArr[0]
    if (!c) return json({ error: 'Contrato não encontrado' }, 404)
    if (c.asaas_subscription_id) return json({ error: 'Contrato já tem assinatura Asaas: ' + c.asaas_subscription_id }, 400)

    const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${contrato_id}&papel=eq.locatario&select=id,nome,cpf_cnpj,email,telefone,asaas_customer_id&order=ordem&limit=1`)
    const partes = await pRes.json()
    const locatario = partes[0]
    if (!locatario) return json({ error: 'Locatário não cadastrado' }, 400)
    if (!locatario.cpf_cnpj) return json({ error: 'Locatário sem CPF/CNPJ' }, 400)

    // 1) Criar ou recuperar customer no Asaas
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

    // 2) Calcular próximo vencimento (próximo dia X dentro do prazo)
    const hoje = new Date()
    const inicio = new Date(c.data_inicio)
    const baseDate = inicio > hoje ? inicio : hoje
    const proxVenc = new Date(baseDate.getFullYear(), baseDate.getMonth(), c.dia_vencimento || 5)
    if (proxVenc < baseDate) {
      proxVenc.setMonth(proxVenc.getMonth() + 1)
    }
    const fim = new Date(c.data_fim)

    const valor = Number(c.valor_aluguel || 0) + Number(c.valor_condominio || 0) + Number(c.valor_iptu || 0) + Number(c.valor_outros || 0)

    // 3) Buscar proprietários do imóvel pra montar Split (se houver wallet)
    const cImovelRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=imovel_id,taxa_admin_pct,taxa_admin_minima`)
    const cImovel = (await cImovelRes.json())[0]
    const splitArr: Array<{ walletId: string; fixedValue?: number; percentualValue?: number }> = []
    if (cImovel?.imovel_id) {
      const propRes = await sb(`/rest/v1/imoveis_proprietarios?imovel_id=eq.${cImovel.imovel_id}&select=participacao_pct,proprietario_id,proprietarios(asaas_wallet_id,repasse_modo)`)
      const props = await propRes.json()
      const taxaPct = Number(cImovel.taxa_admin_pct || 10) / 100
      const taxaMin = Number(cImovel.taxa_admin_minima || 0)
      const taxaCalc = Math.max(Number(c.valor_aluguel || 0) * taxaPct, taxaMin)
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

    // 4) Criar assinatura recorrente (boleto + PIX) com Split se aplicável
    const subPayload: any = {
      customer: customerId,
      billingType: 'BOLETO',
      nextDueDate: proxVenc.toISOString().split('T')[0],
      value: valor,
      cycle: 'MONTHLY',
      description: `Aluguel · Contrato ${c.numero}`,
      endDate: fim.toISOString().split('T')[0],
      externalReference: contrato_id,
      fine:     { value: 2 },
      interest: { value: 1 },
    }
    if (splitArr.length > 0) subPayload.split = splitArr

    const sub = await asaas('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subPayload),
    })
    const subData = await sub.json()
    if (!sub.ok) return json({ error: 'Asaas subscription erro', detail: subData }, sub.status)

    // 4) Atualizar contrato
    await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ asaas_subscription_id: subData.id }),
    })
    await sb(`/rest/v1/contratos_eventos`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id,
        tipo: 'observacao',
        descricao: `Assinatura recorrente Asaas criada · ID ${subData.id}`,
        metadados: { subscription_id: subData.id, customer_id: customerId, valor, vencimento: proxVenc.toISOString().split('T')[0] },
      }),
    })

    return json({ ok: true, subscription_id: subData.id, customer_id: customerId, valor, proximo_vencimento: proxVenc.toISOString().split('T')[0] })
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
