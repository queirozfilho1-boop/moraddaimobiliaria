import { useEffect, useMemo, useState } from 'react'
import {
  Loader2, Plus, ChevronLeft, ChevronRight, MessageCircle, Phone, Mail, Trash2,
  CheckCircle2, X, Calendar as CalIcon, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import BuscarCliente, { type Cliente } from '@/components/BuscarCliente'

type ViewMode = 'mes' | 'semana' | 'dia'

interface Visita {
  id: string
  imovel_id: string
  cliente_id?: string | null
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
  interesse?: string | null
  proximo_passo?: string | null
  gostou?: boolean | null
  google_event_id?: string | null
  imoveis?: { codigo?: string; titulo?: string; endereco?: string } | null
  users_profiles?: { nome?: string } | null
}

interface CorretorOpt {
  id: string
  nome: string
  is_socio: boolean
  is_corretor: boolean
  is_assistente: boolean
  gcal_connected_at: string | null
}

interface Slot { start: string; end: string }

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'

const fmt = (d: Date) => d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const sameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

const toLocalDateInput = (d: Date) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function callEdge(path: string, body: any) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return { res, json: await res.json().catch(() => ({})) }
}

const VisitasPage = () => {
  const { profile } = useAuth()
  const isSocio = !!profile?.is_socio

  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('mes')
  const [refer, setRefer] = useState(new Date()) // âncora da view
  const [showModal, setShowModal] = useState<{ data?: Date; visita?: Visita } | null>(null)

  const [imoveis, setImoveis] = useState<{ id: string; codigo?: string; titulo?: string }[]>([])
  const [corretores, setCorretores] = useState<CorretorOpt[]>([])
  const [filtroCorretor, setFiltroCorretor] = useState<string>('todos')

  // Estado do form de nova visita
  const [novo, setNovo] = useState({
    imovel_id: '',
    cliente_id: '' as string | '',
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    data: '',
    hora: '',
    duracao_min: 60,
    observacoes: '',
    corretor_id: profile?.id || '',
  })
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)

  // Slots
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null)

  // Edição pós-visita
  const [posVisita, setPosVisita] = useState({
    gostou: null as boolean | null,
    interesse: '',
    proximo_passo: '',
    resultado: '',
  })
  const [savingPos, setSavingPos] = useState(false)

  // Carrega corretores
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('users_profiles')
        .select('id, nome, is_socio, is_assistente, is_corretor, gcal_connected_at, ativo')
        .eq('ativo', true)
        .or('is_corretor.eq.true,is_socio.eq.true,is_assistente.eq.true')
        .order('nome')
      setCorretores((data || []) as any)
    })()
  }, [])

  // Define corretor inicial do form ao carregar profile
  useEffect(() => {
    if (profile?.id && !novo.corretor_id) {
      setNovo((n) => ({ ...n, corretor_id: profile.id }))
    }
  }, [profile?.id]) // eslint-disable-line

  // Range da view atual
  const range = useMemo(() => {
    if (view === 'mes') {
      return {
        ini: new Date(refer.getFullYear(), refer.getMonth(), 1),
        fim: new Date(refer.getFullYear(), refer.getMonth() + 1, 0, 23, 59, 59),
      }
    }
    if (view === 'semana') {
      const r = new Date(refer)
      const dow = r.getDay()
      const ini = new Date(r); ini.setDate(r.getDate() - dow); ini.setHours(0, 0, 0, 0)
      const fim = new Date(ini); fim.setDate(ini.getDate() + 6); fim.setHours(23, 59, 59, 0)
      return { ini, fim }
    }
    // dia
    const ini = new Date(refer); ini.setHours(0, 0, 0, 0)
    const fim = new Date(refer); fim.setHours(23, 59, 59, 0)
    return { ini, fim }
  }, [refer, view])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('visitas')
      .select('*, imoveis(codigo, titulo, endereco), users_profiles!visitas_corretor_id_fkey(nome)')
      .gte('data_hora', range.ini.toISOString())
      .lte('data_hora', range.fim.toISOString())
      .order('data_hora')
    if (filtroCorretor !== 'todos') q = q.eq('corretor_id', filtroCorretor)
    const [{ data }, { data: imv }] = await Promise.all([
      q,
      supabase.from('imoveis').select('id, codigo, titulo').order('codigo'),
    ])
    setVisitas((data || []) as Visita[])
    setImoveis((imv || []) as any)
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [range.ini.getTime(), range.fim.getTime(), filtroCorretor])

  // ---------------- Slots ----------------
  async function carregarSlots(corretor_id: string, dataYYYYMMDD: string) {
    if (!corretor_id || !dataYYYYMMDD) { setSlots([]); return }
    setSlotsLoading(true)
    const ini = new Date(`${dataYYYYMMDD}T00:00:00`)
    const fim = new Date(`${dataYYYYMMDD}T23:59:59`)
    const { res, json } = await callEdge('gcal-freebusy', {
      user_profile_id: corretor_id,
      data_inicio: ini.toISOString(),
      data_fim: fim.toISOString(),
    })
    setSlotsLoading(false)
    if (!res.ok) { setSlots([]); setGcalConnected(null); return }
    setSlots(json.slots || [])
    setGcalConnected(!!json.gcal_connected)
  }

  useEffect(() => {
    if (showModal && !showModal.visita && novo.corretor_id && novo.data) {
      carregarSlots(novo.corretor_id, novo.data)
    }
    // eslint-disable-next-line
  }, [novo.corretor_id, novo.data, showModal?.data])

  // ---------------- Calendário (mês) ----------------
  const dias = useMemo(() => {
    if (view !== 'mes') return []
    const inicio = new Date(refer.getFullYear(), refer.getMonth(), 1)
    const offset = inicio.getDay()
    const fim = new Date(refer.getFullYear(), refer.getMonth() + 1, 0)
    const arr: Date[] = []
    for (let i = 0; i < offset; i++) arr.push(new Date(0))
    for (let d = 1; d <= fim.getDate(); d++) arr.push(new Date(refer.getFullYear(), refer.getMonth(), d))
    return arr
  }, [refer, view])

  // Semana: dias da semana atual
  const diasSemana = useMemo(() => {
    if (view !== 'semana') return []
    const r = new Date(refer); const dow = r.getDay()
    const ini = new Date(r); ini.setDate(r.getDate() - dow); ini.setHours(0, 0, 0, 0)
    const arr: Date[] = []
    for (let i = 0; i < 7; i++) { const d = new Date(ini); d.setDate(ini.getDate() + i); arr.push(d) }
    return arr
  }, [refer, view])

  function novaVisitaParaDia(d: Date) {
    setNovo({
      imovel_id: '',
      cliente_id: '',
      cliente_nome: '',
      cliente_telefone: '',
      cliente_email: '',
      data: toLocalDateInput(d),
      hora: '',
      duracao_min: 60,
      observacoes: '',
      corretor_id: profile?.id || '',
    })
    setClienteSel(null)
    setSlots([])
    setShowModal({ data: d })
  }

  function setSlotEscolhido(s: Slot) {
    const sd = new Date(s.start)
    const ed = new Date(s.end)
    const hh = String(sd.getHours()).padStart(2, '0')
    const mm = String(sd.getMinutes()).padStart(2, '0')
    const dur = Math.round((ed.getTime() - sd.getTime()) / 60000)
    setNovo((n) => ({
      ...n,
      data: toLocalDateInput(sd),
      hora: `${hh}:${mm}`,
      duracao_min: dur,
    }))
  }

  async function salvar() {
    if (!novo.imovel_id || !novo.cliente_nome || !novo.data || !novo.hora) {
      toast.error('Imóvel, cliente, data e hora são obrigatórios'); return
    }
    if (!novo.corretor_id) { toast.error('Selecione o corretor'); return }
    const dt = new Date(`${novo.data}T${novo.hora}`)
    const dtFim = new Date(dt.getTime() + (novo.duracao_min || 60) * 60000)

    // Detecção de conflito (server-side via PostgREST)
    const { data: conflitos } = await supabase
      .from('visitas')
      .select('id, data_hora, duracao_min, cliente_nome')
      .eq('corretor_id', novo.corretor_id)
      .neq('status', 'cancelada')
      .gte('data_hora', new Date(dt.getTime() - 4 * 60 * 60000).toISOString())
      .lte('data_hora', dtFim.toISOString())
    if (conflitos && conflitos.length > 0) {
      const overlap = conflitos.some((v) => {
        const vs = new Date(v.data_hora).getTime()
        const ve = vs + (v.duracao_min || 60) * 60000
        return vs < dtFim.getTime() && ve > dt.getTime()
      })
      if (overlap) {
        toast.error('Conflito: o corretor já tem outra visita neste horário')
        return
      }
    }

    const { data: inserted, error } = await supabase.from('visitas').insert({
      imovel_id: novo.imovel_id,
      cliente_id: novo.cliente_id || null,
      cliente_nome: novo.cliente_nome,
      cliente_telefone: novo.cliente_telefone || null,
      cliente_email: novo.cliente_email || null,
      data_hora: dt.toISOString(),
      duracao_min: novo.duracao_min,
      observacoes: novo.observacoes || null,
      criado_por: profile?.id,
      corretor_id: novo.corretor_id,
    }).select('id, corretor_id').single()

    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Visita agendada')

    // Fire-and-forget: criar evento no Google Calendar do corretor
    const corretor = corretores.find((c) => c.id === novo.corretor_id)
    if (corretor?.gcal_connected_at && inserted?.id) {
      toast.message('Adicionando ao Google Calendar...')
      callEdge('gcal-create-event', { visita_id: inserted.id })
        .then(({ res, json }) => {
          if (res.ok && json.ok) toast.success('Adicionado ao Google Calendar')
          else if (json?.skipped) { /* sem ação */ }
          else toast.error('Falha ao adicionar ao Google Calendar')
        })
        .catch(() => {})
    }

    setShowModal(null); load()
  }

  async function mudarStatus(v: Visita, novoStatus: Visita['status']) {
    const { error } = await supabase.from('visitas').update({ status: novoStatus }).eq('id', v.id)
    if (error) { toast.error('Erro: ' + error.message); return }

    if (novoStatus === 'cancelada' && v.google_event_id) {
      callEdge('gcal-update-event', { visita_id: v.id, action: 'delete' }).catch(() => {})
    }

    if (novoStatus === 'realizada') {
      // Atualiza estado local pra abrir os campos pós-visita
      const atualizada = { ...v, status: 'realizada' as const }
      setShowModal({ visita: atualizada })
      setPosVisita({
        gostou: v.gostou ?? null,
        interesse: v.interesse || '',
        proximo_passo: v.proximo_passo || '',
        resultado: v.resultado || '',
      })
    }
    load()
  }

  async function salvarPosVisita(v: Visita) {
    setSavingPos(true)
    const { error } = await supabase.from('visitas').update({
      gostou: posVisita.gostou,
      interesse: posVisita.interesse || null,
      proximo_passo: posVisita.proximo_passo || null,
      resultado: posVisita.resultado || null,
    }).eq('id', v.id)
    setSavingPos(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Resultado salvo')
    load()
  }

  async function remover(v: Visita) {
    if (!confirm(`Remover visita com ${v.cliente_nome}?`)) return
    if (v.google_event_id) {
      try {
        await callEdge('gcal-update-event', { visita_id: v.id, action: 'delete' })
      } catch { /* segue mesmo assim */ }
    }
    await supabase.from('visitas').delete().eq('id', v.id); load()
  }

  function linkConfirmacao(v: Visita): string {
    const tel = (v.cliente_telefone || '').replace(/\D/g, '')
    const dt = new Date(v.data_hora).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
    const msg = `Olá, ${v.cliente_nome}! 🏠\n\nConfirmando sua visita ao imóvel ${v.imoveis?.codigo || ''} (${v.imoveis?.titulo || ''}) em ${dt}.\n\nEndereço: ${v.imoveis?.endereco || ''}\n\nNos vemos lá! Qualquer alteração, é só avisar.\n\nMoradda Imobiliária`
    return tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : '#'
  }

  function abrirVisita(v: Visita) {
    setShowModal({ visita: v })
    setPosVisita({
      gostou: v.gostou ?? null,
      interesse: v.interesse || '',
      proximo_passo: v.proximo_passo || '',
      resultado: v.resultado || '',
    })
  }

  const proximas = visitas.filter((v) => v.status === 'agendada' || v.status === 'confirmada').slice(0, 5)

  function navPrev() {
    if (view === 'mes') setRefer(new Date(refer.getFullYear(), refer.getMonth() - 1, 1))
    else if (view === 'semana') { const d = new Date(refer); d.setDate(refer.getDate() - 7); setRefer(d) }
    else { const d = new Date(refer); d.setDate(refer.getDate() - 1); setRefer(d) }
  }
  function navNext() {
    if (view === 'mes') setRefer(new Date(refer.getFullYear(), refer.getMonth() + 1, 1))
    else if (view === 'semana') { const d = new Date(refer); d.setDate(refer.getDate() + 7); setRefer(d) }
    else { const d = new Date(refer); d.setDate(refer.getDate() + 1); setRefer(d) }
  }

  const headerLabel = view === 'mes'
    ? refer.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : view === 'semana'
      ? `Semana de ${diasSemana[0]?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a ${diasSemana[6]?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
      : refer.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  // ---------- Render ----------
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Calendário de Visitas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Agenda integrada ao Google Calendar · slots livres por corretor · WhatsApp · pós-visita</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro corretor */}
          <select
            value={filtroCorretor}
            onChange={(e) => setFiltroCorretor(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            title="Filtrar por corretor"
          >
            <option value="todos">Todos corretores</option>
            {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          {/* Toggle visão */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-600 dark:bg-gray-700">
            {(['mes', 'semana', 'dia'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  view === v ? 'bg-white text-moradda-blue-700 shadow-sm dark:bg-gray-800 dark:text-moradda-blue-300' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {v === 'mes' ? 'Mês' : v === 'semana' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>

          <button onClick={() => novaVisitaParaDia(new Date())} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
            <Plus size={15} /> Nova Visita
          </button>
        </div>
      </div>

      {/* Próximas */}
      {proximas.length > 0 && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-900/20">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Próximas visitas</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {proximas.map((v) => (
              <div key={v.id} className="rounded-lg bg-white p-3 dark:bg-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{v.cliente_nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COR[v.status]}`}>{STATUS_LABEL[v.status]}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{v.imoveis?.codigo} · {fmt(new Date(v.data_hora))}</p>
                {v.users_profiles?.nome && <p className="text-[10px] text-gray-400">com {v.users_profiles.nome}</p>}
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
                  <button onClick={() => abrirVisita(v)} className="ml-auto text-xs text-moradda-blue-600 hover:underline">abrir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header calendário */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <button onClick={navPrev} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{headerLabel}</h2>
        <button onClick={navNext} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : view === 'mes' ? (
        <CalendarioMes
          dias={dias}
          visitas={visitas}
          onClickDia={novaVisitaParaDia}
          onClickVisita={abrirVisita}
        />
      ) : view === 'semana' ? (
        <CalendarioGrid
          dias={diasSemana}
          visitas={visitas}
          onClickSlot={(d) => novaVisitaParaDia(d)}
          onClickVisita={abrirVisita}
        />
      ) : (
        <CalendarioGrid
          dias={[refer]}
          visitas={visitas}
          onClickSlot={(d) => novaVisitaParaDia(d)}
          onClickVisita={abrirVisita}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(null)}>
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            {showModal.visita ? (
              // ---------- Visualizar visita ----------
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{showModal.visita.cliente_nome}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COR[showModal.visita.status]}`}>{STATUS_LABEL[showModal.visita.status]}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><CalIcon size={13} className="inline mr-1 text-gray-400" /> {fmt(new Date(showModal.visita.data_hora))} ({showModal.visita.duracao_min}min)</p>
                  <p>🏠 {showModal.visita.imoveis?.codigo} - {showModal.visita.imoveis?.titulo}</p>
                  <p className="text-xs text-gray-500">{showModal.visita.imoveis?.endereco}</p>
                  {showModal.visita.users_profiles?.nome && <p className="text-xs text-gray-500">Corretor: {showModal.visita.users_profiles.nome}</p>}
                  {showModal.visita.cliente_telefone && <p>📱 {showModal.visita.cliente_telefone}</p>}
                  {showModal.visita.cliente_email && <p>✉️ {showModal.visita.cliente_email}</p>}
                  {showModal.visita.observacoes && <p className="rounded bg-gray-50 dark:bg-gray-700/30 p-2 text-xs">{showModal.visita.observacoes}</p>}
                  {showModal.visita.google_event_id && (
                    <p className="text-xs text-emerald-600"><CheckCircle2 size={12} className="inline mr-1" /> Sincronizado com Google Calendar</p>
                  )}
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

                {/* Pós-visita */}
                {showModal.visita.status === 'realizada' && (
                  <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800/40 dark:bg-purple-900/20">
                    <h3 className="mb-3 text-sm font-semibold text-purple-800 dark:text-purple-300">Resultado pós-visita</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Cliente gostou?</label>
                        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-700">
                          {[
                            { v: true, label: 'Sim' },
                            { v: false, label: 'Não' },
                            { v: null, label: '—' },
                          ].map((o) => (
                            <button
                              key={String(o.v)}
                              onClick={() => setPosVisita(p => ({ ...p, gostou: o.v }))}
                              className={`rounded-md px-3 py-1 text-xs font-medium ${posVisita.gostou === o.v ? 'bg-moradda-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Interesse</label>
                          <select value={posVisita.interesse} onChange={(e) => setPosVisita(p => ({ ...p, interesse: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                            <option value="">—</option>
                            <option value="alto">Alto</option>
                            <option value="medio">Médio</option>
                            <option value="baixo">Baixo</option>
                            <option value="nenhum">Nenhum</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Próximo passo</label>
                          <select value={posVisita.proximo_passo} onChange={(e) => setPosVisita(p => ({ ...p, proximo_passo: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                            <option value="">—</option>
                            <option value="proposta">Proposta</option>
                            <option value="visita_2">Visita 2</option>
                            <option value="aguardando_decisao">Aguardando decisão</option>
                            <option value="descartado">Descartado</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Resultado / observações pós-visita</label>
                        <textarea rows={3} value={posVisita.resultado} onChange={(e) => setPosVisita(p => ({ ...p, resultado: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => salvarPosVisita(showModal.visita!)}
                          disabled={savingPos}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                          {savingPos && <Loader2 size={14} className="animate-spin" />}
                          Salvar pós-visita
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ---------- Nova visita ----------
              <div>
                <h2 className="mb-4 text-lg font-semibold">Nova Visita</h2>
                <div className="space-y-3">
                  {/* Corretor */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Corretor</label>
                    <select
                      value={novo.corretor_id}
                      onChange={(e) => setNovo({ ...novo, corretor_id: e.target.value, hora: '' })}
                      disabled={!isSocio}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-70"
                    >
                      <option value="">Selecione...</option>
                      {corretores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}{c.gcal_connected_at ? ' · GCal' : ''}
                        </option>
                      ))}
                    </select>
                    {!isSocio && <p className="mt-1 text-[10px] text-gray-400">Só sócios podem agendar para outros usuários.</p>}
                  </div>

                  {/* Imóvel */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Imóvel</label>
                    <select value={novo.imovel_id} onChange={(e) => setNovo({ ...novo, imovel_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                      <option value="">Selecione...</option>
                      {imoveis.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>)}
                    </select>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Cliente</label>
                    <BuscarCliente
                      value={clienteSel ? { id: clienteSel.id, nome: clienteSel.nome, cpf_cnpj: clienteSel.cpf_cnpj } : null}
                      onSelect={(c) => {
                        setClienteSel(c)
                        if (c) {
                          setNovo((n) => ({
                            ...n,
                            cliente_id: c.id,
                            cliente_nome: c.nome,
                            cliente_telefone: c.telefone || c.whatsapp || '',
                            cliente_email: c.email || '',
                          }))
                        } else {
                          setNovo((n) => ({ ...n, cliente_id: '', cliente_nome: '', cliente_telefone: '', cliente_email: '' }))
                        }
                      }}
                    />
                  </div>

                  {/* Data + slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Data</label>
                      <input type="date" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value, hora: '' })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Hora</label>
                      <input type="time" value={novo.hora} onChange={(e) => setNovo({ ...novo, hora: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Duração (min)</label>
                      <input type="number" min={15} step={15} value={novo.duracao_min} onChange={(e) => setNovo({ ...novo, duracao_min: Number(e.target.value) || 60 })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                    </div>
                  </div>

                  {/* Slots livres */}
                  {novo.corretor_id && novo.data && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Horários livres do corretor</p>
                        {gcalConnected === false && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                            <AlertTriangle size={10} /> sem Google Calendar
                          </span>
                        )}
                        {gcalConnected === true && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">via Google Calendar</span>
                        )}
                      </div>
                      {slotsLoading ? (
                        <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin" /></div>
                      ) : slots.length === 0 ? (
                        <p className="text-xs text-gray-500">Nenhum horário livre nesse dia. Verifique a disponibilidade do corretor (Perfil → Disponibilidade).</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {slots.map((s) => {
                            const sd = new Date(s.start)
                            const hh = String(sd.getHours()).padStart(2, '0')
                            const mm = String(sd.getMinutes()).padStart(2, '0')
                            const isSel = novo.hora === `${hh}:${mm}`
                            return (
                              <button
                                key={s.start}
                                type="button"
                                onClick={() => setSlotEscolhido(s)}
                                className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                                  isSel
                                    ? 'border-moradda-blue-500 bg-moradda-blue-500 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-moradda-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                                }`}
                              >
                                {hh}:{mm}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {gcalConnected === false && (
                        <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
                          Este corretor ainda não conectou o Google Calendar — slots calculados apenas com base na disponibilidade configurada e visitas no painel.
                        </p>
                      )}
                    </div>
                  )}

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

// =====================================================================
// Subcomponentes de visualização
// =====================================================================

function CalendarioMes({ dias, visitas, onClickDia, onClickVisita }: {
  dias: Date[]; visitas: Visita[]; onClickDia: (d: Date) => void; onClickVisita: (v: Visita) => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dias.map((d, i) => {
          if (d.getTime() === 0) return <div key={i} />
          const visDia = visitas.filter((v) => sameDay(new Date(v.data_hora), d))
          const hoje = sameDay(d, new Date())
          return (
            <div key={i}
              onClick={() => onClickDia(d)}
              className={`min-h-[90px] cursor-pointer rounded-lg border p-1.5 transition hover:bg-blue-50 dark:hover:bg-blue-900/20 ${hoje ? 'border-moradda-blue-500 bg-blue-50/50 dark:bg-blue-900/30' : 'border-gray-100 dark:border-gray-700'}`}>
              <p className={`text-xs font-medium ${hoje ? 'text-moradda-blue-700' : 'text-gray-700 dark:text-gray-300'}`}>{d.getDate()}</p>
              <div className="mt-1 space-y-0.5">
                {visDia.slice(0, 3).map((v) => (
                  <button
                    key={v.id}
                    onClick={(e) => { e.stopPropagation(); onClickVisita(v) }}
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
  )
}

function CalendarioGrid({ dias, visitas, onClickSlot, onClickVisita }: {
  dias: Date[]; visitas: Visita[]; onClickSlot: (d: Date) => void; onClickVisita: (v: Visita) => void
}) {
  const horas: number[] = []
  for (let h = 6; h <= 22; h++) horas.push(h)
  const PX_POR_HORA = 56

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="min-w-[640px]">
        {/* Header dias */}
        <div className="grid border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: `60px repeat(${dias.length}, minmax(0,1fr))` }}>
          <div />
          {dias.map((d, i) => {
            const hoje = sameDay(d, new Date())
            return (
              <div key={i} className={`p-2 text-center text-xs ${hoje ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                <p className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                  {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </p>
                <p className={`text-lg ${hoje ? 'text-moradda-blue-700 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>{d.getDate()}</p>
              </div>
            )
          })}
        </div>

        {/* Grid horas */}
        <div className="grid relative" style={{ gridTemplateColumns: `60px repeat(${dias.length}, minmax(0,1fr))` }}>
          {/* Coluna horas */}
          <div className="border-r border-gray-200 dark:border-gray-700">
            {horas.map((h) => (
              <div key={h} className="text-right pr-2 text-[10px] text-gray-400 border-b border-gray-100 dark:border-gray-700/50" style={{ height: PX_POR_HORA }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Colunas dias */}
          {dias.map((d, di) => {
            const visDia = visitas.filter((v) => sameDay(new Date(v.data_hora), d))
            return (
              <div key={di} className="relative border-r border-gray-200 dark:border-gray-700">
                {horas.map((h) => {
                  const slotDate = new Date(d); slotDate.setHours(h, 0, 0, 0)
                  return (
                    <div
                      key={h}
                      onClick={() => onClickSlot(slotDate)}
                      className="cursor-pointer border-b border-gray-100 hover:bg-blue-50/50 dark:border-gray-700/50 dark:hover:bg-blue-900/20"
                      style={{ height: PX_POR_HORA }}
                    />
                  )
                })}
                {visDia.map((v) => {
                  const dt = new Date(v.data_hora)
                  const inicioH = dt.getHours() + dt.getMinutes() / 60
                  const top = (inicioH - 6) * PX_POR_HORA
                  const height = ((v.duracao_min || 60) / 60) * PX_POR_HORA
                  if (top < 0) return null
                  return (
                    <button
                      key={v.id}
                      onClick={(e) => { e.stopPropagation(); onClickVisita(v) }}
                      className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-left overflow-hidden ${STATUS_COR[v.status]}`}
                      style={{ top, height: Math.max(height - 2, 18) }}
                      title={`${v.cliente_nome} · ${v.imoveis?.codigo || ''}`}
                    >
                      <p className="truncate font-semibold">
                        {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {v.cliente_nome}
                      </p>
                      {v.imoveis?.codigo && <p className="truncate opacity-80">{v.imoveis.codigo}</p>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default VisitasPage
