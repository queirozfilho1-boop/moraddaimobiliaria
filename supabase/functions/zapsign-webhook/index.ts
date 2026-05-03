// Edge Function — Webhook do ZapSign
// Eventos: doc_signed (alguma parte assinou), doc_completed (todas assinaram), doc_refused
// Configurar em: ZapSign → Configurações → Webhooks → URL desta função

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
  if (req.method !== 'POST')   return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const body = await req.json()
    // ZapSign envia: { event_type, doc, signer? }
    const eventType = body.event_type || body.event || ''
    const doc = body.doc || body
    const docToken = doc.token
    const externalId = doc.external_id // = contrato_id
    const signer = body.signer

    if (!docToken && !externalId) {
      return new Response('payload sem token/external_id', { status: 200, headers: corsHeaders })
    }

    // Localizar contrato
    let contratoId = externalId
    if (!contratoId && docToken) {
      const r = await sb(`/rest/v1/contratos_locacao?zapsign_doc_id=eq.${docToken}&select=id`)
      const arr = await r.json()
      contratoId = arr[0]?.id
    }
    if (!contratoId) {
      return new Response('contrato não localizado', { status: 200, headers: corsHeaders })
    }

    // Lidar com cada tipo de evento
    if (eventType === 'doc_signed' || eventType === 'signer_signed') {
      // Algum signatário assinou
      if (signer?.token) {
        await sb(`/rest/v1/contratos_partes?zapsign_signer_token=eq.${signer.token}`, {
          method: 'PATCH',
          body: JSON.stringify({ zapsign_signed_at: new Date().toISOString() }),
        })
      }
      await sb(`/rest/v1/contratos_eventos`, {
        method: 'POST',
        body: JSON.stringify({
          contrato_id: contratoId,
          tipo: 'parte_assinou',
          descricao: `${signer?.name || 'Parte'} assinou`,
          metadados: { signer_token: signer?.token, signer_name: signer?.name },
        }),
      })
    } else if (eventType === 'doc_completed' || eventType === 'doc_signed_all') {
      // Todos assinaram → contrato vai pra ATIVO
      await sb(`/rest/v1/contratos_locacao?id=eq.${contratoId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          zapsign_status: 'completed',
          status: 'ativo',
          ativado_em: new Date().toISOString(),
          pdf_signed_url: doc.signed_file || null,
        }),
      })
      await sb(`/rest/v1/contratos_eventos`, {
        method: 'POST',
        body: JSON.stringify({
          contrato_id: contratoId,
          tipo: 'todos_assinaram',
          descricao: 'Todas as partes assinaram. Contrato ativado.',
          metadados: { signed_file: doc.signed_file },
        }),
      })
      await sb(`/rest/v1/contratos_eventos`, {
        method: 'POST',
        body: JSON.stringify({
          contrato_id: contratoId,
          tipo: 'ativado',
          descricao: 'Contrato ativado automaticamente após assinatura completa.',
        }),
      })
    } else if (eventType === 'doc_refused' || eventType === 'signer_refused') {
      await sb(`/rest/v1/contratos_locacao?id=eq.${contratoId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          zapsign_status: 'refused',
          status: 'cancelado',
        }),
      })
      await sb(`/rest/v1/contratos_eventos`, {
        method: 'POST',
        body: JSON.stringify({
          contrato_id: contratoId,
          tipo: 'cancelado',
          descricao: `Assinatura recusada${signer?.name ? ` por ${signer.name}` : ''}`,
        }),
      })
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return new Response(`erro: ${msg}`, { status: 200, headers: corsHeaders })
  }
})
