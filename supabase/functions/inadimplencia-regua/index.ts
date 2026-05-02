// Edge Function — Régua de Inadimplência
// Roda diariamente (via pg_cron ou agendador externo). Pra cada cobrança vencida,
// dispara aviso por WhatsApp (link wa.me) e/ou e-mail nos dias 3, 7, 15.
// Marca o contrato como inadimplente.
//
// POST sem body — varre tudo. Retorna resumo.

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
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(init.headers || {}),
    },
  })
}

function diasAtraso(vencimento: string): number {
  const ven = new Date(vencimento)
  const hoje = new Date()
  ven.setHours(0,0,0,0); hoje.setHours(0,0,0,0)
  return Math.floor((hoje.getTime() - ven.getTime()) / (1000 * 60 * 60 * 24))
}

const TEMPLATES: Record<number, (ctx: any) => string> = {
  3: (c) => `Olá, ${c.locatario}! 🏠\n\nIdentificamos que o aluguel do seu imóvel (Cód. ${c.imovel}) com vencimento em ${c.venc} ainda não foi pago.\n\nValor: R$ ${c.valor}\n\nProvavelmente foi um esquecimento. Se já pagou, por favor desconsidere.\n\nLink pra pagamento: ${c.invoice_url}\n\nMoradda Imobiliária`,
  7: (c) => `Olá, ${c.locatario}!\n\n⚠️ Seu aluguel do imóvel (Cód. ${c.imovel}) está em atraso há 7 dias.\n\nVencimento: ${c.venc}\nValor original: R$ ${c.valor}\n\nPedimos a gentileza de regularizar o quanto antes pra evitar acréscimo de multa e juros.\n\nLink pra pagamento atualizado: ${c.invoice_url}\n\nQualquer dúvida estamos à disposição.\n\nMoradda Imobiliária`,
  15: (c) => `Olá, ${c.locatario}.\n\n🚨 Seu aluguel está vencido há 15 dias.\n\nImóvel: Cód. ${c.imovel}\nVencimento: ${c.venc}\nValor: R$ ${c.valor} (sujeito a multa, juros e correção)\n\nÉ urgente regularizar pra evitar medidas legais e ação de despejo previstas em contrato.\n\nLink atualizado: ${c.invoice_url}\n\nEntre em contato com a Moradda Imobiliária urgentemente.`,
}

const DIAS_AVISO = [3, 7, 15]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // 1) Atualizar contratos com cobranças vencidas pra status=inadimplente
    const r1 = await sb(`/rest/v1/contratos_cobrancas?status=eq.OVERDUE&select=contrato_id`)
    const overdues = await r1.json() as Array<{ contrato_id: string }>
    const contratosInadimplentes = [...new Set(overdues.map((o) => o.contrato_id))]
    for (const cid of contratosInadimplentes) {
      await sb(`/rest/v1/contratos_locacao?id=eq.${cid}&status=neq.inadimplente`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'inadimplente' }),
      })
    }

    // 2) Buscar cobranças vencidas há 3, 7 ou 15 dias e enviar aviso
    const cobrRes = await sb(
      `/rest/v1/contratos_cobrancas?status=eq.OVERDUE&select=*,contratos_locacao(id,numero,imoveis(codigo,titulo),contratos_partes(nome,telefone,email,papel))`
    )
    const cobrs = await cobrRes.json() as any[]

    let avisos = 0
    let pulados = 0

    for (const cobr of cobrs) {
      const dias = diasAtraso(cobr.vencimento)
      if (!DIAS_AVISO.includes(dias)) { pulados++; continue }
      const c = cobr.contratos_locacao
      if (!c) continue

      // Verificar se já enviamos aviso desse marco
      const evRes = await sb(
        `/rest/v1/contratos_eventos?contrato_id=eq.${c.id}&tipo=eq.aviso_${dias}_dias&select=id&limit=1`
      )
      const evs = await evRes.json()
      if (Array.isArray(evs) && evs.length > 0) { pulados++; continue }

      const locatario = (c.contratos_partes || []).find((p: any) => p.papel === 'locatario')
      if (!locatario) continue

      const ctx = {
        locatario: locatario.nome || 'cliente',
        imovel: c.imoveis?.codigo || '',
        venc: cobr.vencimento ? cobr.vencimento.split('-').reverse().join('/') : '',
        valor: Number(cobr.valor || 0).toFixed(2).replace('.', ','),
        invoice_url: cobr.asaas_invoice_url || cobr.asaas_bank_slip_url || '',
      }
      const msg = TEMPLATES[dias as keyof typeof TEMPLATES](ctx)
      const tel = (locatario.telefone || '').replace(/\D/g, '')
      const wa = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : null

      // Registrar evento
      await sb(`/rest/v1/contratos_eventos`, {
        method: 'POST',
        body: JSON.stringify({
          contrato_id: c.id,
          tipo: `aviso_${dias}_dias`,
          descricao: `Aviso de inadimplência (${dias} dias) preparado pra ${locatario.nome}`,
          metadados: { whatsapp_url: wa, message: msg, telefone: tel, email: locatario.email },
        }),
      })
      avisos++
    }

    return new Response(JSON.stringify({
      ok: true,
      contratos_inadimplentes: contratosInadimplentes.length,
      avisos_preparados: avisos,
      pulados,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
})
