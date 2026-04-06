import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Kanban,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  X,
  Users,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Clock,
  CalendarCheck,
  Send,
  Building2,
  User,
  StickyNote,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LeadStatus =
  | 'novo' | 'em_triagem' | 'qualificado' | 'em_atendimento'
  | 'aguardando_retorno' | 'followup_agendado' | 'visita_agendada'
  | 'proposta_enviada' | 'em_negociacao' | 'convertido' | 'perdido' | 'sem_resposta'

interface Lead {
  id: string
  nome: string
  telefone: string
  email: string
  mensagem?: string
  origem: string
  imovel_id?: string | null
  corretor_id: string
  status: LeadStatus
  notas?: string | null
  proxima_acao?: string | null
  proxima_acao_data?: string | null
  created_at: string
  updated_at: string
  imoveis?: { id: string; titulo: string; codigo: string } | null
  users_profiles?: { id: string; nome: string } | null
}

interface HistoricoEntry {
  id: string
  lead_id: string
  usuario_id: string
  usuario_nome: string
  tipo: string
  descricao: string
  created_at: string
}

interface Corretor {
  id: string
  nome: string
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const statusConfig: Record<LeadStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  novo:                { label: 'Novo',               color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-900/30',     border: 'border-blue-300 dark:border-blue-700',     dot: 'bg-blue-500' },
  em_triagem:          { label: 'Em Triagem',         color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/30',  border: 'border-indigo-300 dark:border-indigo-700', dot: 'bg-indigo-500' },
  qualificado:         { label: 'Qualificado',        color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/30',  border: 'border-purple-300 dark:border-purple-700', dot: 'bg-purple-500' },
  em_atendimento:      { label: 'Em Atendimento',     color: 'text-cyan-700 dark:text-cyan-300',     bg: 'bg-cyan-50 dark:bg-cyan-900/30',      border: 'border-cyan-300 dark:border-cyan-700',     dot: 'bg-cyan-500' },
  aguardando_retorno:  { label: 'Aguardando Retorno', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/30',  border: 'border-yellow-300 dark:border-yellow-700', dot: 'bg-yellow-500' },
  followup_agendado:   { label: 'Follow-up Agendado', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/30',  border: 'border-orange-300 dark:border-orange-700', dot: 'bg-orange-500' },
  visita_agendada:     { label: 'Visita Agendada',    color: 'text-teal-700 dark:text-teal-300',     bg: 'bg-teal-50 dark:bg-teal-900/30',      border: 'border-teal-300 dark:border-teal-700',     dot: 'bg-teal-500' },
  proposta_enviada:    { label: 'Proposta Enviada',   color: 'text-pink-700 dark:text-pink-300',     bg: 'bg-pink-50 dark:bg-pink-900/30',      border: 'border-pink-300 dark:border-pink-700',     dot: 'bg-pink-500' },
  em_negociacao:       { label: 'Em Negociacao',       color: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-900/30',    border: 'border-amber-300 dark:border-amber-700',   dot: 'bg-amber-500' },
  convertido:          { label: 'Convertido',         color: 'text-green-700 dark:text-green-300',   bg: 'bg-green-50 dark:bg-green-900/30',    border: 'border-green-300 dark:border-green-700',   dot: 'bg-green-500' },
  perdido:             { label: 'Perdido',            color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-900/30',        border: 'border-red-300 dark:border-red-700',       dot: 'bg-red-500' },
  sem_resposta:        { label: 'Sem Resposta',       color: 'text-gray-700 dark:text-gray-300',     bg: 'bg-gray-50 dark:bg-gray-800/30',      border: 'border-gray-300 dark:border-gray-600',     dot: 'bg-gray-500' },
}

const activeStatuses: LeadStatus[] = [
  'novo', 'em_triagem', 'qualificado', 'em_atendimento',
  'aguardando_retorno', 'followup_agendado', 'visita_agendada',
  'proposta_enviada', 'em_negociacao',
]

const closedStatuses: LeadStatus[] = ['convertido', 'perdido', 'sem_resposta']

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function truncatePhone(phone: string) {
  if (!phone) return '-'
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-...`
  }
  return phone.length > 14 ? phone.slice(0, 14) + '...' : phone
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}m`
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  return new Date(date).getTime() < Date.now()
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CRMPage() {
  const { profile } = useAuth()

  /* State */
  const [leads, setLeads] = useState<Lead[]>([])
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCorretor, setFilterCorretor] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [historico, setHistorico] = useState<HistoricoEntry[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  /* Fetch leads */
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('id, nome, telefone, email, mensagem, origem, status, notas, proxima_acao, proxima_acao_data, corretor_id, imovel_id, created_at, updated_at, imoveis(id, titulo, codigo), users_profiles!corretor_id(id, nome)')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar leads')
      console.error(error)
    } else {
      setLeads((data as unknown as Lead[]) || [])
    }
    setLoading(false)
  }, [])

  /* Fetch corretores */
  const fetchCorretores = useCallback(async () => {
    const { data } = await supabase
      .from('users_profiles')
      .select('id, nome')
      .order('nome')
    if (data) setCorretores(data)
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchCorretores()
  }, [fetchLeads, fetchCorretores])

  /* Fetch historico for selected lead */
  const fetchHistorico = useCallback(async (leadId: string) => {
    setLoadingHistorico(true)
    const { data, error } = await supabase
      .from('leads_historico')
      .select('*')
      .eq('lead_id', leadId)
      .eq('tipo', 'observacao')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setHistorico((data as HistoricoEntry[]) || [])
    }
    setLoadingHistorico(false)
  }, [])

  /* Open detail panel */
  const openDetail = useCallback((lead: Lead) => {
    setSelectedLead(lead)
    setNewNote('')
    fetchHistorico(lead.id)
  }, [fetchHistorico])

  /* Close detail panel */
  const closeDetail = useCallback(() => {
    setSelectedLead(null)
    setHistorico([])
    setNewNote('')
  }, [])

  /* Add note */
  const addNote = useCallback(async () => {
    if (!selectedLead || !newNote.trim() || !profile) return
    setSavingNote(true)

    const { error } = await supabase.from('leads_historico').insert({
      lead_id: selectedLead.id,
      usuario_id: profile.id,
      usuario_nome: profile.nome,
      tipo: 'observacao',
      descricao: newNote.trim(),
    })

    if (error) {
      toast.error('Erro ao salvar anotacao')
      console.error(error)
    } else {
      toast.success('Anotacao adicionada')
      setNewNote('')
      fetchHistorico(selectedLead.id)
    }
    setSavingNote(false)
  }, [selectedLead, newNote, profile, fetchHistorico])

  /* Filtered leads */
  const filteredLeads = useMemo(() => {
    let result = leads
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.nome.toLowerCase().includes(q) ||
        l.telefone.includes(q) ||
        l.email?.toLowerCase().includes(q)
      )
    }
    if (filterCorretor) {
      result = result.filter(l => l.corretor_id === filterCorretor)
    }
    return result
  }, [leads, search, filterCorretor])

  /* Group leads by status */
  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {} as any
    for (const s of [...activeStatuses, ...closedStatuses]) {
      map[s] = []
    }
    for (const lead of filteredLeads) {
      if (map[lead.status]) {
        map[lead.status].push(lead)
      }
    }
    return map
  }, [filteredLeads])

