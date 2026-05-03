// Edge Function — Atualiza ou deleta evento no Google Calendar
// POST body: { visita_id, action: 'update' | 'delete' }

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
  if (!res.ok) return null
  return data.access_token as string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { visita_id, action } = await req.json()
    if (!visita_id || !action) return json({ error: 'visita_id e action obrigatórios' }, 400)
    if (action !== 'update' && action !== 'delete') return json({ error: 'action inválida' }, 400)

    const vRes = await sb(`/rest/v1/visitas?id=eq.${visita_id}&select=id,data_hora,duracao_min,observacoes,cliente_nome,cliente_telefone,cliente_email,corretor_id,google_event_id,google_calendar_id,clientes(nome,email,telefone),imoveis(codigo,titulo,endereco,bairro,cidade,estado)`)
    const vArr = await vRes.json()
    const visita = vArr?.[0]
    if (!visita) return json({ error: 'Visita não encontrada' }, 404)
    if (!visita.google_event_id) return json({ ok: true, skipped: true, reason: 'sem_event_id' })

    const pRes = await sb(`/rest/v1/users_profiles?id=eq.${visita.corretor_id}&select=gcal_refresh_token,gcal_calendar_id`)
    const pArr = await pRes.json()
    const corretor = pArr?.[0]
    if (!corretor?.gcal_refresh_token) return json({ ok: true, skipped: true, reason: 'corretor_sem_gcal' })

    const accessToken = await refreshAccessToken(corretor.gcal_refresh_token)
    if (!accessToken) return json({ error: 'Falha ao renovar access_token' }, 500)

    const calendarId = visita.google_calendar_id || corretor.gcal_calendar_id || 'primary'
    const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(visita.google_event_id)}`

    if (action === 'delete') {
      const delRes = await fetch(eventUrl + '?sendUpdates=none', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
        const txt = await delRes.text()
        return json({ error: 'Google Calendar delete falhou: ' + txt }, 502)
      }
      await sb(`/rest/v1/visitas?id=eq.${visita_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ google_event_id: null }),
      })
      return json({ ok: true, action: 'delete' })
    }

    // action === 'update'
    const cliente = visita.clientes || { nome: visita.cliente_nome, email: visita.cliente_email, telefone: visita.cliente_telefone }
    const imovel = visita.imoveis || {}

    const start = new Date(visita.data_hora)
    const end = new Date(start.getTime() + (visita.duracao_min || 60) * 60000)

    const summary = `Visita: ${cliente?.nome || visita.cliente_nome || 'Cliente'}${imovel?.codigo ? ' — ' + imovel.codigo : ''}`
    const descLines = [
      `Cliente: ${cliente?.nome || ''}`,
      cliente?.telefone || visita.cliente_telefone ? `Telefone: ${cliente?.telefone || visita.cliente_telefone}` : '',
      cliente?.email || visita.cliente_email ? `Email: ${cliente?.email || visita.cliente_email}` : '',
      imovel?.codigo ? `Imóvel: ${imovel.codigo}${imovel.titulo ? ' — ' + imovel.titulo : ''}` : '',
      imovel?.endereco ? `Endereço: ${imovel.endereco}${imovel.bairro ? ', ' + imovel.bairro : ''}${imovel.cidade ? ' — ' + imovel.cidade : ''}` : '',
      visita.observacoes ? `\nObservações: ${visita.observacoes}` : '',
    ].filter(Boolean)

    const location = [imovel?.endereco, imovel?.bairro, imovel?.cidade, imovel?.estado].filter(Boolean).join(', ')

    const eventBody = {
      summary,
      description: descLines.join('\n'),
      location,
      start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
      end:   { dateTime: end.toISOString(),   timeZone: 'America/Sao_Paulo' },
    }

    const upRes = await fetch(eventUrl + '?sendUpdates=none', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody),
    })
    const upData = await upRes.json()
    if (!upRes.ok) {
      return json({ error: 'Google Calendar update falhou: ' + (upData?.error?.message || 'erro'), detail: upData }, 502)
    }

    return json({ ok: true, action: 'update', event_id: upData.id })
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
