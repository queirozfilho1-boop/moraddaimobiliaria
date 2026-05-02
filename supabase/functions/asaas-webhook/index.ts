// Edge Function — Webhook do Asaas
// Eventos: PAYMENT_CREATED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_REFUNDED...
// Configurar em: Asaas → Integrações → Webhooks → URL desta função

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
    const event = body.event as string
    const payment = body.payment

    if (!payment) return new Response('OK', { status: 200, headers: corsHeaders })

    const paymentId = payment.id
    const contratoId = payment.externalReference || payment.subscription_externalReference
    const subscriptionId = payment.subscription

    // Localizar contrato pela externalReference ou subscription
    let cId = contratoId
    if (!cId && subscriptionId) {
      const r = await sb(`/rest/v1/contratos_locacao?asaas_subscription_id=eq.${subscriptionId}&select=id`)
      const arr = await r.json()
      cId = arr[0]?.id
    }
    if (!cId) return new Response('contrato não localizado', { status: 200, headers: corsHeaders })

    // Upsert da cobrança
    const cobranca = {
      contrato_id: cId,
      asaas_payment_id: paymentId,
      asaas_invoice_url: payment.invoiceUrl || null,
      asaas_bank_slip_url: payment.bankSlipUrl || null,
      valor: Number(payment.value || 0),
      vencimento: payment.dueDate,
      status: payment.status,
      pago_em: payment.paymentDate || payment.clientPaymentDate || null,
      valor_pago: payment.netValue || payment.value || null,
      updated_at: new Date().toISOString(),
    }

    // Tentar update, senão insert
    const upd = await sb(`/rest/v1/contratos_cobrancas?asaas_payment_id=eq.${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...cobranca, contrato_id: undefined }),
    })
    if (upd.status === 200 || upd.status === 204) {
      const updArr = await upd.json().catch(() => [])
      if (Array.isArray(updArr) && updArr.length === 0) {
        await sb(`/rest/v1/contratos_cobrancas`, { method: 'POST', body: JSON.stringify(cobranca) })
      }
    } else {
      await sb(`/rest/v1/contratos_cobrancas`, { method: 'POST', body: JSON.stringify(cobranca) })
    }

    // Eventos baseados no tipo
    let eventoTipo: string | null = null
    let descricao = ''
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      eventoTipo = 'pago'
      descricao = `Pagamento recebido · ${payment.netValue ? 'R$ ' + payment.netValue : ''}`
      // Re-ativar status se estava inadimplente
      await sb(`/rest/v1/contratos_locacao?id=eq.${cId}&status=eq.inadimplente`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ativo' }),
      })
    } else if (event === 'PAYMENT_OVERDUE') {
      eventoTipo = 'inadimplencia'
      descricao = 'Cobrança vencida sem pagamento'
      await sb(`/rest/v1/contratos_locacao?id=eq.${cId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'inadimplente' }),
      })
    } else if (event === 'PAYMENT_CREATED') {
      eventoTipo = 'observacao'
      descricao = `Nova cobrança criada · vence em ${payment.dueDate}`
    } else if (event === 'PAYMENT_REFUNDED') {
      eventoTipo = 'observacao'
      descricao = 'Pagamento estornado'
    }

    if (eventoTipo) {
      await sb(`/rest/v1/contratos_eventos`, {
        method: 'POST',
        body: JSON.stringify({
          contrato_id: cId,
          tipo: eventoTipo,
          descricao,
          metadados: { event, payment_id: paymentId, valor: payment.value },
        }),
      })
    }

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return new Response(`erro: ${msg}`, { status: 200, headers: corsHeaders })
  }
})
