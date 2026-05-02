// Edge Function — Posta imóvel no Instagram via Meta Graph API
// Body: { imovel_id, caption, image_urls[] (até 10 pra carrossel) }
// Requer secrets: META_PAGE_TOKEN, META_IG_BUSINESS_ID

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FB = 'https://graph.facebook.com/v21.0'

async function sb(path: string, init: RequestInit = {}) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=representation',
      ...(init.headers || {}),
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const TOKEN = Deno.env.get('META_PAGE_TOKEN')
    const IG_ID = Deno.env.get('META_IG_BUSINESS_ID')
    if (!TOKEN || !IG_ID) {
      return json({ error: 'Configurar secrets META_PAGE_TOKEN e META_IG_BUSINESS_ID. Veja: developers.facebook.com/docs/instagram-api/getting-started' }, 500)
    }

    const { imovel_id, caption, image_urls } = await req.json()
    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return json({ error: 'image_urls obrigatório (array)' }, 400)
    }

    let creationId: string

    if (image_urls.length === 1) {
      // Imagem simples
      const r = await fetch(`${FB}/${IG_ID}/media?image_url=${encodeURIComponent(image_urls[0])}&caption=${encodeURIComponent(caption || '')}&access_token=${TOKEN}`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) return json({ error: 'Meta media erro', detail: data }, r.status)
      creationId = data.id
    } else {
      // Carrossel
      const childIds: string[] = []
      for (const url of image_urls.slice(0, 10)) {
        const r = await fetch(`${FB}/${IG_ID}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${TOKEN}`, { method: 'POST' })
        const d = await r.json()
        if (!r.ok) return json({ error: 'Meta carousel item erro', detail: d }, r.status)
        childIds.push(d.id)
      }
      const r2 = await fetch(`${FB}/${IG_ID}/media?media_type=CAROUSEL&children=${childIds.join(',')}&caption=${encodeURIComponent(caption || '')}&access_token=${TOKEN}`, { method: 'POST' })
      const d2 = await r2.json()
      if (!r2.ok) return json({ error: 'Meta carousel container erro', detail: d2 }, r2.status)
      creationId = d2.id
    }

    // Publicar
    const pub = await fetch(`${FB}/${IG_ID}/media_publish?creation_id=${creationId}&access_token=${TOKEN}`, { method: 'POST' })
    const pubData = await pub.json()
    if (!pub.ok) return json({ error: 'Meta publish erro', detail: pubData }, pub.status)

    // Registrar
    await sb('/rest/v1/marketing_envios', {
      method: 'POST',
      body: JSON.stringify({ canal: 'instagram', imovel_id, conteudo: caption, status: 'enviado', resposta_api: { creation_id: creationId, post_id: pubData.id } }),
    })

    return json({ ok: true, post_id: pubData.id, creation_id: creationId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
