// Edge Function — Webhook do Google Calendar (push notifications) + sync incremental
//
// Headers que o Google envia:
//   X-Goog-Channel-ID    -> channel UUID que registramos no events.watch
//   X-Goog-Resource-ID   -> opaque resource id (mesmo channel)
//   X-Goog-Resource-State -> 'sync' | 'exists' | 'not_exists'
//   X-Goog-Channel-Token -> opcional, no nosso caso = users_profiles.id
//
// Tambem aceita POST manual { manual_user_id } pra trigger via gcal-sync-now.
//
// Logica:
// 1. Identifica corretor pelo channel_id (ou token)
// 2. GET events.list?syncToken=<gcal_sync_token> -> mudancas incrementais
// 3. Salva nextSyncToken
// 4. Pra cada evento:
//    - status=cancelled -> marca visita como cancelada
//    - tem extendedProperties.private.moradda_visita_id -> evento veio do painel,
//      atualiza dados existentes, nunca cria nova (evita loop)
//    - existe visita com google_event_id -> UPDATE
//    - nao existe E tem location -> CREATE com precisa_revisao=true
//    - sem location -> ignora (nao eh visita imobiliaria)

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
  if (!res.ok) {
    console.error('refresh_token falhou:', data)
    return null
  }
  return data.access_token as string
}

interface GoogleEvent {
  id: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
  summary?: string
  description?: string
  location?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  attendees?: Array<{ email?: string; displayName?: string }>
  extendedProperties?: { private?: Record<string, string> }
  organizer?: { email?: string }
  htmlLink?: string
}

interface UserProfile {
  id: string
  nome?: string
  gcal_refresh_token: string
  gcal_calendar_id: string
  gcal_sync_token: string | null
}

async function syncCalendar(profile: UserProfile, accessToken: string): Promise<{
  processed: number
  created: number
  updated: number
  cancelled: number
  newSyncToken: string | null
  errors: string[]
}> {
  const calendarId = profile.gcal_calendar_id || 'primary'
  const errors: string[] = []
  let processed = 0
  let created = 0
  let updated = 0
  let cancelled = 0
  let newSyncToken: string | null = null
  let pageToken: string | null = null
  let useSyncToken = profile.gcal_sync_token

  for (let safetyLoop = 0; safetyLoop < 20; safetyLoop++) {
    const params = new URLSearchParams()
    if (useSyncToken && !pageToken) {
      params.set('syncToken', useSyncToken)
    } else if (!useSyncToken) {
      // Full sync inicial (ou apos 410): janela curta de 7 dias atras pra
      // frente. Mantem a primeira sync rapida — sync_token sera salvo e a
      // partir dai sao incrementais (so deltas).
      const timeMin = new Date(Date.now() - 7 * 86400000).toISOString()
      params.set('timeMin', timeMin)
      params.set('singleEvents', 'true')
      params.set('orderBy', 'startTime')
    }
    if (pageToken) params.set('pageToken', pageToken)
    params.set('maxResults', '100')

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })

    if (res.status === 410) {
      // syncToken invalido (>30 dias inativo) -> redo full sync
      console.warn('[gcal-webhook] syncToken invalido (410), refazendo full sync')
      useSyncToken = null
      pageToken = null
      continue
    }
    if (!res.ok) {
      const txt = await res.text()
      errors.push(`events.list ${res.status}: ${txt.slice(0, 200)}`)
      break
    }

    const data = await res.json() as {
      items?: GoogleEvent[]
      nextPageToken?: string
      nextSyncToken?: string
    }

    for (const ev of data.items || []) {
      try {
        const action = await processEvent(profile, ev)
        processed++
        if (action === 'created') created++
        else if (action === 'updated') updated++
        else if (action === 'cancelled') cancelled++
      } catch (err) {
        errors.push(`event ${ev.id}: ${err instanceof Error ? err.message : 'erro'}`)
      }
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken
      continue
    }
    newSyncToken = data.nextSyncToken || null
    break
  }

  return { processed, created, updated, cancelled, newSyncToken, errors }
}

type ProcessAction = 'skipped' | 'created' | 'updated' | 'cancelled'

