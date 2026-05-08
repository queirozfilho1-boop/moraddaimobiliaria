// Edge Function — Trigger manual de sync do Google Calendar
//
// Chamada autenticada do painel (botao "Sincronizar com Google agora").
// Valida o user logado, identifica o user_id do perfil e dispara sync
// via gcal-webhook (POST { manual_user_id }).

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
      ...(init.headers || {}),
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    // Identifica usuario via JWT do client (apikey vem no Authorization)
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Sem token' }, 401)

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': ANON_KEY },
    })
    const userData = await userRes.json()
    if (!userRes.ok || !userData?.id) return json({ error: 'Token invalido' }, 401)

    // Pega o id do users_profiles correspondente
    const pRes = await sb(`/rest/v1/users_profiles?user_id=eq.${userData.id}&select=id,gcal_refresh_token`)
    const pArr = await pRes.json()
    const profile = pArr?.[0]
    if (!profile) return json({ error: 'Perfil nao encontrado' }, 404)
    if (!profile.gcal_refresh_token) {
      return json({ error: 'Google Calendar nao esta conectado. Conecte em Perfil primeiro.' }, 400)
    }

    // Dispara sync via webhook (mesmo codigo)
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const syncRes = await fetch(`${SUPABASE_URL}/functions/v1/gcal-webhook`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ manual_user_id: profile.id }),
    })
    const syncData = await syncRes.json().catch(() => ({}))

    return json({ ok: true, sync: syncData })
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
