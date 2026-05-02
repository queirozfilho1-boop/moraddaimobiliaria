import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, ChevronLeft, ChevronRight, MessageCircle, Phone, Mail, Trash2, CheckCircle2, X, Calendar as CalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Visita {
  id: string
  imovel_id: string
  lead_id?: string | null
  corretor_id?: string | null
  cliente_nome: string
  cliente_telefone?: string | null
  cliente_email?: string | null
  data_hora: string
  duracao_min: number
  status: 'agendada' | 'confirmada' | 'realizada' | 'nao_compareceu' | 'cancelada' | 'reagendada'
  observacoes?: string | null
  resultado?: string | null
  imoveis?: { codigo?: string; titulo?: string; endereco?: string } | null
}

const STATUS_COR: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-700',
  confirmada: 'bg-green-100 text-green-700',
  realizada: 'bg-purple-100 text-purple-700',
  nao_compareceu: 'bg-amber-100 text-amber-700',
  cancelada: 'bg-red-100 text-red-700',
  reagendada: 'bg-gray-100 text-gray-700',
}
const STATUS_LABEL: Record<string, string> = {
  agendada: 'Agendada', confirmada: 'Confirmada', realizada: 'Realizada',
  nao_compareceu: 'Não Compareceu', cancelada: 'Cancelada', reagendada: 'Reagendada',
}

const fmt = (d: Date) => d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const sameDay = (a: Date, b: Date) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

