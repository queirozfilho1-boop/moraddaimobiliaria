// Edge Function — Envia contrato pra assinatura no ZapSign
// Body: { contrato_id: string, pdf_base64: string }
// Retorna: { doc_token, signers: [{nome, papel, parte_id, sign_url, signer_token}] }

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
      'Prefer': 'return=representation',
      ...(init.headers || {}),
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST')   return json({ error: 'Method not allowed' }, 405)

  const ZAPSIGN_TOKEN = Deno.env.get('ZAPSIGN_API_TOKEN')
  if (!ZAPSIGN_TOKEN) return json({ error: 'ZAPSIGN_API_TOKEN não configurado' }, 500)

  try {
    const body = await req.json()
    const { contrato_id, pdf_base64 } = body
    if (!contrato_id || !pdf_base64) return json({ error: 'contrato_id e pdf_base64 obrigatórios' }, 400)

    // Buscar contrato + partes
    const cRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=id,numero,tipo`)
    const cArr = await cRes.json()
    const contrato = cArr[0]
    if (!contrato) return json({ error: 'Contrato não encontrado' }, 404)

    const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${contrato_id}&select=id,nome,email,telefone,papel,cpf_cnpj&order=ordem`)
    const partes = await pRes.json()
    const signersInput = partes
      .filter((p: any) => ['locador', 'locatario', 'fiador', 'avalista'].includes(p.papel))
      .map((p: any) => ({
        parte_id: p.id,
        name: p.nome,
        email: p.email || undefined,
        phone_country: '55',
        phone_number: p.telefone ? p.telefone.replace(/\D/g, '').slice(-11) : undefined,
        auth_mode: 'assinaturaTela',
      }))

    if (signersInput.length === 0) return json({ error: 'Nenhuma parte com email pra assinar' }, 400)

    // Criar documento no ZapSign
    const zapPayload = {
      name: `Contrato ${contrato.numero || ''}`.trim(),
      base64_pdf: pdf_base64,
      signers: signersInput.map((s: any) => ({
        name: s.name,
        email: s.email,
        phone_country: s.phone_country,
        phone_number: s.phone_number,
        auth_mode: 'assinaturaTela',
      })),
      lang: 'pt-br',
      disable_signer_emails: false,
      brand_logo: '',
      brand_primary_color: '#143250',
      brand_name: 'Moradda Imobiliária',
      external_id: contrato_id,
    }

    const zapRes = await fetch(`${ZAPSIGN_API}/docs/?api_token=${ZAPSIGN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zapPayload),
    })
    const zapData = await zapRes.json()
    if (!zapRes.ok) {
      return json({ error: 'ZapSign erro', detail: zapData }, zapRes.status)
    }

    // Atualizar contrato
    await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        zapsign_doc_id: zapData.token || zapData.doc_token,
        zapsign_status: 'pending',
        zapsign_url: zapData.signers?.[0]?.sign_url || null,
        status: 'aguardando_assinatura',
      }),
    })

    // Atualizar cada parte com seu signer_token e URL de assinatura
    const signersOut: any[] = []
    if (Array.isArray(zapData.signers)) {
      for (let i = 0; i < zapData.signers.length; i++) {
        const z = zapData.signers[i]
        const parte_id = signersInput[i]?.parte_id
        if (!parte_id) continue
        await sb(`/rest/v1/contratos_partes?id=eq.${parte_id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            zapsign_signer_token: z.token,
            zapsign_signer_url: z.sign_url,
          }),
        })
        signersOut.push({
          parte_id,
          nome: z.name,
          email: z.email,
          sign_url: z.sign_url,
          signer_token: z.token,
        })
      }
    }

    // Registrar evento
    await sb(`/rest/v1/contratos_eventos`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id,
        tipo: 'enviado_assinatura',
        descricao: `Documento enviado pra ${signersOut.length} signatário(s) via ZapSign`,
        metadados: { doc_token: zapData.token, signers: signersOut.length },
      }),
    })

    return json({
      ok: true,
      doc_token: zapData.token || zapData.doc_token,
      signers: signersOut,
    })
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