  /* Stats */
  const stats = useMemo(() => {
    const total = filteredLeads.length
    const ativos = filteredLeads.filter(l => activeStatuses.includes(l.status)).length
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const convertidosMes = filteredLeads.filter(
      l => l.status === 'convertido' && new Date(l.updated_at) >= startOfMonth
    ).length
    return { total, ativos, convertidosMes }
  }, [filteredLeads])

  /* Action dot color */
  const getActionDot = (lead: Lead) => {
    if (!lead.proxima_acao && !lead.proxima_acao_data) {
      return 'bg-yellow-400' // no action scheduled
    }
    if (lead.proxima_acao_data && isOverdue(lead.proxima_acao_data)) {
      return 'bg-red-500' // overdue
    }
    return 'bg-green-500' // has action
  }

  /* WhatsApp link */
  const whatsappLink = (phone: string, nome: string) => {
    const digits = formatPhone(phone)
    const msg = encodeURIComponent(`Ola ${nome}, tudo bem?`)
    return `https://wa.me/55${digits}?text=${msg}`
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <Kanban className="h-7 w-7 text-[#1B4F8A]" />
              CRM
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Visao geral dos leads por status
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm dark:bg-gray-800">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{stats.total}</span>
              <span className="text-gray-500 dark:text-gray-400">total</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm dark:bg-blue-900/30">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-700 dark:text-blue-300">{stats.ativos}</span>
              <span className="text-blue-500 dark:text-blue-400">ativos</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm dark:bg-green-900/30">
              <CalendarCheck className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-300">{stats.convertidosMes}</span>
              <span className="text-green-500 dark:text-green-400">conv. mes</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
          <select
            value={filterCorretor}
            onChange={e => setFilterCorretor(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">Todos os corretores</option>
            {corretores.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <button
            onClick={() => setShowClosed(v => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              showClosed
                ? 'border-[#1B4F8A] bg-[#1B4F8A]/10 text-[#1B4F8A] dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {showClosed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Encerrados ({closedStatuses.reduce((sum, s) => sum + (leadsByStatus[s]?.length || 0), 0)})
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B4F8A]" />
        </div>
      )}

      {/* Kanban Board */}
      {!loading && (
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          {/* Active columns */}
          {activeStatuses.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              onCardClick={openDetail}
              getActionDot={getActionDot}
            />
          ))}

          {/* Closed columns */}
          {showClosed && closedStatuses.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              onCardClick={openDetail}
              getActionDot={getActionDot}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedLead && (
        <DetailPanel
          lead={selectedLead}
          historico={historico}
          loadingHistorico={loadingHistorico}
          newNote={newNote}
          setNewNote={setNewNote}
          savingNote={savingNote}
          onAddNote={addNote}
          onClose={closeDetail}
          whatsappLink={whatsappLink}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  KanbanColumn                                                       */
/* ------------------------------------------------------------------ */

function KanbanColumn({
  status,
  leads,
  onCardClick,
  getActionDot,
}: {
  status: LeadStatus
  leads: Lead[]
  onCardClick: (lead: Lead) => void
  getActionDot: (lead: Lead) => string
}) {
  const cfg = statusConfig[status]

  return (
    <div className="flex w-[280px] min-w-[280px] flex-col rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
      {/* Column header */}
      <div className={`flex items-center justify-between rounded-t-xl border-b px-3 py-2.5 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}>
          {leads.length}
        </span>
      </div>

      {/* Cards container - scrollable */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {leads.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">Nenhum lead</p>
        )}
        {leads.map(lead => (
          <button
            key={lead.id}
            onClick={() => onCardClick(lead)}
            className="group w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-[#1B4F8A]/30 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500/30"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight line-clamp-1">
                {lead.nome}
              </span>
              <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${getActionDot(lead)}`} title={
                getActionDot(lead) === 'bg-green-500' ? 'Acao agendada'
                : getActionDot(lead) === 'bg-red-500' ? 'Acao atrasada'
                : 'Sem acao agendada'
              } />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Phone className="h-3 w-3" />
              <span>{truncatePhone(lead.telefone)}</span>
            </div>
            {lead.users_profiles?.nome && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <User className="h-3 w-3" />
                <span className="line-clamp-1">{lead.users_profiles.nome}</span>
              </div>
            )}
            {lead.imoveis?.codigo && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <Building2 className="h-3 w-3" />
                <span>{lead.imoveis.codigo}</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
              <Clock className="h-3 w-3" />
              {relativeTime(lead.created_at)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DetailPanel                                                        */
/* ------------------------------------------------------------------ */

function DetailPanel({
  lead,
  historico,
  loadingHistorico,
  newNote,
  setNewNote,
  savingNote,
  onAddNote,
  onClose,
  whatsappLink,
}: {
  lead: Lead
  historico: HistoricoEntry[]
  loadingHistorico: boolean
  newNote: string
  setNewNote: (v: string) => void
  savingNote: boolean
  onAddNote: () => void
  onClose: () => void
  whatsappLink: (phone: string, nome: string) => string
}) {
  const cfg = statusConfig[lead.status]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Detalhes do Lead</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel body - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Lead info */}
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{lead.nome}</h3>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{lead.telefone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{lead.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span>Origem: {lead.origem}</span>
              </div>
              {lead.users_profiles?.nome && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Corretor: {lead.users_profiles.nome}</span>
                </div>
              )}
              {lead.imoveis && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Building2 className="h-4 w-4" />
                  <span>{lead.imoveis.codigo} - {lead.imoveis.titulo}</span>
                </div>
              )}
            </div>

            {/* Status badge */}
            <div className="mt-4">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${cfg.bg} ${cfg.color}`}>
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>

            {/* Status change message */}
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              Para alterar o status, acesse o modulo de Leads
            </p>

            {/* WhatsApp button */}
            {lead.telefone && (
              <a
                href={whatsappLink(lead.telefone, lead.nome)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>

          {/* Mensagem */}
          {lead.mensagem && (
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Mensagem</h4>
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {lead.mensagem}
              </p>
            </div>
          )}

          {/* Proxima acao */}
          {(lead.proxima_acao || lead.proxima_acao_data) && (
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Proxima Acao</h4>
              <div className={`rounded-lg border p-3 ${
                lead.proxima_acao_data && isOverdue(lead.proxima_acao_data)
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              }`}>
                {lead.proxima_acao && (
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{lead.proxima_acao}</p>
                )}
                {lead.proxima_acao_data && (
                  <p className={`mt-1 flex items-center gap-1 text-xs ${
                    isOverdue(lead.proxima_acao_data)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    <CalendarCheck className="h-3 w-3" />
                    {fmtDate(lead.proxima_acao_data)}
                    {isOverdue(lead.proxima_acao_data) && ' (atrasado)'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes section */}
          <div className="px-5 py-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <StickyNote className="h-4 w-4" />
              Anotacoes
            </h4>

            {/* New note input */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Escreva uma anotacao..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#1B4F8A] focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
              />
              <button
                onClick={onAddNote}
                disabled={!newNote.trim() || savingNote}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#163f6e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Adicionar Anotacao
              </button>
            </div>

            {/* Existing notes */}
            {loadingHistorico ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : historico.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                Nenhuma anotacao ainda
              </p>
            ) : (
              <div className="space-y-3">
                {historico.map(entry => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {entry.descricao}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{entry.usuario_nome}</span>
                      <span>-</span>
                      <span>{fmtDateTime(entry.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel footer - link to leads module */}
        <div className="shrink-0 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <a
            href="/painel/leads"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4F8A] transition-colors hover:text-[#163f6e] dark:text-blue-400 dark:hover:text-blue-300"
          >
            Ver no modulo de Leads
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </>
  )
}
