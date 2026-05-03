// Edge Function — Sincroniza status de assinatura do ZapSign on-demand
// Body: { contrato_id }
// GET no documento da ZapSign API e atualiza partes + contrato.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ZAPSIGN_API = 'https://api.zapsign.com.br/api/v1'

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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const ZAPSIGN_TOKEN = Deno.env.get('ZAPSIGN_API_TOKEN')
  if (!ZAPSIGN_TOKEN) return json({ error: 'ZAPSIGN_API_TOKEN não configurado' }, 500)

  try {
    const { contrato_id } = await req.json()
    if (!contrato_id) return json({ error: 'contrato_id obrigatório' }, 400)

    const cRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=id,zapsign_doc_id`)
    const cArr = await cRes.json()
    const contrato = cArr[0]
    if (!contrato) return json({ error: 'Contrato não encontrado' }, 404)
    if (!contrato.zapsign_doc_id) return json({ error: 'Contrato ainda não foi enviado pra ZapSign' }, 400)

    const zapRes = await fetch(`${ZAPSIGN_API}/docs/${contrato.zapsign_doc_id}/?api_token=${ZAPSIGN_TOKEN}`)
    const zapText = await zapRes.text()
    let zapData: any = null
    try { zapData = JSON.parse(zapText) } catch { zapData = { raw: zapText } }
    if (!zapRes.ok) {
      return json({ error: zapData?.detail || zapData?.raw || `ZapSign HTTP ${zapRes.status}` }, zapRes.status)
    }

    const signers = (zapData.signers || []) as any[]
    let assinados = 0
    for (const s of signers) {
      const signedAt = s.signed_at || ((s.status === 'signed' || s.status === 'completed') ? new Date().toISOString() : null)
      if (signedAt) assinados++
      if (s.token) {
        await sb(`/rest/v1/contratos_partes?zapsign_signer_token=eq.${s.token}`, {
          method: 'PATCH',
          body: JSON.stringify({
            zapsign_signed_at: signedAt,
            zapsign_signer_url: s.sign_url || null,
          }),
        })
      }
    }

    const docStatus = zapData.status as string
    const updates: any = { zapsign_status: docStatus }
    if (docStatus === 'signed') {
      updates.status = 'ativo'
      updates.ativado_em = new Date().toISOString()
      updates.pdf_signed_url = zapData.signed_file || null
    } else if (docStatus === 'refused') {
      updates.status = 'cancelado'
    }
    await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })

    return json({
      ok: true,
      assinados,
      total: signers.length,
      status: docStatus,
      signed_file: zapData.signed_file || null,
    })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'erro' }, 500)
  }
})
