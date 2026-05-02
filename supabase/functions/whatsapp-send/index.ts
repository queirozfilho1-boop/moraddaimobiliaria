// Edge Function — Envia WhatsApp via Cloud API (Meta)
// Body: { destinatarios: ["55XXXXXXXXXXX", ...], mensagem, imovel_id? }
// Requer secrets: WHATSAPP_PHONE_ID, WHATSAPP_TOKEN

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
      'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', ...(init.headers || {}),
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')
    const TOKEN = Deno.env.get('WHATSAPP_TOKEN')
    if (!PHONE_ID || !TOKEN) {
      return json({ error: 'Configurar WHATSAPP_PHONE_ID e WHATSAPP_TOKEN nos secrets. Use Meta Business → WhatsApp → API Setup' }, 500)
    }

    const { destinatarios, mensagem, imovel_id } = await req.json()
    if (!Array.isArray(destinatarios) || destinatarios.length === 0) return json({ error: 'destinatarios obrigatório' }, 400)
    if (!mensagem) return json({ error: 'mensagem obrigatória' }, 400)

    let ok = 0, fail = 0
    const erros: string[] = []

    for (const dest of destinatarios) {
      const tel = String(dest).replace(/\D/g, '')
      const r = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: tel,
          type: 'text',
          text: { body: mensagem },
        }),
      })
      const d = await r.json()
      if (r.ok) {
        ok++
        await sb('/rest/v1/marketing_envios', {
          method: 'POST',
          body: JSON.stringify({ canal: 'whatsapp', destinatario: tel, conteudo: mensagem, imovel_id, status: 'enviado', resposta_api: d }),
        })
      } else {
        fail++
        erros.push(`${tel}: ${JSON.stringify(d.error || d)}`)
        await sb('/rest/v1/marketing_envios', {
          method: 'POST',
          body: JSON.stringify({ canal: 'whatsapp', destinatario: tel, conteudo: mensagem, imovel_id, status: 'falhou', resposta_api: d }),
        })
      }
      await new Promise((r) => setTimeout(r, 200))  // throttle
    }

    return json({ ok: true, enviados: ok, falharam: fail, erros: erros.slice(0, 5) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