async function processEvent(profile: UserProfile, ev: GoogleEvent): Promise<ProcessAction> {
  // 1. Cancelamento -> marca visita correspondente como cancelada
  if (ev.status === 'cancelled') {
    const r = await sb(`/rest/v1/visitas?google_event_id=eq.${encodeURIComponent(ev.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelada' }),
    })
    // 204 com 0 rows quando nao tinha visita relacionada — conta como skipped
    return r.ok ? 'cancelled' : 'skipped'
  }

  const startIso = ev.start?.dateTime || (ev.start?.date ? `${ev.start.date}T00:00:00-03:00` : null)
  const endIso = ev.end?.dateTime || (ev.end?.date ? `${ev.end.date}T23:59:59-03:00` : null)
  if (!startIso) return 'skipped'

  const duracaoMin = endIso
    ? Math.max(15, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000))
    : 60

  const moraddaVisitaId = ev.extendedProperties?.private?.moradda_visita_id
  const hasLocation = !!(ev.location && ev.location.trim())

  // FAST PATH: evento SEM endereco e sem moradda_visita_id -> nao eh
  // visita, sai sem tocar no DB. Corta ~80% dos eventos no full sync.
  if (!hasLocation && !moraddaVisitaId) {
    return 'skipped'
  }

  // Visita ja existe com esse google_event_id?
  const findRes = await sb(`/rest/v1/visitas?google_event_id=eq.${encodeURIComponent(ev.id)}&select=id`)
  const findArr = await findRes.json() as Array<{ id: string }>
  const existing = findArr?.[0]

  if (existing) {
    // UPDATE - reflete edicao feita direto no Google
    await sb(`/rest/v1/visitas?id=eq.${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data_hora: startIso,
        duracao_min: duracaoMin,
        observacoes: ev.description || null,
        endereco_evento: ev.location || null,
      }),
    })
    return 'updated'
  }

  // Evento criado pelo painel mas visita foi deletada (orphan) -> ignora
  if (moraddaVisitaId) {
    return 'skipped'
  }

  // Evento externo SEM endereco -> nao eh visita, ignora
  if (!hasLocation) {
    return 'skipped'
  }

  // 5. CRIA visita nova com flag precisa_revisao
  const attendee = (ev.attendees || []).find((a) => a.email && a.email !== ev.organizer?.email)
  const clienteNome = attendee?.displayName || attendee?.email || ev.summary?.slice(0, 100) || 'Importado do Google'
  const clienteEmail = attendee?.email || null

  await sb(`/rest/v1/visitas`, {
    method: 'POST',
    body: JSON.stringify({
      corretor_id: profile.id,
      data_hora: startIso,
      duracao_min: duracaoMin,
      cliente_nome: clienteNome,
      cliente_email: clienteEmail,
      observacoes: ev.description || ev.summary || null,
      endereco_evento: ev.location,
      status: 'agendada',
      google_event_id: ev.id,
      google_calendar_id: profile.gcal_calendar_id || 'primary',
      imported_from_google: true,
      precisa_revisao: true,
    }),
  })
  return 'created'
}

async function syncForUser(userId: string): Promise<{ ok: boolean; processed?: number; created?: number; updated?: number; cancelled?: number; errors?: string[]; reason?: string }> {
  const pRes = await sb(`/rest/v1/users_profiles?id=eq.${userId}&select=id,nome,gcal_refresh_token,gcal_calendar_id,gcal_sync_token`)
  const pArr = await pRes.json() as UserProfile[]
  const profile = pArr?.[0]
  if (!profile || !profile.gcal_refresh_token) {
    return { ok: false, reason: 'usuario_sem_gcal' }
  }

  const accessToken = await refreshAccessToken(profile.gcal_refresh_token)
  if (!accessToken) return { ok: false, reason: 'refresh_falhou' }

  const result = await syncCalendar(profile, accessToken)

  if (result.newSyncToken) {
    await sb(`/rest/v1/users_profiles?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ gcal_sync_token: result.newSyncToken }),
    })
  }

  return {
    ok: true,
    processed: result.processed,
    created: result.created,
    updated: result.updated,
    cancelled: result.cancelled,
    errors: result.errors,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  // POST manual com body { manual_user_id } (gcal-sync-now usa esse caminho)
  if (req.method === 'POST') {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      try {
        const body = await req.json()
        if (body?.manual_user_id) {
          const r = await syncForUser(body.manual_user_id)
          return new Response(JSON.stringify(r), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } catch {
        // continua pro fluxo de webhook abaixo
      }
    }
  }

  try {
    const channelId = req.headers.get('x-goog-channel-id') || ''
    const channelToken = req.headers.get('x-goog-channel-token') || ''
    const resourceState = req.headers.get('x-goog-resource-state') || ''

    console.log('[gcal-webhook]', { channelId, resourceState })

    // Sync inicial (Google manda assim que o watch eh criado) -> apenas confirma
    if (resourceState === 'sync') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }

    // Identifica user pelo channel_id (ou token como fallback)
    let userId = ''
    if (channelToken && channelToken.length === 36) {
      userId = channelToken
    } else if (channelId) {
      const pRes = await sb(`/rest/v1/users_profiles?gcal_channel_id=eq.${channelId}&select=id`)
      const pArr = await pRes.json()
      userId = pArr?.[0]?.id || ''
    }

    if (!userId) {
      console.warn('[gcal-webhook] usuario nao encontrado pra channel_id=', channelId)
      return new Response(null, { status: 200, headers: corsHeaders })
    }

    const result = await syncForUser(userId)
    console.log('[gcal-webhook] sync:', result)

    return new Response(null, { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[gcal-webhook] erro:', err)
    // Sempre 200 pra Google nao retentar pelo nosso bug
    return new Response(null, { status: 200, headers: corsHeaders })
  }
})
