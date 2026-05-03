// Edge Function — Cancela cobrança (Asaas + local) e devolve despesas vinculadas
// Body: { cobranca_id }

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

async function asaas(path: string, init: RequestInit = {}) {
  const ASAAS_BASE = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3'
  const ASAAS_KEY = Deno.env.get('ASAAS_API_KEY')!
  return fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: {
      'access_token': ASAAS_KEY,
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

  try {
    const { cobranca_id } = await req.json()
    if (!cobranca_id) return json({ error: 'cobranca_id obrigatório' }, 400)

    const cRes = await sb(`/rest/v1/contratos_cobrancas?id=eq.${cobranca_id}&select=*`)
    const arr = await cRes.json()
    const cob = arr[0]
    if (!cob) return json({ error: 'Cobrança não encontrada' }, 404)
    if (cob.status === 'cancelada' || cob.status === 'paga' || cob.status === 'pago' || cob.status === 'RECEIVED' || cob.status === 'CONFIRMED') {
      return json({ error: 'Cobrança não pode ser cancelada (já paga ou cancelada)' }, 400)
    }

    // Asaas: DELETE
    if (cob.asaas_payment_id) {
      const r = await asaas(`/payments/${cob.asaas_payment_id}`, { method: 'DELETE' })
      if (!r.ok && r.status !== 404) {
        const d = await r.json().catch(() => ({}))
        return json({ error: 'Asaas erro', detail: d }, r.status)
      }
    }

    // UPDATE local
    await sb(`/rest/v1/contratos_cobrancas?id=eq.${cobranca_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelada' }),
    })

    // Desvincula despesas e devolve saldo
    const dRes = await sb(`/rest/v1/contratos_despesas?cobranca_id=eq.${cobranca_id}&select=id,valor`)
    const desp = await dRes.json()
    for (const d of desp || []) {
      await sb(`/rest/v1/contratos_despesas?id=eq.${d.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ cobranca_id: null, saldo_pendente: Number(d.valor) }),
      })
    }

    await sb(`/rest/v1/contratos_eventos`, {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: cob.contrato_id,
        tipo: 'observacao',
        descricao: `Cobrança cancelada · ${cob.referencia_mes || cob.vencimento}`,
        metadados: { cobranca_id, payment_id: cob.asaas_payment_id },
      }),
    })

    return json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})