const VisitasPage = () => {
  const { profile } = useAuth()
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date())
  const [showModal, setShowModal] = useState<{ data?: Date; visita?: Visita } | null>(null)
  const [imoveis, setImoveis] = useState<{ id: string; codigo?: string; titulo?: string }[]>([])
  const [novo, setNovo] = useState({
    imovel_id: '', cliente_nome: '', cliente_telefone: '', cliente_email: '',
    data: '', hora: '', duracao_min: 60, observacoes: '',
  })

  async function load() {
    setLoading(true)
    const ini = new Date(mes.getFullYear(), mes.getMonth(), 1)
    const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0, 23, 59)
    const [{ data }, { data: imv }] = await Promise.all([
      supabase.from('visitas').select('*, imoveis(codigo, titulo, endereco)')
        .gte('data_hora', ini.toISOString()).lte('data_hora', fim.toISOString()).order('data_hora'),
      supabase.from('imoveis').select('id, codigo, titulo').order('codigo'),
    ])
    setVisitas((data || []) as Visita[])
    setImoveis((imv || []) as any)
    setLoading(false)
  }
  useEffect(() => { load() }, [mes])

  // Calendário
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const offset = inicio.getDay()
  const dias = useMemo(() => {
    const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
    const arr: Date[] = []
    for (let i = 0; i < offset; i++) arr.push(new Date(0))
    for (let d = 1; d <= fim.getDate(); d++) arr.push(new Date(mes.getFullYear(), mes.getMonth(), d))
    return arr
  }, [mes, offset])

  function novaVisitaParaDia(d: Date) {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setNovo({ imovel_id: '', cliente_nome: '', cliente_telefone: '', cliente_email: '', data: `${yyyy}-${mm}-${dd}`, hora: '14:00', duracao_min: 60, observacoes: '' })
    setShowModal({ data: d })
  }

  async function salvar() {
    if (!novo.imovel_id || !novo.cliente_nome || !novo.data || !novo.hora) { toast.error('Imóvel, cliente, data e hora são obrigatórios'); return }
    const dt = new Date(`${novo.data}T${novo.hora}`)
    const { error } = await supabase.from('visitas').insert({
      imovel_id: novo.imovel_id,
      cliente_nome: novo.cliente_nome,
      cliente_telefone: novo.cliente_telefone || null,
      cliente_email: novo.cliente_email || null,
      data_hora: dt.toISOString(),
      duracao_min: novo.duracao_min,
      observacoes: novo.observacoes || null,
      criado_por: profile?.id,
      corretor_id: profile?.id,
    })
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Visita agendada')
    setShowModal(null); load()
  }

  async function mudarStatus(v: Visita, novoStatus: Visita['status']) {
    await supabase.from('visitas').update({ status: novoStatus }).eq('id', v.id)
    load()
  }

  async function remover(v: Visita) {
    if (!confirm(`Remover visita com ${v.cliente_nome}?`)) return
    await supabase.from('visitas').delete().eq('id', v.id); load()
  }

  function linkConfirmacao(v: Visita): string {
    const tel = (v.cliente_telefone || '').replace(/\D/g, '')
    const dt = new Date(v.data_hora).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
    const msg = `Olá, ${v.cliente_nome}! 🏠\n\nConfirmando sua visita ao imóvel ${v.imoveis?.codigo || ''} (${v.imoveis?.titulo || ''}) em ${dt}.\n\nEndereço: ${v.imoveis?.endereco || ''}\n\nNos vemos lá! Qualquer alteração, é só avisar.\n\nMoradda Imobiliária`
    return tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : '#'
  }

  const proximas = visitas.filter((v) => v.status === 'agendada' || v.status === 'confirmada').slice(0, 5)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Calendário de Visitas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Agenda · confirmação por WhatsApp · resultado pós-visita</p>
        </div>
        <button onClick={() => novaVisitaParaDia(new Date())} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} /> Nova Visita
        </button>
      </div>

      {/* Próximas */}
      {proximas.length > 0 && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-900/20">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Próximas visitas</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {proximas.map((v) => (
              <div key={v.id} className="rounded-lg bg-white p-3 dark:bg-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{v.cliente_nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COR[v.status]}`}>{STATUS_LABEL[v.status]}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{v.imoveis?.codigo} · {fmt(new Date(v.data_hora))}</p>
                <div className="mt-2 flex items-center gap-1">
                  {v.cliente_telefone && (
                    <>
                      <a href={linkConfirmacao(v)} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-green-600 hover:bg-green-50" title="Confirmar via WhatsApp">
                        <MessageCircle size={13} />
                      </a>
                      <a href={`tel:${v.cliente_telefone}`} className="rounded p-1 text-gray-600 hover:bg-gray-50"><Phone size={13} /></a>
                    </>
                  )}
                  {v.cliente_email && <a href={`mailto:${v.cliente_email}`} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Mail size={13} /></a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header calendário */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
          {mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dias.map((d, i) => {
              if (d.getTime() === 0) return <div key={i} />
              const visDia = visitas.filter((v) => sameDay(new Date(v.data_hora), d))
              const hoje = sameDay(d, new Date())
              return (
                <div key={i}
                  onClick={() => novaVisitaParaDia(d)}
                  className={`min-h-[90px] cursor-pointer rounded-lg border p-1.5 transition hover:bg-blue-50 dark:hover:bg-blue-900/20 ${hoje ? 'border-moradda-blue-500 bg-blue-50/50 dark:bg-blue-900/30' : 'border-gray-100 dark:border-gray-700'}`}>
                  <p className={`text-xs font-medium ${hoje ? 'text-moradda-blue-700' : 'text-gray-700 dark:text-gray-300'}`}>{d.getDate()}</p>
                  <div className="mt-1 space-y-0.5">
                    {visDia.slice(0, 3).map((v) => (
                      <button
                        key={v.id}
                        onClick={(e) => { e.stopPropagation(); setShowModal({ visita: v }) }}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${STATUS_COR[v.status]}`}
                        title={`${v.cliente_nome} · ${v.imoveis?.codigo}`}
                      >
                        {new Date(v.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {v.cliente_nome}
                      </button>
                    ))}
                    {visDia.length > 3 && <p className="text-[10px] text-gray-400">+{visDia.length - 3}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal visita */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            {showModal.visita ? (
              // Visualizar visita
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{showModal.visita.cliente_nome}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COR[showModal.visita.status]}`}>{STATUS_LABEL[showModal.visita.status]}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><CalIcon size={13} className="inline mr-1 text-gray-400" /> {fmt(new Date(showModal.visita.data_hora))} ({showModal.visita.duracao_min}min)</p>
                  <p>🏠 {showModal.visita.imoveis?.codigo} - {showModal.visita.imoveis?.titulo}</p>
                  <p className="text-xs text-gray-500">{showModal.visita.imoveis?.endereco}</p>
                  {showModal.visita.cliente_telefone && <p>📱 {showModal.visita.cliente_telefone}</p>}
                  {showModal.visita.cliente_email && <p>✉️ {showModal.visita.cliente_email}</p>}
                  {showModal.visita.observacoes && <p className="rounded bg-gray-50 dark:bg-gray-700/30 p-2 text-xs">{showModal.visita.observacoes}</p>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {showModal.visita.cliente_telefone && (
                    <a href={linkConfirmacao(showModal.visita)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                      <MessageCircle size={12} /> Confirmar WhatsApp
                    </a>
                  )}
                  {showModal.visita.status !== 'realizada' && (
                    <button onClick={() => mudarStatus(showModal.visita!, 'realizada')} className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white hover:bg-purple-700">
                      <CheckCircle2 size={12} /> Realizada
                    </button>
                  )}
                  {showModal.visita.status === 'agendada' && (
                    <button onClick={() => mudarStatus(showModal.visita!, 'confirmada')} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">
                      Marcar Confirmada
                    </button>
                  )}
                  <button onClick={() => mudarStatus(showModal.visita!, 'cancelada')} className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50">
                    <X size={12} /> Cancelar
                  </button>
                  <button onClick={() => { remover(showModal.visita!); setShowModal(null) }} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50">
                    <Trash2 size={12} /> Remover
                  </button>
                </div>
              </div>
            ) : (
              // Nova visita
              <div>
                <h2 className="mb-4 text-lg font-semibold">Nova Visita</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Imóvel</label>
                    <select value={novo.imovel_id} onChange={(e) => setNovo({ ...novo, imovel_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                      <option value="">Selecione...</option>
                      {imoveis.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Data</label>
                      <input type="date" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Hora</label>
                      <input type="time" value={novo.hora} onChange={(e) => setNovo({ ...novo, hora: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                    </div>
                  </div>
                  <input value={novo.cliente_nome} onChange={(e) => setNovo({ ...novo, cliente_nome: e.target.value })} placeholder="Nome do cliente" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={novo.cliente_telefone} onChange={(e) => setNovo({ ...novo, cliente_telefone: e.target.value })} placeholder="Telefone" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                    <input value={novo.cliente_email} onChange={(e) => setNovo({ ...novo, cliente_email: e.target.value })} placeholder="E-mail" type="email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                  </div>
                  <textarea rows={2} value={novo.observacoes} onChange={(e) => setNovo({ ...novo, observacoes: e.target.value })} placeholder="Observações" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setShowModal(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancelar</button>
                  <button onClick={salvar} className="rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-moradda-blue-600">Agendar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitasPage
