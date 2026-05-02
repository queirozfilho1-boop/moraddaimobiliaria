import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSignature, Trophy, Handshake, Calendar, ClipboardCheck, Loader2, ArrowRight, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const fmt = (v?: number | null) => v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtData = (s?: string | null) => s ? s.split('T')[0].split('-').reverse().join('/') : ''

const ImovelLinksSection = ({ imovelId }: { imovelId: string }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    contratos: [] as any[],
    vendas: [] as any[],
    propostas: [] as any[],
    visitas: [] as any[],
    vistorias: [] as any[],
  })

  useEffect(() => {
    if (!imovelId) return
    setLoading(true)
    Promise.all([
      supabase.from('contratos_locacao').select('id, numero, status, valor_aluguel, data_inicio, data_fim').eq('imovel_id', imovelId),
      supabase.from('vendas').select('id, numero, status, valor_venda, comprador_nome').eq('imovel_id', imovelId),
      supabase.from('propostas').select('id, numero, status, valor, comprador_nome, prazo_resposta').eq('imovel_id', imovelId),
      supabase.from('visitas').select('id, data_hora, status, cliente_nome').eq('imovel_id', imovelId).gte('data_hora', new Date().toISOString().split('T')[0]).order('data_hora').limit(5),
      supabase.from('vistorias').select('id, tipo, realizada_em, finalizada, contrato_id').eq('imovel_id', imovelId),
    ]).then(([c, v, p, vis, vt]) => {
      setData({
        contratos: c.data || [],
        vendas: v.data || [],
        propostas: p.data || [],
        visitas: vis.data || [],
        vistorias: vt.data || [],
      })
      setLoading(false)
    })
  }, [imovelId])

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <Loader2 size={20} className="animate-spin mx-auto text-moradda-blue-500" />
      </div>
    )
  }

  const Section = ({ title, icon, count, link, addLink, children }: { title: string; icon: React.ReactNode; count: number; link?: string; addLink: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <span className="text-moradda-blue-500">{icon}</span>
          {title} <span className="text-xs text-gray-400">({count})</span>
        </h3>
        <div className="flex items-center gap-1">
          {addLink && (
            <Link to={addLink} className="inline-flex items-center gap-1 rounded-lg bg-moradda-blue-50 px-2 py-1 text-xs font-medium text-moradda-blue-700 hover:bg-moradda-blue-100 dark:bg-moradda-blue-900/30 dark:text-moradda-blue-300">
              <Plus size={11} /> Novo
            </Link>
          )}
          {link && count > 0 && (
            <Link to={link} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-moradda-blue-600">
              Ver tudo <ArrowRight size={11} />
            </Link>
          )}
        </div>
      </div>
      {count === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">Nenhum registro vinculado.</p>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
    </div>
  )

  return (
    <div className="rounded-xl border-2 border-moradda-blue-200 bg-moradda-blue-50/30 p-4 dark:border-moradda-blue-800/40 dark:bg-moradda-blue-900/10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-moradda-blue-700 dark:text-moradda-blue-300">
        🔗 Registros vinculados a este imóvel
      </h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {/* Contratos de Locação */}
        <Section title="Contratos de Locação" icon={<FileSignature size={15} />} count={data.contratos.length} link="/painel/contratos" addLink="/painel/contratos/novo">
          {data.contratos.slice(0, 3).map((c) => (
            <Link key={c.id} to={`/painel/contratos/${c.id}`} className="block rounded p-2 hover:bg-white dark:hover:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-moradda-blue-600">{c.numero}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{c.status}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{fmt(c.valor_aluguel)}/mês · {fmtData(c.data_inicio)} → {fmtData(c.data_fim)}</p>
            </Link>
          ))}
        </Section>

        {/* Vendas */}
        <Section title="Vendas" icon={<Trophy size={15} />} count={data.vendas.length} link="/painel/vendas" addLink="/painel/vendas/novo">
          {data.vendas.slice(0, 3).map((v) => (
            <Link key={v.id} to={`/painel/vendas/${v.id}`} className="block rounded p-2 hover:bg-white dark:hover:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-moradda-blue-600">{v.numero}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{v.status}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{v.comprador_nome} · {fmt(v.valor_venda)}</p>
            </Link>
          ))}
        </Section>

        {/* Propostas */}
        <Section title="Propostas" icon={<Handshake size={15} />} count={data.propostas.length} link="/painel/propostas" addLink="/painel/propostas/novo">
          {data.propostas.slice(0, 3).map((p) => (
            <Link key={p.id} to={`/painel/propostas/${p.id}`} className="block rounded p-2 hover:bg-white dark:hover:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-moradda-blue-600">{p.numero}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{p.status}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{p.comprador_nome} · {fmt(p.valor)}</p>
            </Link>
          ))}
        </Section>

        {/* Visitas próximas */}
        <Section title="Visitas próximas" icon={<Calendar size={15} />} count={data.visitas.length} link="/painel/visitas" addLink="/painel/visitas">
          {data.visitas.slice(0, 3).map((v) => (
            <div key={v.id} className="rounded p-2 hover:bg-white dark:hover:bg-gray-700/30">
              <p className="text-xs font-medium text-gray-700">{v.cliente_nome}</p>
              <p className="text-xs text-gray-500">{new Date(v.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {v.status}</p>
            </div>
          ))}
        </Section>

        {/* Vistorias */}
        <Section title="Vistorias" icon={<ClipboardCheck size={15} />} count={data.vistorias.length} link="/painel/vistorias" addLink="/painel/vistorias/novo">
          {data.vistorias.slice(0, 3).map((vt) => (
            <Link key={vt.id} to={`/painel/vistorias/${vt.id}`} className="block rounded p-2 hover:bg-white dark:hover:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium capitalize">{vt.tipo}</span>
                {vt.finalizada && <span className="text-xs text-green-600">✓</span>}
              </div>
              <p className="text-xs text-gray-500">{fmtData(vt.realizada_em)}</p>
            </Link>
          ))}
        </Section>
      </div>
    </div>
  )
}

export default ImovelLinksSection
