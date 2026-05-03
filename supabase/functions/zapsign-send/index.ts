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
    const { contrato_id, pdf_base64: pdfBase64Body } = body
    if (!contrato_id) return json({ error: 'contrato_id obrigatório' }, 400)

    // Buscar contrato + partes
    const cRes = await sb(`/rest/v1/contratos_locacao?id=eq.${contrato_id}&select=id,numero,tipo,pdf_url`)
    const cArr = await cRes.json()
    const contrato = cArr[0]
    if (!contrato) return json({ error: 'Contrato não encontrado' }, 404)

    // Decide qual PDF usar:
    // 1. Se contrato tem pdf_url (anexado pelo usuário), baixa do Storage e usa
    // 2. Senão, usa o pdf_base64 do body (gerado por html2canvas, fallback)
    let pdf_base64: string | null = null
    if (contrato.pdf_url) {
      try {
        const dlRes = await fetch(contrato.pdf_url)
        if (!dlRes.ok) throw new Error(`Storage HTTP ${dlRes.status}`)
        const buf = await dlRes.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        pdf_base64 = btoa(binary)
      } catch (e) {
        return json({ error: 'Erro ao baixar PDF anexado: ' + (e instanceof Error ? e.message : '') }, 500)
      }
    } else if (pdfBase64Body) {
      pdf_base64 = pdfBase64Body
    } else {
      return json({ error: 'Nenhum PDF disponível: anexe um PDF ao contrato ou envie pdf_base64' }, 400)
    }

    const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${contrato_id}&select=id,nome,email,telefone,papel,cpf_cnpj&order=ordem`)
    const partes = await pRes.json()
    // Todos os papéis assinam, exceto testemunhas (que não assinam pela ZapSign por padrão)
    const signersInput = partes
      .filter((p: any) => p.papel !== 'testemunha' && p.email)
      .map((p: any) => ({
        parte_id: p.id,
        name: p.nome,
        email: p.email || undefined,
        phone_country: '55',
        phone_number: p.telefone ? p.telefone.replace(/\D/g, '').slice(-11) : undefined,
        auth_mode: 'assinaturaTela',
      }))

    if (signersInput.length === 0) return json({ error: 'Nenhuma parte com email pra assinar' }, 400)

    // Criar documento no ZapSign — sandbox=true permite testar sem plano
    // de produção. Tire essa flag quando contratar plano API.
    const ZAPSIGN_SANDBOX = (Deno.env.get('ZAPSIGN_SANDBOX') ?? 'true') === 'true'
    const zapPayload: Record<string, unknown> = {
      name: `Contrato ${contrato.numero || ''}`.trim(),
      sandbox: ZAPSIGN_SANDBOX,
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
    // Lê como texto primeiro pra preservar mensagens de erro não-JSON
    const zapText = await zapRes.text()
    let zapData: any = null
    try { zapData = JSON.parse(zapText) } catch { zapData = { raw: zapText } }
    if (!zapRes.ok) {
      const errMsg = zapData?.detail || zapData?.message || zapData?.raw || `ZapSign retornou ${zapRes.status}`
      return json({ error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), detail: zapData, payload: zapPayload }, zapRes.status)
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
