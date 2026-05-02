// Edge Function — Cria SUBCONTA Asaas pra um proprietário, retorna walletId pra Split.
// Body: { proprietario_id }
// Atualiza proprietarios com asaas_account_id + asaas_wallet_id

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
    const { proprietario_id } = await req.json()
    if (!proprietario_id) return json({ error: 'proprietario_id obrigatório' }, 400)

    const pRes = await sb(`/rest/v1/proprietarios?id=eq.${proprietario_id}&select=*`)
    const arr = await pRes.json()
    const p = arr[0]
    if (!p) return json({ error: 'Proprietário não encontrado' }, 404)
    if (p.asaas_account_id) return json({ ok: true, already_exists: true, account_id: p.asaas_account_id, wallet_id: p.asaas_wallet_id })
    if (!p.cpf_cnpj) return json({ error: 'Proprietário sem CPF/CNPJ' }, 400)
    if (!p.email)    return json({ error: 'Proprietário sem e-mail' }, 400)

    const cleanDoc = String(p.cpf_cnpj).replace(/\D/g, '')
    const isPF = cleanDoc.length === 11

    // Cria subconta no Asaas
    const acc = await asaas('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        name: p.nome,
        email: p.email,
        cpfCnpj: cleanDoc,
        birthDate: p.data_nascimento || undefined,
        companyType: isPF ? undefined : 'LIMITED',
        phone: p.telefone ? p.telefone.replace(/\D/g, '') : undefined,
        mobilePhone: p.telefone ? p.telefone.replace(/\D/g, '') : undefined,
        address: p.endereco || 'Endereço não informado',
        addressNumber: p.numero || 'S/N',
        complement: p.complemento || undefined,
        province: p.bairro || undefined,
        postalCode: p.cep ? p.cep.replace(/\D/g, '') : '00000000',
        site: undefined,
        externalReference: proprietario_id,
      }),
    })
    const accData = await acc.json()
    if (!acc.ok) return json({ error: 'Asaas account erro', detail: accData }, acc.status)

    await sb(`/rest/v1/proprietarios?id=eq.${proprietario_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        asaas_account_id: accData.id,
        asaas_wallet_id: accData.walletId || accData.id,
        repasse_modo: 'split',
      }),
    })

    return json({
      ok: true,
      account_id: accData.id,
      wallet_id: accData.walletId || accData.id,
      onboarding_url: accData.loginEmailToken ? `https://www.asaas.com/login?token=${accData.loginEmailToken}` : null,
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
