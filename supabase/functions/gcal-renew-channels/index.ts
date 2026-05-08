// Edge Function — Renovacao de channels do Google Calendar (events.watch)
//
// Channels do events.watch expiram em ate 7 dias. Chamada por cron diario
// pra renovar os que vao expirar nas proximas 24h.
//
// Fluxo por usuario:
// 1. Stop do channel antigo (best-effort)
// 2. Cria channel novo via events.watch
// 3. Salva novos channel_id, resource_id, expiration

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
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

async function refreshAccessToken(refresh_token: string): Promise<string | null> {
  const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
  const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token',
    }).toString(),
  })
  const data = await res.json()
  if (!res.ok) return null
  return data.access_token as string
}

interface UserProfile {
  id: string
  nome?: string
  gcal_refresh_token: string
  gcal_calendar_id: string
  gcal_channel_id: string | null
  gcal_resource_id: string | null
  gcal_channel_expiration: string | null
}

async function renewForUser(profile: UserProfile, accessToken: string): Promise<{ ok: boolean; reason?: string }> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const calendarId = profile.gcal_calendar_id || 'primary'

  // 1. Stop do antigo (best-effort)
  if (profile.gcal_channel_id && profile.gcal_resource_id) {
    try {
      await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.gcal_channel_id, resourceId: profile.gcal_resource_id }),
      })
    } catch {
      // best effort, segue
    }
  }

  // 2. Cria novo channel
  const channelId = crypto.randomUUID()
  const watchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: `${SUPABASE_URL}/functions/v1/gcal-webhook`,
        token: profile.id,
        params: { ttl: '604800' },
      }),
    },
  )
  const watchData = await watchRes.json()
  if (!watchRes.ok || !watchData.id || !watchData.resourceId) {
    return { ok: false, reason: JSON.stringify(watchData).slice(0, 200) }
  }

  await sb(`/rest/v1/users_profiles?id=eq.${profile.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      gcal_channel_id: watchData.id,
      gcal_resource_id: watchData.resourceId,
      gcal_channel_expiration: watchData.expiration
        ? new Date(parseInt(watchData.expiration, 10)).toISOString()
        : null,
    }),
  })

  return { ok: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Pega usuarios com:
    // - gcal_refresh_token preenchido (conectados)
    // - gcal_channel_expiration NULL (nunca registrou) OU expira nas proximas 24h
    const limite = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    const filter = `gcal_refresh_token=not.is.null&or=(gcal_channel_expiration.is.null,gcal_channel_expiration.lt.${limite})`
    const pRes = await sb(`/rest/v1/users_profiles?${filter}&select=id,nome,gcal_refresh_token,gcal_calendar_id,gcal_channel_id,gcal_resource_id,gcal_channel_expiration`)
    const profiles = await pRes.json() as UserProfile[]

    const results: Array<{ user: string; ok: boolean; reason?: string }> = []

    for (const profile of profiles) {
      const accessToken = await refreshAccessToken(profile.gcal_refresh_token)
      if (!accessToken) {
        results.push({ user: profile.nome || profile.id, ok: false, reason: 'refresh_falhou' })
        continue
      }
      const r = await renewForUser(profile, accessToken)
      results.push({ user: profile.nome || profile.id, ...r })
    }

    return new Response(JSON.stringify({ count: profiles.length, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
