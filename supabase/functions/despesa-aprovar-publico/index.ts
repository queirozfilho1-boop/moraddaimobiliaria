// Edge Function — Endpoint público (sem auth) pra aprovação/recusa de despesa
// GET ?token=xxx → retorna dados da despesa
// POST ?token=xxx body { acao: 'aprovar'|'recusar', motivo?, nome? }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) return json({ error: 'token obrigatório' }, 400)

    const dRes = await sb(`/rest/v1/contratos_despesas?aprovacao_token=eq.${encodeURIComponent(token)}&select=id,contrato_id,tipo,descricao,valor,data_despesa,status,quem_paga,abater_em,anexo_url,enviado_aprovacao_em,aprovado_em,recusado_em,motivo_recusa,observacoes,contratos_locacao(numero,imovel_id,imoveis(codigo,titulo,endereco,numero,cidade,estado))`)
    const arr = await dRes.json()
    const despesa = arr[0]
    if (!despesa) return json({ error: 'Token inválido' }, 404)

    if (req.method === 'GET') {
      const c = despesa.contratos_locacao || {}
      const im = c?.imoveis || {}
      return json({
        ok: true,
        despesa: {
          id: despesa.id,
          tipo: despesa.tipo,
          descricao: despesa.descricao,
          valor: Number(despesa.valor),
          data_despesa: despesa.data_despesa,
          status: despesa.status,
          quem_paga: despesa.quem_paga,
          abater_em: despesa.abater_em,
          anexo_url: despesa.anexo_url,
          observacoes: despesa.observacoes,
          enviado_aprovacao_em: despesa.enviado_aprovacao_em,
          aprovado_em: despesa.aprovado_em,
          recusado_em: despesa.recusado_em,
          motivo_recusa: despesa.motivo_recusa,
          contrato: {
            numero: c?.numero || null,
            imovel: {
              codigo: im?.codigo || null,
              titulo: im?.titulo || null,
              endereco: im?.endereco || null,
              cidade: im?.cidade || null,
              estado: im?.estado || null,
            },
          },
        },
      })
    }

    if (req.method === 'POST') {
      if (despesa.status === 'aprovada' || despesa.status === 'recusada' || despesa.status === 'executada' || despesa.status === 'paga') {
        return json({ error: `Despesa já ${despesa.status} — não pode ser alterada`, status_atual: despesa.status }, 400)
      }
      const body = await req.json()
      const { acao, motivo, nome } = body || {}
      const aprovadoPor = nome ? `${nome} (link)` : 'Proprietário (link)'

      if (acao === 'aprovar') {
        await sb(`/rest/v1/contratos_despesas?id=eq.${despesa.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'aprovada',
            aprovado_em: new Date().toISOString(),
            aprovado_por: aprovadoPor,
          }),
        })
        await sb(`/rest/v1/contratos_eventos`, {
          method: 'POST',
          body: JSON.stringify({
            contrato_id: despesa.contrato_id,
            tipo: 'observacao',
            descricao: `Despesa APROVADA por ${aprovadoPor} · ${despesa.descricao}`,
            metadados: { despesa_id: despesa.id },
          }),
        })
        return json({ ok: true, status: 'aprovada' })
      }

      if (acao === 'recusar') {
        if (!motivo || String(motivo).trim().length < 3) {
          return json({ error: 'Motivo da recusa obrigatório' }, 400)
        }
        await sb(`/rest/v1/contratos_despesas?id=eq.${despesa.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'recusada',
            recusado_em: new Date().toISOString(),
            motivo_recusa: motivo,
            aprovado_por: aprovadoPor,
          }),
        })
        await sb(`/rest/v1/contratos_eventos`, {
          method: 'POST',
          body: JSON.stringify({
            contrato_id: despesa.contrato_id,
            tipo: 'observacao',
            descricao: `Despesa RECUSADA por ${aprovadoPor} · ${despesa.descricao} · motivo: ${motivo}`,
            metadados: { despesa_id: despesa.id },
          }),
        })
        return json({ ok: true, status: 'recusada' })
      }

      return json({ error: 'acao deve ser aprovar|recusar' }, 400)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro'
    return json({ error: msg }, 500)
  }
})
