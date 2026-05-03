// Edge Function — Webhook do Google Calendar (push notifications)
// MVP: apenas loga eventos. Sync incremental virá depois.
// Headers relevantes do Google:
//   X-Goog-Channel-ID
//   X-Goog-Resource-ID
//   X-Goog-Resource-State (sync, exists, not_exists)
//   X-Goog-Resource-URI

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const channelId = req.headers.get('x-goog-channel-id') || ''
    const resourceId = req.headers.get('x-goog-resource-id') || ''
    const resourceState = req.headers.get('x-goog-resource-state') || ''
    const resourceUri = req.headers.get('x-goog-resource-uri') || ''

    console.log('[gcal-webhook]', { channelId, resourceId, resourceState, resourceUri })

    // Lookup do corretor pelo resource_id
    if (resourceId) {
      const pRes = await sb(`/rest/v1/users_profiles?gcal_resource_id=eq.${resourceId}&select=id,nome`)
      const pArr = await pRes.json()
      console.log('[gcal-webhook] perfil correspondente:', pArr?.[0]?.nome || 'nenhum')
    }

    // Sync inicial: o Google manda 'sync' assim que a watch é criada — apenas confirma
    if (resourceState === 'sync') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }

    // TODO MVP: implementar sync incremental usando gcal_sync_token
    // Por enquanto, só responde 200 pra Google não retentar
    return new Response(null, { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[gcal-webhook] erro:', err)
    // Sempre 200 pra Google não retentar pelo nosso bug
    return new Response(null, { status: 200, headers: corsHeaders })
  }
})
