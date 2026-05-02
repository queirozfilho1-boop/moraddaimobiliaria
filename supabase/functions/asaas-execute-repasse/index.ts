// Edge Function — Executa repasse Transfer (PIX/TED via Asaas)
// Body: { repasse_id }
// Lê dados bancários do proprietário e cria Transfer no Asaas.

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
    const { repasse_id } = await req.json()
    if (!repasse_id) return json({ error: 'repasse_id obrigatório' }, 400)

    const rRes = await sb(`/rest/v1/contratos_repasses?id=eq.${repasse_id}&select=*,proprietarios(*)`)
    const arr = await rRes.json()
    const r = arr[0]
    if (!r) return json({ error: 'Repasse não encontrado' }, 404)
    if (r.status === 'concluido') return json({ error: 'Repasse já concluído' }, 400)
    const prop = r.proprietarios
    if (!prop) return json({ error: 'Proprietário não vinculado' }, 400)

    // Marca como processando
    await sb(`/rest/v1/contratos_repasses?id=eq.${repasse_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'processando' }),
    })

    let transferPayload: any = {
      value: Number(r.valor_repasse),
      description: `Repasse · Contrato · Ref ${r.data_referencia}`,
      externalReference: repasse_id,
    }

    if (prop.pix_chave && prop.pix_tipo) {
      transferPayload.pixAddressKey = prop.pix_chave
      transferPayload.pixAddressKeyType = (() => {
        const t = prop.pix_tipo.toLowerCase()
        if (t === 'cpf') return 'CPF'
        if (t === 'cnpj') return 'CNPJ'
        if (t === 'email') return 'EMAIL'
        if (t === 'telefone') return 'PHONE'
        return 'EVP'
      })()
      transferPayload.operationType = 'PIX'
    } else if (prop.banco && prop.agencia && prop.conta) {
      transferPayload.bankAccount = {
        bank: { code: prop.banco },
        accountName: prop.nome,
        ownerName: prop.nome,
        ownerBirthDate: prop.data_nascimento || undefined,
        cpfCnpj: (prop.cpf_cnpj || '').replace(/\D/g, ''),
        agency: (prop.agencia || '').replace(/\D/g, ''),
        account: (prop.conta || '').split('-')[0].replace(/\D/g, ''),
        accountDigit: (prop.conta || '').includes('-') ? prop.conta.split('-')[1].replace(/\D/g, '') : '',
        bankAccountType: prop.conta_tipo === 'poupanca' ? 'SAVINGS' : 'CHECKING',
      }
      transferPayload.operationType = 'TED'
    } else {
      await sb(`/rest/v1/contratos_repasses?id=eq.${repasse_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'falhou', observacoes: 'Proprietário sem PIX nem dados bancários' }),
      })
      return json({ error: 'Proprietário sem PIX nem dados bancários cadastrados' }, 400)
    }

    const tr = await asaas('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferPayload),
    })
    const trData = await tr.json()
    if (!tr.ok) {
      await sb(`/rest/v1/contratos_repasses?id=eq.${repasse_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'falhou', observacoes: JSON.stringify(trData).slice(0, 500) }),
      })
      return json({ error: 'Asaas transfer erro', detail: trData }, tr.status)
    }

    await sb(`/rest/v1/contratos_repasses?id=eq.${repasse_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'concluido',
        asaas_transfer_id: trData.id,
        data_repasse: new Date().toISOString(),
      }),
    })

    await sb(`/rest/v1/contratos_eventos`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: r.contrato_id,
        tipo: 'observacao',
        descricao: `Repasse de ${r.valor_repasse} executado · Asaas transfer ${trData.id}`,
        metadados: { transfer_id: trData.id, valor: r.valor_repasse },
      }),
    })

    return json({ ok: true, transfer_id: trData.id, valor: r.valor_repasse })
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
