import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Phone, Mail, MessageCircle, ExternalLink, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

type LeadStatus =
  | 'novo' | 'em_triagem' | 'qualificado' | 'em_atendimento' | 'aguardando_retorno'
  | 'followup_agendado' | 'visita_agendada' | 'proposta_enviada' | 'em_negociacao'
  | 'convertido' | 'perdido' | 'sem_resposta'

interface Lead {
  id: string; nome: string; email?: string | null; telefone?: string | null
  status: LeadStatus; tipo?: string | null; origem?: string | null
  interesse?: string | null; mensagem?: string | null
  imovel_id?: string | null; corretor_id?: string | null
  proxima_acao?: string | null; proxima_acao_data?: string | null
  created_at: string
  imoveis?: { codigo?: string; titulo?: string } | null
}

const COLS: { status: LeadStatus; label: string; cor: string }[] = [
  { status: 'novo',              label: 'Novo',              cor: 'bg-blue-50 border-blue-200' },
  { status: 'qualificado',       label: 'Qualificado',       cor: 'bg-indigo-50 border-indigo-200' },
  { status: 'em_atendimento',    label: 'Em Atendimento',    cor: 'bg-yellow-50 border-yellow-200' },
  { status: 'visita_agendada',   label: 'Visita Agendada',   cor: 'bg-teal-50 border-teal-200' },
  { status: 'proposta_enviada',  label: 'Proposta',          cor: 'bg-violet-50 border-violet-200' },
  { status: 'em_negociacao',     label: 'Em Negociação',     cor: 'bg-orange-50 border-orange-200' },
  { status: 'convertido',        label: 'Convertido 🎉',     cor: 'bg-green-50 border-green-200' },
  { status: 'perdido',           label: 'Perdido',           cor: 'bg-red-50 border-red-200' },
]

const TIPO_LABEL: Record<string, string> = {
  comprar: 'Comprar', alugar: 'Alugar', avaliar: 'Avaliar', vender: 'Vender',
}

const fmtData = (s?: string | null) => s ? new Date(s).toLocaleDateString('pt-BR') : '—'

const LeadsPipelinePage = () => {
  const [rows, setRows] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [drag, setDrag] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('id, nome, email, telefone, status, tipo, origem, interesse, mensagem, imovel_id, corretor_id, proxima_acao, proxima_acao_data, created_at, imoveis(codigo, titulo)')
      .order('created_at', { ascending: false })
    setRows((data || []) as Lead[]); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function moveTo(id: string, novo: LeadStatus) {
    const atual = rows.find((r) => r.id === id)
    if (!atual || atual.status === novo) return
    const patch: any = { status: novo }
    if (novo === 'convertido' && !atual['convertido_at' as keyof Lead]) patch.convertido_at = new Date().toISOString()
    if (novo === 'perdido' && !atual['perdido_at' as keyof Lead]) patch.perdido_at = new Date().toISOString()
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: novo } : r))
    const { error } = await supabase.from('leads').update(patch).eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); load() }
    else toast.success(`Movido pra ${COLS.find((c) => c.status === novo)?.label}`)
  }

  const filtered = useMemo(() => rows.filter((r) => {
    if (tipoFilter && r.tipo !== tipoFilter) return false
    if (filter) {
      const s = filter.toLowerCase()
      return `${r.nome} ${r.email || ''} ${r.telefone || ''} ${r.imoveis?.codigo || ''}`.toLowerCase().includes(s)
    }
    return true
  }), [rows, filter, tipoFilter])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/leads" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pipeline de Leads</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Funil comercial · arraste cards entre colunas</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar..." className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
            <option value="">Todos tipos</option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {COLS.map((col) => {
              const items = filtered.filter((r) => r.status === col.status)
              return (
                <div key={col.status}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (drag) { moveTo(drag, col.status); setDrag(null) } }}
                  className={`w-72 flex-shrink-0 rounded-xl border-2 p-3 ${col.cor} dark:bg-gray-800/50 dark:border-gray-700`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">{col.label}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-gray-700">{items.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {items.map((r) => {
                      const tel = (r.telefone || '').replace(/\D/g, '')
                      const wa = tel ? `https://wa.me/55${tel}` : null
                      const atrasoAcao = r.proxima_acao_data && new Date(r.proxima_acao_data) < new Date()
                      return (
                        <div
                          key={r.id}
                          draggable
                          onDragStart={() => setDrag(r.id)}
                          onDragEnd={() => setDrag(null)}
                          className={`cursor-move rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition dark:bg-gray-800 dark:border-gray-700 ${drag === r.id ? 'opacity-50 scale-95' : ''}`}
                        >
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.nome}</p>
                          {r.tipo && <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">{TIPO_LABEL[r.tipo] || r.tipo}</span>}

                          {r.imoveis?.codigo && (
                            <p className="mt-1 text-xs text-blue-600 font-mono">{r.imoveis.codigo}</p>
                          )}
                          {r.interesse && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.interesse}</p>}
                          {r.mensagem && <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">"{r.mensagem}"</p>}

                          {/* Próxima ação */}
                          {r.proxima_acao && (
                            <div className={`mt-2 rounded p-1.5 text-xs ${atrasoAcao ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                              {atrasoAcao && <AlertCircle size={11} className="inline mr-1" />}
                              {r.proxima_acao} · {fmtData(r.proxima_acao_data)}
                            </div>
                          )}

                          {/* Atalhos contato */}
                          <div className="mt-2 flex items-center gap-1">
                            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-green-600 hover:bg-green-50" title="WhatsApp"><MessageCircle size={13} /></a>}
                            {r.email && <a href={`mailto:${r.email}`} className="rounded p-1 text-blue-600 hover:bg-blue-50" title="E-mail"><Mail size={13} /></a>}
                            {r.telefone && <a href={`tel:${r.telefone}`} className="rounded p-1 text-gray-600 hover:bg-gray-50" title="Ligar"><Phone size={13} /></a>}
                            <Link to={`/painel/leads`} className="ml-auto rounded p-1 text-gray-400 hover:bg-gray-100" title="Detalhes"><ExternalLink size={13} /></Link>
                          </div>

                          <p className="mt-2 text-[10px] text-gray-400">{fmtData(r.created_at)}</p>
                        </div>
                      )
                    })}
                    {items.length === 0 && <p className="py-6 text-center text-xs text-gray-400">Vazio</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadsPipelinePage
