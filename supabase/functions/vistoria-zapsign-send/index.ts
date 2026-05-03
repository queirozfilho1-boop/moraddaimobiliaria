// Edge Function — Envia vistoria pra assinatura no ZapSign
// Body: { vistoria_id: string, pdf_base64?: string }
// Retorna: { doc_token, signers: [{nome, papel, sign_url, signer_token}] }

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
    const { vistoria_id, pdf_base64: pdfBase64Body } = body
    if (!vistoria_id) return json({ error: 'vistoria_id obrigatório' }, 400)

    // Buscar vistoria
    const vRes = await sb(`/rest/v1/vistorias?id=eq.${vistoria_id}&select=id,tipo,status,realizada_em,pdf_url,locador_nome,locador_cpf,locatario_nome,locatario_cpf,responsavel_id,contrato_id,imovel_id`)
    const vArr = await vRes.json()
    const vistoria = vArr[0]
    if (!vistoria) return json({ error: 'Vistoria não encontrada' }, 404)

    // Determinar PDF base64
    let pdf_base64: string | null = null
    if (vistoria.pdf_url) {
      try {
        const dlRes = await fetch(vistoria.pdf_url)
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
      return json({ error: 'Nenhum PDF disponível: gere o PDF antes ou envie pdf_base64 no corpo' }, 400)
    }

    // Montar signatários
    // Sempre: locatário + locador (se preenchidos)
    // Opcional: responsável (perfil do usuário responsavel_id) — adicionado se tiver email
    interface SignerInput {
      papel: string
      name: string
      email?: string
      phone_country?: string
      phone_number?: string
    }
    const signersInput: SignerInput[] = []

    // Tenta enriquecer com email/telefone via contratos_partes (se houver contrato vinculado)
    let locadorEmail: string | null = null, locadorTel: string | null = null
    let locatarioEmail: string | null = null, locatarioTel: string | null = null
    if (vistoria.contrato_id) {
      const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${vistoria.contrato_id}&select=papel,nome,email,telefone`)
      const partes = await pRes.json()
      for (const p of (partes as any[])) {
        if (p.papel === 'locador' && !locadorEmail) {
          locadorEmail = p.email || null
          locadorTel = p.telefone || null
        }
        if ((p.papel === 'locatario' || p.papel === 'hospede') && !locatarioEmail) {
          locatarioEmail = p.email || null
          locatarioTel = p.telefone || null
        }
      }
    }

    if (vistoria.locatario_nome) {
      signersInput.push({
        papel: 'locatario',
        name: vistoria.locatario_nome,
        email: locatarioEmail || undefined,
        phone_country: '55',
        phone_number: locatarioTel ? locatarioTel.replace(/\D/g, '').slice(-11) : undefined,
      })
    }
    if (vistoria.locador_nome) {
      signersInput.push({
        papel: 'locador',
        name: vistoria.locador_nome,
        email: locadorEmail || undefined,
        phone_country: '55',
        phone_number: locadorTel ? locadorTel.replace(/\D/g, '').slice(-11) : undefined,
      })
    }

    // Responsável (opcional) — busca perfil
    if (vistoria.responsavel_id) {
      const rRes = await sb(`/rest/v1/users_profiles?id=eq.${vistoria.responsavel_id}&select=nome,email,telefone`)
      const rArr = await rRes.json()
      const r = (rArr as any[])[0]
      if (r && r.nome) {
        signersInput.push({
          papel: 'responsavel',
          name: r.nome,
          email: r.email || undefined,
          phone_country: '55',
          phone_number: r.telefone ? String(r.telefone).replace(/\D/g, '').slice(-11) : undefined,
        })
      }
    }

    // ZapSign exige email OU telefone — filtra os que têm pelo menos um
    const signersValidos = signersInput.filter((s) => s.email || s.phone_number)
    if (signersValidos.length === 0) {
      return json({ error: 'Nenhum signatário com e-mail ou telefone disponível' }, 400)
    }

    const ZAPSIGN_SANDBOX = (Deno.env.get('ZAPSIGN_SANDBOX') ?? 'true') === 'true'
    const zapPayload: Record<string, unknown> = {
      name: `Vistoria ${vistoria.tipo === 'entrada' ? 'Entrada' : 'Saída'} · ${vistoria.id.slice(0, 8)}`,
      sandbox: ZAPSIGN_SANDBOX,
      base64_pdf: pdf_base64,
      signers: signersValidos.map((s) => ({
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
      external_id: vistoria_id,
    }

    const zapRes = await fetch(`${ZAPSIGN_API}/docs/?api_token=${ZAPSIGN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zapPayload),
    })
    const zapText = await zapRes.text()
    let zapData: any = null
    try { zapData = JSON.parse(zapText) } catch { zapData = { raw: zapText } }
    if (!zapRes.ok) {
      const errMsg = zapData?.detail || zapData?.message || zapData?.raw || `ZapSign retornou ${zapRes.status}`
      return json({ error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), detail: zapData }, zapRes.status)
    }

    // Atualizar vistoria
    await sb(`/rest/v1/vistorias?id=eq.${vistoria_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        zapsign_doc_id: zapData.token || zapData.doc_token,
        zapsign_status: 'aguardando',
        zapsign_url: zapData.signers?.[0]?.sign_url || null,
        status: 'aguardando_assinatura',
      }),
    })

    const signersOut: any[] = []
    if (Array.isArray(zapData.signers)) {
      for (let i = 0; i < zapData.signers.length; i++) {
        const z = zapData.signers[i]
        signersOut.push({
          papel: signersValidos[i]?.papel,
          nome: z.name,
          email: z.email,
          sign_url: z.sign_url,
          signer_token: z.token,
        })
      }
    }

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
