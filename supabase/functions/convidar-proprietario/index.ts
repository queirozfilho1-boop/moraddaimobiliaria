// Edge Function — Convida proprietário pro portal
// Cria conta no Supabase Auth (magic link) e vincula auth_user_id ao proprietario
// Body: { proprietario_id }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { proprietario_id } = await req.json()
    if (!proprietario_id) return json({ error: 'proprietario_id obrigatório' }, 400)

    const pRes = await sb(`/rest/v1/proprietarios?id=eq.${proprietario_id}&select=*`)
    const p = (await pRes.json())[0]
    if (!p) return json({ error: 'Proprietário não encontrado' }, 404)
    if (!p.email) return json({ error: 'Proprietário sem e-mail' }, 400)

    // Cria/recupera usuário Auth via Admin API
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Tenta criar (idempotente se já existe)
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: p.email,
        email_confirm: true,
        user_metadata: { nome: p.nome, role: 'proprietario', proprietario_id },
      }),
    })
    let userId: string | null = null
    if (createRes.ok) {
      const u = await createRes.json()
      userId = u.id
    } else {
      // já existe — busca pelo email
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(p.email)}`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
      })
      const list = await listRes.json()
      const found = list.users?.find((u: any) => u.email === p.email)
      if (found) userId = found.id
    }
    if (!userId) return json({ error: 'Não foi possível criar/encontrar usuário Auth' }, 500)

    // Vincula
    await sb(`/rest/v1/proprietarios?id=eq.${proprietario_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ auth_user_id: userId }),
    })

    // Gera magic link
    const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: p.email,
        options: {
          redirect_to: 'https://moradda.com.br/portal',
        },
      }),
    })
    const linkData = await linkRes.json()

    return json({
      ok: true,
      auth_user_id: userId,
      magic_link: linkData.properties?.action_link || null,
      email: p.email,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
