// Edge Function — Calcula slots livres do corretor cruzando:
//   1. corretor_disponibilidade (regras semanais)
//   2. visitas no painel (bloqueia slots ocupados)
//   3. Google Calendar freeBusy (se conectado)
//
// POST body: { user_profile_id, data_inicio, data_fim } (ISO)
// Retorna: { slots: [{start, end}], gcal_connected: bool }

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

interface Disponibilidade {
  dia_semana: number
  hora_inicio: string // 'HH:MM:SS' ou 'HH:MM'
  hora_fim: string
  duracao_visita_min: number
  buffer_min: number
}

interface BusyInterval {
  start: number // ms
  end: number   // ms
}

// Constrói grid de slots usando regras de disponibilidade entre data_inicio e data_fim
function buildSlots(
  disp: Disponibilidade[],
  inicio: Date,
  fim: Date,
): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = []
  const dispByDow = new Map<number, Disponibilidade[]>()
  for (const d of disp) {
    if (!dispByDow.has(d.dia_semana)) dispByDow.set(d.dia_semana, [])
    dispByDow.get(d.dia_semana)!.push(d)
  }

  const cursor = new Date(inicio)
  cursor.setHours(0, 0, 0, 0)
  const stop = new Date(fim)
  while (cursor <= stop) {
    const dow = cursor.getDay()
    const regras = dispByDow.get(dow) || []
    for (const r of regras) {
      const [hi, mi] = r.hora_inicio.split(':').map(Number)
      const [hf, mf] = r.hora_fim.split(':').map(Number)
      const dayStart = new Date(cursor)
      dayStart.setHours(hi, mi, 0, 0)
      const dayEnd = new Date(cursor)
      dayEnd.setHours(hf, mf, 0, 0)
      const stepMin = (r.duracao_visita_min || 60) + (r.buffer_min || 0)
      let s = new Date(dayStart)
      while (s.getTime() + (r.duracao_visita_min || 60) * 60000 <= dayEnd.getTime()) {
        const e = new Date(s.getTime() + (r.duracao_visita_min || 60) * 60000)
        if (e >= inicio && s <= fim) {
          slots.push({ start: new Date(s), end: e })
        }
        s = new Date(s.getTime() + stepMin * 60000)
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return slots
}

function overlap(slotStart: number, slotEnd: number, busy: BusyInterval[]): boolean {
  for (const b of busy) {
    if (slotStart < b.end && slotEnd > b.start) return true
  }
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json()
    const { user_profile_id, data_inicio, data_fim } = body
    if (!user_profile_id || !data_inicio || !data_fim) {
      return json({ error: 'user_profile_id, data_inicio e data_fim obrigatórios' }, 400)
    }

    const inicio = new Date(data_inicio)
    const fim = new Date(data_fim)
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return json({ error: 'data_inicio/data_fim inválidos' }, 400)
    }

    // Pega perfil
    const pRes = await sb(`/rest/v1/users_profiles?id=eq.${user_profile_id}&select=id,gcal_refresh_token,gcal_calendar_id`)
    const pArr = await pRes.json()
    const profile = pArr?.[0]
    if (!profile) return json({ error: 'Perfil não encontrado' }, 404)

    // Pega disponibilidade
    const dRes = await sb(`/rest/v1/corretor_disponibilidade?user_profile_id=eq.${user_profile_id}&ativo=eq.true&select=dia_semana,hora_inicio,hora_fim,duracao_visita_min,buffer_min`)
    const disp = await dRes.json() as Disponibilidade[]

    if (!disp || disp.length === 0) {
      return json({ slots: [], gcal_connected: !!profile.gcal_refresh_token, reason: 'sem_disponibilidade' })
    }

    // Pega visitas existentes (não canceladas) no intervalo
    const vRes = await sb(`/rest/v1/visitas?corretor_id=eq.${user_profile_id}&data_hora=gte.${inicio.toISOString()}&data_hora=lte.${fim.toISOString()}&status=neq.cancelada&select=data_hora,duracao_min`)
    const visitas = await vRes.json() as { data_hora: string; duracao_min: number }[]

    const busy: BusyInterval[] = visitas.map(v => {
      const start = new Date(v.data_hora).getTime()
      return { start, end: start + (v.duracao_min || 60) * 60000 }
    })

    let gcal_connected = false

    // Adiciona busy do Google Calendar se conectado
    if (profile.gcal_refresh_token) {
      const accessToken = await refreshAccessToken(profile.gcal_refresh_token)
      if (accessToken) {
        gcal_connected = true
        const calendarId = profile.gcal_calendar_id || 'primary'
        try {
          const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timeMin: inicio.toISOString(),
              timeMax: fim.toISOString(),
              items: [{ id: calendarId }],
            }),
          })
          const fbData = await fbRes.json()
          const busyArr = fbData?.calendars?.[calendarId]?.busy || []
          for (const b of busyArr) {
            busy.push({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() })
          }
        } catch (e) {
          console.error('freeBusy falhou:', e)
        }
      }
    }

    // Constrói grid e exclui ocupados
    const grid = buildSlots(disp, inicio, fim)
    const now = Date.now()
    const slots = grid
      .filter(s => s.start.getTime() > now) // não mostra slots no passado
      .filter(s => !overlap(s.start.getTime(), s.end.getTime(), busy))
      .map(s => ({ start: s.start.toISOString(), end: s.end.toISOString() }))

    return json({ slots, gcal_connected })
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
