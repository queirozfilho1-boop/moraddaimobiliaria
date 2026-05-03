// Edge Function — Callback OAuth do Google Calendar
// GET ?code=...&state=...  (Google redireciona aqui)
// Salva refresh_token e redireciona pro painel

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

async function verifyState(state: string): Promise<{ upid: string; exp: number } | null> {
  try {
    const [payloadB64, sigB64] = state.split('.')
    if (!payloadB64 || !sigB64) return null
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const enc = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    )
    const payload = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const ok = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, enc.encode(payload))
    if (!ok) return null
    const data = JSON.parse(payload) as { upid: string; exp: number }
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return data
  } catch {
    return null
  }
}

const PAINEL_URL = 'https://moraddaimobiliaria.com.br/painel/perfil'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 })

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const errParam = url.searchParams.get('error')

    if (errParam) return Response.redirect(`${PAINEL_URL}?gcal=error&reason=${encodeURIComponent(errParam)}`, 302)
    if (!code || !state) return Response.redirect(`${PAINEL_URL}?gcal=error&reason=missing_params`, 302)

    const stateData = await verifyState(state)
    if (!stateData) return Response.redirect(`${PAINEL_URL}?gcal=error&reason=invalid_state`, 302)

    const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
    const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
    const REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI')!

    // Troca code por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error('Token exchange falhou:', tokenData)
      return Response.redirect(`${PAINEL_URL}?gcal=error&reason=token_exchange&detail=${encodeURIComponent(JSON.stringify(tokenData).slice(0, 200))}`, 302)
    }

    const accessToken = tokenData.access_token as string
    const refreshToken = tokenData.refresh_token as string

    // Pega email
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    const userInfo = await userInfoRes.json()
    const gcal_email = userInfo.email as string

    // Atualiza users_profiles
    const upRes = await sb(`/rest/v1/users_profiles?id=eq.${stateData.upid}`, {
      method: 'PATCH',
      body: JSON.stringify({
        gcal_email,
        gcal_refresh_token: refreshToken,
        gcal_calendar_id: 'primary',
        gcal_connected_at: new Date().toISOString(),
      }),
    })
    if (!upRes.ok) {
      const txt = await upRes.text()
      console.error('Update profile falhou:', txt)
      return Response.redirect(`${PAINEL_URL}?gcal=error&reason=db_update`, 302)
    }

    return Response.redirect(`${PAINEL_URL}?gcal=connected`, 302)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return Response.redirect(`${PAINEL_URL}?gcal=error&reason=${encodeURIComponent(msg)}`, 302)
  }
})
