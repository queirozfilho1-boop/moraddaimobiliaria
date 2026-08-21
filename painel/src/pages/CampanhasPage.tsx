import { useEffect, useMemo, useState } from 'react'
import {
  Megaphone,
  Users,
  MessageSquare,
  TrendingUp,
  Loader2,
  Globe,
  MousePointerClick,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Rastreamento de campanhas (UTM) — leads e cliques por campanha     */
/* ------------------------------------------------------------------ */

interface LeadRow {
  id: string
  nome: string
  status: string
  origem: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  created_at: string
}

interface EventoRow {
  tipo: string
  utm_source: string | null
  utm_campaign: string | null
  utm_content: string | null
  created_at: string
}

type Periodo = 30 | 60 | 90 | 365

const STATUS_CONVERTIDO = ['convertido']
const STATUS_PERDIDO = ['perdido', 'sem_resposta']

function chaveCampanha(utm_campaign: string | null, utm_source: string | null): string {
  if (utm_campaign) return utm_campaign
  if (utm_source) return `(sem campanha — ${utm_source})`
  return '(orgânico / direto)'
}

export default function CampanhasPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>(30)
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [eventos, setEventos] = useState<EventoRow[]>([])

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      setLoading(true)
      const desde = new Date(Date.now() - periodo * 24 * 60 * 60 * 1000).toISOString()
      const [l, e] = await Promise.all([
        supabase
          .from('leads')
          .select('id, nome, status, origem, utm_source, utm_medium, utm_campaign, utm_content, created_at')
          .gte('created_at', desde)
          .order('created_at', { ascending: false }),
        supabase
          .from('site_eventos')
          .select('tipo, utm_source, utm_campaign, utm_content, created_at')
          .gte('created_at', desde),
      ])
      if (cancelado) return
      setLeads((l.data as LeadRow[]) || [])
      setEventos((e.data as EventoRow[]) || [])
      setLoading(false)
    })()
    return () => {
      cancelado = true
    }
  }, [periodo])

  const resumo = useMemo(() => {
    const deCampanha = leads.filter((l) => l.utm_source || l.utm_campaign)
    const convertidos = leads.filter((l) => STATUS_CONVERTIDO.includes(l.status))
    const cliquesWA = eventos.filter((e) => e.tipo === 'whatsapp_click')
    return {
      totalLeads: leads.length,
      deCampanha: deCampanha.length,
      cliquesWA: cliquesWA.length,
      conversao: leads.length > 0 ? Math.round((convertidos.length / leads.length) * 100) : 0,
    }
  }, [leads, eventos])

  const porCampanha = useMemo(() => {
    interface Linha {
      campanha: string
      source: Set<string>
      leads: number
      convertidos: number
      perdidos: number
      emAndamento: number
      cliquesWA: number
    }
    const mapa = new Map<string, Linha>()
    const linha = (chave: string): Linha => {
      let l = mapa.get(chave)
      if (!l) {
        l = { campanha: chave, source: new Set(), leads: 0, convertidos: 0, perdidos: 0, emAndamento: 0, cliquesWA: 0 }
        mapa.set(chave, l)
      }
      return l
    }
    for (const ld of leads) {
      const l = linha(chaveCampanha(ld.utm_campaign, ld.utm_source))
      if (ld.utm_source) l.source.add(ld.utm_source)
      l.leads++
      if (STATUS_CONVERTIDO.includes(ld.status)) l.convertidos++
      else if (STATUS_PERDIDO.includes(ld.status)) l.perdidos++
      else l.emAndamento++
    }
    for (const ev of eventos) {
      if (ev.tipo !== 'whatsapp_click') continue
      const l = linha(chaveCampanha(ev.utm_campaign, ev.utm_source))
      if (ev.utm_source) l.source.add(ev.utm_source)
      l.cliquesWA++
    }
    return [...mapa.values()].sort((a, b) => b.leads - a.leads || b.cliquesWA - a.cliquesWA)
  }, [leads, eventos])

  const leadsDeCampanha = useMemo(
    () => leads.filter((l) => l.utm_source || l.utm_campaign).slice(0, 30),
    [leads]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
            <Megaphone size={22} className="text-moradda-blue-500" />
            Campanhas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Leads e cliques de WhatsApp por campanha (parâmetros UTM dos anúncios)
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
          {([30, 60, 90, 365] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                periodo === p
                  ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {p === 365 ? '1 ano' : `${p} dias`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl bg-white p-16 shadow-sm dark:bg-gray-800">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Leads no período', valor: resumo.totalLeads, icon: <Users size={18} />, cor: 'text-blue-500' },
              { label: 'Leads de campanha', valor: resumo.deCampanha, icon: <Megaphone size={18} />, cor: 'text-purple-500' },
              { label: 'Cliques WhatsApp', valor: resumo.cliquesWA, icon: <MessageSquare size={18} />, cor: 'text-green-500' },
              { label: 'Conversão geral', valor: `${resumo.conversao}%`, icon: <TrendingUp size={18} />, cor: 'text-emerald-500' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className={`flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400`}>
                  <span className={c.cor}>{c.icon}</span>
                  {c.label}
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-gray-100">{c.valor}</p>
              </div>
            ))}
          </div>

          {/* Tabela por campanha */}
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <MousePointerClick size={16} className="text-moradda-blue-500" />
              Desempenho por campanha
            </h2>
            {porCampanha.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Nenhum dado no período. Confira se os anúncios estão com os parâmetros de URL configurados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="px-3 py-2">Campanha</th>
                      <th className="px-3 py-2">Origem</th>
                      <th className="px-3 py-2 text-center">Cliques WhatsApp</th>
                      <th className="px-3 py-2 text-center">Leads</th>
                      <th className="px-3 py-2 text-center">Em andamento</th>
                      <th className="px-3 py-2 text-center">Convertidos</th>
                      <th className="px-3 py-2 text-center">Perdidos</th>
                      <th className="px-3 py-2 text-center">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porCampanha.map((c) => (
                      <tr key={c.campanha} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-100">{c.campanha}</td>
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">
                          {c.source.size > 0 ? [...c.source].join(', ') : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{c.cliquesWA || '—'}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-gray-800 dark:text-gray-100">{c.leads}</td>
                        <td className="px-3 py-2.5 text-center text-blue-600 dark:text-blue-400">{c.emAndamento || '—'}</td>
                        <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">{c.convertidos || '—'}</td>
                        <td className="px-3 py-2.5 text-center text-red-500">{c.perdidos || '—'}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">
                          {c.leads > 0 ? `${Math.round((c.convertidos / c.leads) * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Leads de campanha recentes */}
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <Globe size={16} className="text-moradda-blue-500" />
              Últimos leads vindos de campanha
            </h2>
            {leadsDeCampanha.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Nenhum lead com origem de campanha no período ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Campanha</th>
                      <th className="px-3 py-2">Anúncio</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsDeCampanha.map((l) => (
                      <tr key={l.id} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">
                          {new Date(l.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-100">{l.nome}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                          {chaveCampanha(l.utm_campaign, l.utm_source)}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{l.utm_content || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_CONVERTIDO.includes(l.status)
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : STATUS_PERDIDO.includes(l.status)
                                  ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                  : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                            }`}
                          >
                            {l.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
            <p className="font-semibold text-gray-700 dark:text-gray-200">Como conectar os anúncios da Meta:</p>
            <p className="mt-2">
              No Gerenciador de Anúncios, no campo <strong>"Parâmetros de URL"</strong> de cada anúncio, cole:
            </p>
            <code className="mt-2 block overflow-x-auto rounded-lg bg-gray-900 px-3 py-2 font-mono text-xs text-green-400">
              utm_source=facebook&amp;utm_medium=paid&amp;utm_campaign={'{{campaign.name}}'}&amp;utm_content={'{{ad.name}}'}
            </code>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              A Meta substitui automaticamente pelos nomes reais da campanha e do anúncio. A partir daí, todo lead e
              clique de WhatsApp vindo do anúncio aparece aqui com a campanha identificada.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
