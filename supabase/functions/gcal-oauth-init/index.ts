// Edge Function — Inicia fluxo OAuth do Google Calendar
// GET com Authorization: Bearer <user_jwt>
// Retorna: { url } — URL de consentimento Google

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// HMAC-SHA256 para assinar state — chave = SUPABASE_SERVICE_ROLE_KEY
async function signState(payload: string): Promise<string> {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(payload))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${payloadB64}.${sigB64}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI')
    if (!CLIENT_ID || !REDIRECT_URI) {
      return json({ error: 'GOOGLE_CLIENT_ID/GOOGLE_REDIRECT_URI não configurados' }, 500)
    }

    // Pega JWT do header
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return json({ error: 'Authorization Bearer ausente' }, 401)

    // Valida JWT pelo endpoint do Supabase Auth (v1/user)
    const userRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!userRes.ok) return json({ error: 'JWT inválido' }, 401)
    const userJson = await userRes.json()
    const user_id = userJson.id as string
    if (!user_id) return json({ error: 'user_id não encontrado' }, 401)

    // Pega user_profile_id
    const profRes = await sb(`/rest/v1/users_profiles?user_id=eq.${user_id}&select=id`)
    const profArr = await profRes.json()
    const user_profile_id = profArr?.[0]?.id
    if (!user_profile_id) return json({ error: 'Perfil não encontrado' }, 404)

    // State assinado HMAC: { user_profile_id, exp }
    const exp = Math.floor(Date.now() / 1000) + 600 // 10 min
    const statePayload = JSON.stringify({ upid: user_profile_id, exp })
    const state = await signState(statePayload)

    const scope = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.freebusy',
      'openid',
      'email',
    ].join(' ')

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
      state,
      include_granted_scopes: 'true',
    })

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    return json({ url })
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
