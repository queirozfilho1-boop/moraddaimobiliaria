// Edge Function — Envia despesa pra aprovação do proprietário
// Body: { despesa_id }
// Gera token, atualiza status e retorna link de aprovação.

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
      'Prefer': 'return=representation',
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

function genToken(len = 32): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  // base64-url
  const bin = String.fromCharCode(...bytes)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, len)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { despesa_id } = await req.json()
    if (!despesa_id) return json({ error: 'despesa_id obrigatório' }, 400)

    const dRes = await sb(`/rest/v1/contratos_despesas?id=eq.${despesa_id}&select=*,contratos_locacao(numero,imovel_id,imoveis(codigo,titulo))`)
    const arr = await dRes.json()
    const despesa = arr[0]
    if (!despesa) return json({ error: 'Despesa não encontrada' }, 404)

    let token = despesa.aprovacao_token
    if (!token) token = genToken(32)

    await sb(`/rest/v1/contratos_despesas?id=eq.${despesa_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        aprovacao_token: token,
        status: 'aguardando_aprovacao',
        enviado_aprovacao_em: new Date().toISOString(),
      }),
    })

    // Buscar locador (contratos_partes papel=locador) com email/telefone
    const pRes = await sb(`/rest/v1/contratos_partes?contrato_id=eq.${despesa.contrato_id}&papel=in.(locador,proprietario)&select=nome,email,telefone&limit=1`)
    const partes = await pRes.json()
    const locador = partes[0]

    // URL pública (configurável)
    const APP_URL = Deno.env.get('APP_URL') || 'https://moraddaimobiliaria.com.br'
    const link = `${APP_URL}/aprovar-despesa/${token}`

    // Tentar enviar via WhatsApp se tem telefone (best-effort)
    let canalEnviado: string | null = null
    if (locador?.telefone) {
      const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')
      const TOKEN = Deno.env.get('WHATSAPP_TOKEN')
      if (PHONE_ID && TOKEN) {
        try {
          const tel = String(locador.telefone).replace(/\D/g, '')
          const msg = `Olá ${locador.nome},\n\nA Moradda Imobiliária precisa da sua aprovação para uma despesa do imóvel ${despesa.contratos_locacao?.imoveis?.codigo || ''}.\n\nDescrição: ${despesa.descricao}\nValor: R$ ${Number(despesa.valor).toFixed(2)}\n\nAprove ou recuse aqui:\n${link}`
          const r = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: tel,
              type: 'text',
              text: { body: msg },
            }),
          })
          if (r.ok) canalEnviado = 'whatsapp'
        } catch {/* ignora */}
      }
    }

    await sb(`/rest/v1/contratos_eventos`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: despesa.contrato_id,
        tipo: 'observacao',
        descricao: `Despesa enviada pra aprovação · ${despesa.descricao}`,
        metadados: { despesa_id, link, canal: canalEnviado },
      }),
    })

    return json({
      ok: true,
      link,
      token,
      canal_enviado: canalEnviado,
      locador_nome: locador?.nome || null,
      locador_email: locador?.email || null,
      locador_telefone: locador?.telefone || null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})
