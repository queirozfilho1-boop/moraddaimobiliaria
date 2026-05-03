import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Clock,
  CalendarPlus,
  CalendarCheck,
  Eye,
  FileText,
  Send,
  AlertTriangle,
  CheckCircle2,
  X,
  UserPlus,
  Users,
  PhoneCall,
  RefreshCw,
  ArrowRightLeft,
  CircleDot,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import LeadImoveisVinculados from '@/components/LeadImoveisVinculados'
import { useNavigate } from 'react-router-dom'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LeadStatus =
  | 'novo' | 'em_triagem' | 'qualificado' | 'em_atendimento'
  | 'aguardando_retorno' | 'followup_agendado' | 'visita_agendada'
  | 'proposta_enviada' | 'em_negociacao' | 'convertido' | 'perdido' | 'sem_resposta'

type LeadOrigem = 'site_contato' | 'imovel' | 'avaliacao' | 'whatsapp' | 'vender' | 'manual'

type LeadTipo = 'comprar' | 'vender' | 'alugar_imovel' | 'alugar_meu_imovel'

type MotivoPerdaKey =
  | 'sem_resposta' | 'desistiu' | 'comprou_outro' | 'valor_fora'
  | 'imovel_fora_perfil' | 'localizacao' | 'financiamento'
  | 'desqualificado' | 'contato_invalido'

type FollowupTipo = 'whatsapp' | 'ligacao' | 'visita' | 'email'
type FollowupStatus = 'pendente' | 'realizado' | 'cancelado' | 'vencido'

type HistoricoTipo =
  | 'status' | 'atendimento' | 'followup' | 'visita' | 'proposta'
  | 'observacao' | 'encaminhamento' | 'contato' | 'sistema'

interface Lead {
  id: string
  nome: string
  telefone: string
  email: string
  origem: LeadOrigem
  tipo: LeadTipo
  imovel_id?: string
  imovel_titulo?: string
  corretor_id: string
  corretor_nome: string
  status: LeadStatus
  motivo_perda?: string | null
  proxima_acao?: string | null
  proxima_acao_data?: string | null
  primeiro_atendimento_at?: string | null
  convertido_at?: string | null
  perdido_at?: string | null
  mensagem?: string
  created_at: string
  updated_at: string
}

interface HistoricoEntry {
  id: string
  lead_id: string
  usuario_id: string
  usuario_nome: string
  tipo: HistoricoTipo
  descricao: string
  status_anterior?: string | null
  status_novo?: string | null
  metadata?: any
  created_at: string
}

interface Followup {
  id: string
  lead_id: string
  corretor_id: string
  tipo: FollowupTipo
  data_agendada: string
  data_realizada?: string | null
  resultado?: string | null
  observacoes?: string | null
  status: FollowupStatus
  created_at: string
}

interface Corretor {
  id: string
  nome: string
}

/* ------------------------------------------------------------------ */
/*  Config Maps                                                        */
/* ------------------------------------------------------------------ */

const statusConfig: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  novo:                { label: 'Novo',               color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-100 dark:bg-blue-900/40' },
  em_triagem:          { label: 'Em Triagem',         color: 'text-slate-700 dark:text-slate-300',  bg: 'bg-slate-100 dark:bg-slate-900/40' },
  qualificado:         { label: 'Qualificado',        color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  em_atendimento:      { label: 'Em Atendimento',     color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
  aguardando_retorno:  { label: 'Aguardando Retorno', color: 'text-amber-700 dark:text-amber-300',  bg: 'bg-amber-100 dark:bg-amber-900/40' },
  followup_agendado:   { label: 'Follow-up Agendado', color: 'text-cyan-700 dark:text-cyan-300',    bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
  visita_agendada:     { label: 'Visita Agendada',    color: 'text-teal-700 dark:text-teal-300',    bg: 'bg-teal-100 dark:bg-teal-900/40' },
  proposta_enviada:    { label: 'Proposta Enviada',   color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-900/40' },
  em_negociacao:       { label: 'Em Negociacao',      color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  convertido:          { label: 'Convertido',         color: 'text-green-700 dark:text-green-300',  bg: 'bg-green-100 dark:bg-green-900/40' },
  perdido:             { label: 'Perdido',            color: 'text-red-700 dark:text-red-300',      bg: 'bg-red-100 dark:bg-red-900/40' },
  sem_resposta:        { label: 'Sem Resposta',       color: 'text-gray-700 dark:text-gray-300',    bg: 'bg-gray-200 dark:bg-gray-700/40' },
}

const allStatuses = Object.keys(statusConfig) as LeadStatus[]

const origemConfig: Record<LeadOrigem, { label: string; color: string; bg: string }> = {
  site_contato: { label: 'Site - Contato',   color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  imovel:       { label: 'Pagina do Imovel', color: 'text-cyan-700 dark:text-cyan-300',    bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
  avaliacao:    { label: 'Avaliacao',         color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-900/40' },
  whatsapp:     { label: 'WhatsApp',          color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  vender:       { label: 'Quero Vender',      color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  manual:       { label: 'Cadastro Manual',  color: 'text-gray-700 dark:text-gray-300',     bg: 'bg-gray-200 dark:bg-gray-700/40' },
}

const tipoConfig: Record<LeadTipo, { label: string; short: string; color: string; bg: string; icon: string }> = {
  comprar:           { label: 'Quero comprar imóvel',   short: 'Comprar',     color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-100 dark:bg-blue-900/40',     icon: '🏠' },
  vender:            { label: 'Quero vender meu imóvel', short: 'Vender',      color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40', icon: '💰' },
  alugar_imovel:     { label: 'Procura imóvel para alugar', short: 'Inquilino', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: '🔑' },
  alugar_meu_imovel: { label: 'Quer disponibilizar imóvel para locação', short: 'Locador', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-900/40', icon: '📋' },
}

const allTipos = Object.keys(tipoConfig) as LeadTipo[]

const motivoPerdaLabels: Record<MotivoPerdaKey, string> = {
  sem_resposta:       'Sem resposta',
  desistiu:           'Desistiu',
  comprou_outro:      'Comprou outro',
  valor_fora:         'Valor fora do orcamento',
  imovel_fora_perfil: 'Imovel fora do perfil',
  localizacao:        'Localizacao',
  financiamento:      'Problema com financiamento',
  desqualificado:     'Desqualificado',
  contato_invalido:   'Contato invalido',
}

const followupTipoLabels: Record<FollowupTipo, string> = {
  whatsapp: 'WhatsApp',
  ligacao:  'Ligacao',
  visita:   'Visita',
  email:    'E-mail',
}

const historicoTipoIcons: Record<HistoricoTipo, React.ReactNode> = {
  status:         <ArrowRightLeft className="h-4 w-4" />,
  atendimento:    <Users className="h-4 w-4" />,
  followup:       <CalendarCheck className="h-4 w-4" />,
  visita:         <Eye className="h-4 w-4" />,
  proposta:       <FileText className="h-4 w-4" />,
  observacao:     <MessageSquare className="h-4 w-4" />,
  encaminhamento: <Send className="h-4 w-4" />,
  contato:        <PhoneCall className="h-4 w-4" />,
  sistema:        <RefreshCw className="h-4 w-4" />,
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atras`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atras`
  const days = Math.floor(hrs / 24)
  return `${days}d atras`
}

const PAGE_SIZE = 20

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LeadsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'superadmin' || (profile as any)?.role === 'gestor'

  /* ---- State ---- */
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | ''>('')
  const [filterOrigem, setFilterOrigem] = useState<LeadOrigem | ''>('')
  const [filterCorretor, setFilterCorretor] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  // Corretores list (for admin filter + reassign)
  const [corretores, setCorretores] = useState<Corretor[]>([])

  // Expanded lead sub-data
  const [historico, setHistorico] = useState<HistoricoEntry[]>([])
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Notes
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Proxima acao
  const [proxAcao, setProxAcao] = useState('')
  const [proxAcaoData, setProxAcaoData] = useState('')
  const [savingProxAcao, setSavingProxAcao] = useState(false)

  // Modals
  const [showMotivoPerdaModal, setShowMotivoPerdaModal] = useState<{ leadId: string; fromStatus: LeadStatus } | null>(null)
  const [motivoPerda, setMotivoPerda] = useState<MotivoPerdaKey | ''>('')
  const [showFollowupModal, setShowFollowupModal] = useState<string | null>(null)
  const [followupForm, setFollowupForm] = useState({ tipo: 'whatsapp' as FollowupTipo, data: '', hora: '', observacoes: '' })
  const [showResultadoModal, setShowResultadoModal] = useState<Followup | null>(null)
  const [resultadoText, setResultadoText] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  // Novo Lead Modal (cadastro manual)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    mensagem: '',
    tipo: 'comprar' as LeadTipo,
    origem: 'manual' as LeadOrigem,
    corretor_id: '',
    imovel_id: '',
  })
  const [savingNewLead, setSavingNewLead] = useState(false)
  const [imoveisOptions, setImoveisOptions] = useState<{ id: string; codigo: string; titulo: string }[]>([])

  // Filtro por tipo
  const [filterTipo, setFilterTipo] = useState<LeadTipo | ''>('')

  // SLA config
  const [slaMinutes, setSlaMinutes] = useState<Record<string, number>>({})

  /* ---- Fetch corretores ---- */
  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('users_profiles')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setCorretores(data)
      })
  }, [isAdmin])

  /* ---- Fetch SLA config ---- */
  useEffect(() => {
    supabase
      .from('sla_config')
      .select('nome, tempo_minutos')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, number> = {}
          data.forEach((r: any) => { map[r.nome] = r.tempo_minutos })
          setSlaMinutes(map)
        }
      })
  }, [])

  /* ---- Fetch imóveis (para vincular no novo lead) ---- */
  useEffect(() => {
    if (!showNewLeadModal) return
    if (imoveisOptions.length > 0) return
    supabase
      .from('imoveis')
      .select('id, codigo, titulo')
      .eq('ativo', true)
      .order('codigo', { ascending: false })
      .limit(500)
      .then(({ data }) => { if (data) setImoveisOptions(data) })
  }, [showNewLeadModal, imoveisOptions.length])

  /* ---- Fetch leads ---- */
  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*, imoveis(id, codigo, titulo), users_profiles!corretor_id(id, nome)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar leads:', error)
        toast.error('Erro ao carregar leads')
        return
      }

      const mapped: Lead[] = (data || []).map((row: any) => ({
        id: row.id,
        nome: row.nome,
        telefone: row.telefone || '',
        email: row.email || '',
        origem: row.origem as LeadOrigem,
        tipo: (row.tipo as LeadTipo) || 'comprar',
        imovel_id: row.imoveis?.id,
        imovel_titulo: row.imoveis?.titulo,
        corretor_id: row.corretor_id || '',
        corretor_nome: row.users_profiles?.nome || '',
        status: row.status as LeadStatus,
        motivo_perda: row.motivo_perda,
        proxima_acao: row.proxima_acao,
        proxima_acao_data: row.proxima_acao_data,
        primeiro_atendimento_at: row.primeiro_atendimento_at,
        convertido_at: row.convertido_at,
        perdido_at: row.perdido_at,
        mensagem: row.mensagem,
        created_at: row.created_at || '',
        updated_at: row.updated_at || row.created_at || '',
      }))

      setLeads(mapped)
    } catch (err) {
      console.error('Erro ao buscar leads:', err)
      toast.error('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  /* ---- Criar novo lead manualmente ---- */
  const handleCreateLead = useCallback(async () => {
    const f = newLeadForm
    if (!f.nome.trim() || !f.telefone.trim()) {
      toast.error('Nome e telefone são obrigatórios')
      return
    }
    setSavingNewLead(true)
    try {
      const corretorId = f.corretor_id || profile?.id || null
      const payload: any = {
        nome: f.nome.trim(),
        telefone: f.telefone.trim(),
        email: f.email.trim() || null,
        mensagem: f.mensagem.trim() || null,
        tipo: f.tipo,
        origem: f.origem,
        corretor_id: corretorId,
        imovel_id: f.imovel_id || null,
        status: 'novo',
      }
      const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error

      // Histórico inicial
      if (data?.id) {
        await supabase.from('leads_historico').insert({
          lead_id: data.id,
          usuario_id: profile?.id || null,
          usuario_nome: profile?.nome || 'Sistema',
          tipo: 'sistema',
          descricao: `Lead criado manualmente · ${tipoConfig[f.tipo].label}`,
        })
      }

      toast.success('Lead criado com sucesso')
      setShowNewLeadModal(false)
      setNewLeadForm({
        nome: '', telefone: '', email: '', mensagem: '',
        tipo: 'comprar', origem: 'manual', corretor_id: '', imovel_id: '',
      })
      fetchLeads()
    } catch (err: any) {
      toast.error('Erro ao criar lead: ' + (err.message || 'desconhecido'))
    } finally {
      setSavingNewLead(false)
    }
  }, [newLeadForm, profile, fetchLeads])

  /* ---- Fetch detail data when expanding ---- */
  const fetchDetail = useCallback(async (leadId: string) => {
    setLoadingDetail(true)
    try {
      const [hRes, fRes] = await Promise.all([
        supabase
          .from('leads_historico')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false }),
        supabase
          .from('followups')
          .select('*')
          .eq('lead_id', leadId)
          .order('data_agendada', { ascending: false }),
      ])
      if (hRes.data) setHistorico(hRes.data)
      if (fRes.data) setFollowups(fRes.data)
    } catch {
      toast.error('Erro ao carregar detalhes')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    if (expandedId) {
      const lead = leads.find(l => l.id === expandedId)
      if (lead) {
        setProxAcao(lead.proxima_acao || '')
        setProxAcaoData(lead.proxima_acao_data || '')
      }
      setNoteText('')
      fetchDetail(expandedId)
    }
  }, [expandedId, fetchDetail, leads])

  /* ---- Filter logic ---- */
  const filtered = useMemo(() => {
    let result = leads

    // Permission: corretor sees only their leads
    if (!isAdmin && profile?.id) {
      result = result.filter(l => l.corretor_id === profile.id)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.nome.toLowerCase().includes(q) ||
        l.telefone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q))
      )
    }
    if (filterStatus) result = result.filter(l => l.status === filterStatus)
    if (filterOrigem) result = result.filter(l => l.origem === filterOrigem)
    if (filterTipo) result = result.filter(l => l.tipo === filterTipo)
    if (filterCorretor) result = result.filter(l => l.corretor_id === filterCorretor)

    return result
  }, [leads, search, filterStatus, filterOrigem, filterTipo, filterCorretor, isAdmin, profile?.id])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, filterStatus, filterOrigem, filterTipo, filterCorretor])

  /* ---- Stats ---- */
  const visibleLeads = isAdmin ? leads : leads.filter(l => l.corretor_id === profile?.id)
  const now = new Date()
  const thisMonth = (d: string | null | undefined) => {
    if (!d) return false
    const dt = new Date(d)
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  }

  const stats = {
    novos: visibleLeads.filter(l => l.status === 'novo').length,
    em_atendimento: visibleLeads.filter(l =>
      ['em_atendimento', 'aguardando_retorno', 'followup_agendado', 'visita_agendada', 'proposta_enviada', 'em_negociacao'].includes(l.status)
    ).length,
    followups_vencidos: 0, // Will be calculated below
    sem_acao: visibleLeads.filter(l => {
      if (['convertido', 'perdido'].includes(l.status)) return false
      if (!l.proxima_acao_data && !l.proxima_acao) return true
      return false
    }).length,
    convertidos_mes: visibleLeads.filter(l => l.status === 'convertido' && thisMonth(l.convertido_at)).length,
  }

  // Count vencidos from followups — approximate via leads that have status followup_agendado
  // but for simplicity count from loaded data; real count needs backend
  // We'll use a simpler heuristic: leads with proxima_acao_data in the past
  stats.followups_vencidos = visibleLeads.filter(l => {
    if (['convertido', 'perdido'].includes(l.status)) return false
    if (l.proxima_acao_data && new Date(l.proxima_acao_data) < now) return true
    return false
  }).length

  /* ---- SLA indicator ---- */
  function getSlaIndicator(lead: Lead) {
    if (['convertido', 'perdido'].includes(lead.status)) return null
    const slaKey = lead.status === 'novo' ? 'primeiro_atendimento' : 'retorno'
    const limit = slaMinutes[slaKey]
    if (!limit) return null

    const ref = lead.updated_at || lead.created_at
    const elapsed = (Date.now() - new Date(ref).getTime()) / 60000
    if (elapsed > limit) return 'red'
    if (elapsed > limit * 0.75) return 'yellow'
    return null
  }

  /* ---- Status change ---- */
  async function handleStatusChange(leadId: string, newStatus: LeadStatus, motivo?: MotivoPerdaKey) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    setSavingStatus(true)
    try {
      const oldStatus = lead.status
      const updates: any = { status: newStatus }

      if (newStatus === 'perdido') {
        updates.perdido_at = new Date().toISOString()
        updates.motivo_perda = motivo || null
      }
      if (newStatus === 'convertido') {
        updates.convertido_at = new Date().toISOString()
      }
      if (oldStatus === 'novo' && newStatus !== 'novo' && !lead.primeiro_atendimento_at) {
        updates.primeiro_atendimento_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)

      if (error) throw error

      // Insert historico
      await supabase.from('leads_historico').insert({
        lead_id: leadId,
        usuario_id: profile?.id,
        usuario_nome: profile?.nome || 'Sistema',
        tipo: 'status',
        descricao: `Status alterado de "${statusConfig[oldStatus]?.label}" para "${statusConfig[newStatus]?.label}"${motivo ? ` - Motivo: ${motivoPerdaLabels[motivo]}` : ''}`,
        status_anterior: oldStatus,
        status_novo: newStatus,
        metadata: motivo ? { motivo_perda: motivo } : null,
      })

      // Create notification for corretor if admin changed
      if (isAdmin && lead.corretor_id && lead.corretor_id !== profile?.id) {
        await supabase.from('notificacoes').insert({
          usuario_id: lead.corretor_id,
          titulo: 'Status do lead alterado',
          mensagem: `O lead "${lead.nome}" teve o status alterado para "${statusConfig[newStatus]?.label}"`,
          tipo: 'info',
          link: null,
          lida: false,
        })
      }

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l))
      toast.success(`Status alterado para "${statusConfig[newStatus].label}"`)
      setShowMotivoPerdaModal(null)
      setMotivoPerda('')

      // Refresh detail if expanded
      if (expandedId === leadId) fetchDetail(leadId)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar status')
    } finally {
      setSavingStatus(false)
    }
  }

  /* ---- Add observation ---- */
  async function handleAddNote(leadId: string) {
    const text = noteText.trim()
    if (!text) return
    setSavingNote(true)
    try {
      const { error } = await supabase.from('leads_historico').insert({
        lead_id: leadId,
        usuario_id: profile?.id,
        usuario_nome: profile?.nome || 'Usuario',
        tipo: 'observacao',
        descricao: text,
      })
      if (error) throw error
      setNoteText('')
      toast.success('Observacao adicionada')
      fetchDetail(leadId)
    } catch {
      toast.error('Erro ao salvar observacao')
    } finally {
      setSavingNote(false)
    }
  }

  /* ---- Save proxima acao ---- */
  async function handleSaveProxAcao(leadId: string) {
    setSavingProxAcao(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          proxima_acao: proxAcao || null,
          proxima_acao_data: proxAcaoData || null,
        })
        .eq('id', leadId)
      if (error) throw error
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, proxima_acao: proxAcao, proxima_acao_data: proxAcaoData } : l))
      toast.success('Proxima acao salva')
    } catch {
      toast.error('Erro ao salvar proxima acao')
    } finally {
      setSavingProxAcao(false)
    }
  }

  /* ---- Schedule follow-up ---- */
  async function handleCreateFollowup(leadId: string) {
    if (!followupForm.data || !followupForm.hora) {
      toast.error('Preencha data e hora')
      return
    }
    try {
      const dataAgendada = `${followupForm.data}T${followupForm.hora}:00`
      const { error } = await supabase.from('followups').insert({
        lead_id: leadId,
        corretor_id: profile?.id,
        tipo: followupForm.tipo,
        data_agendada: dataAgendada,
        observacoes: followupForm.observacoes || null,
        status: 'pendente',
      })
      if (error) throw error

      // Also add to historico
      await supabase.from('leads_historico').insert({
        lead_id: leadId,
        usuario_id: profile?.id,
        usuario_nome: profile?.nome || 'Usuario',
        tipo: 'followup',
        descricao: `Follow-up agendado: ${followupTipoLabels[followupForm.tipo]} em ${fmtDateTime(dataAgendada)}`,
      })

      toast.success('Follow-up agendado')
      setShowFollowupModal(null)
      setFollowupForm({ tipo: 'whatsapp', data: '', hora: '', observacoes: '' })
      fetchDetail(leadId)
    } catch {
      toast.error('Erro ao agendar follow-up')
    }
  }

  /* ---- Mark follow-up as realizado ---- */
  async function handleFollowupRealizado(fu: Followup) {
    if (!resultadoText.trim()) {
      toast.error('Preencha o resultado')
      return
    }
    try {
      const { error } = await supabase
        .from('followups')
        .update({
          status: 'realizado',
          data_realizada: new Date().toISOString(),
          resultado: resultadoText.trim(),
        })
        .eq('id', fu.id)
      if (error) throw error

      await supabase.from('leads_historico').insert({
        lead_id: fu.lead_id,
        usuario_id: profile?.id,
        usuario_nome: profile?.nome || 'Usuario',
        tipo: 'followup',
        descricao: `Follow-up realizado (${followupTipoLabels[fu.tipo]}): ${resultadoText.trim()}`,
      })

      toast.success('Follow-up marcado como realizado')
      setShowResultadoModal(null)
      setResultadoText('')
      fetchDetail(fu.lead_id)
    } catch {
      toast.error('Erro ao atualizar follow-up')
    }
  }

  /* ---- Reassign corretor ---- */
  async function handleReassign(leadId: string, newCorretorId: string) {
    const corretor = corretores.find(c => c.id === newCorretorId)
    if (!corretor) return
    try {
      const { error } = await supabase
        .from('leads')
        .update({ corretor_id: newCorretorId })
        .eq('id', leadId)
      if (error) throw error

      await supabase.from('leads_historico').insert({
        lead_id: leadId,
        usuario_id: profile?.id,
        usuario_nome: profile?.nome || 'Sistema',
        tipo: 'encaminhamento',
        descricao: `Lead encaminhado para ${corretor.nome}`,
      })

      await supabase.from('notificacoes').insert({
        usuario_id: newCorretorId,
        titulo: 'Novo lead atribuido',
        mensagem: `O lead "${leads.find(l => l.id === leadId)?.nome}" foi atribuido a voce`,
        tipo: 'info',
        link: null,
        lida: false,
      })

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, corretor_id: newCorretorId, corretor_nome: corretor.nome } : l))
      toast.success(`Lead encaminhado para ${corretor.nome}`)
      if (expandedId === leadId) fetchDetail(leadId)
    } catch {
      toast.error('Erro ao reatribuir corretor')
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Carregando leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">CRM - Leads</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{filtered.length} lead{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/painel/crm"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <CircleDot className="h-4 w-4" /> Ver no CRM
          </a>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" /> Novo Lead
          </button>
        </div>
      </div>

      {/* ============ Tipo Tabs (compra/venda/aluguel) ============ */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTipo('')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            filterTipo === ''
              ? 'border-gray-700 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          Todos os tipos
        </button>
        {allTipos.map(t => {
          const cfg = tipoConfig[t]
          const count = leads.filter(l => l.tipo === t).length
          const active = filterTipo === t
          return (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? `${cfg.bg} ${cfg.color} border-current`
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.short}</span>
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/40 dark:bg-black/30' : 'bg-gray-200 dark:bg-gray-700'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ============ Stats Cards ============ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Novos',              value: stats.novos,              icon: <UserPlus className="h-5 w-5" />,       bg: 'bg-blue-100 dark:bg-blue-900/40',   color: 'text-blue-700 dark:text-blue-300' },
          { label: 'Em Atendimento',     value: stats.em_atendimento,     icon: <Users className="h-5 w-5" />,          bg: 'bg-yellow-100 dark:bg-yellow-900/40', color: 'text-yellow-700 dark:text-yellow-300' },
          { label: 'Follow-ups Vencidos', value: stats.followups_vencidos, icon: <AlertTriangle className="h-5 w-5" />,  bg: 'bg-red-100 dark:bg-red-900/40',     color: 'text-red-700 dark:text-red-300' },
          { label: 'Sem Acao',           value: stats.sem_acao,           icon: <Timer className="h-5 w-5" />,           bg: 'bg-amber-100 dark:bg-amber-900/40', color: 'text-amber-700 dark:text-amber-300' },
          { label: 'Convertidos (mes)',  value: stats.convertidos_mes,    icon: <TrendingUp className="h-5 w-5" />,      bg: 'bg-green-100 dark:bg-green-900/40', color: 'text-green-700 dark:text-green-300' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-3 rounded-xl p-4 ${s.bg} border border-transparent`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ============ Filters ============ */}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as LeadStatus | '')}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Todos os status</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>

          <select
            value={filterOrigem}
            onChange={e => setFilterOrigem(e.target.value as LeadOrigem | '')}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Todas as origens</option>
            {(Object.keys(origemConfig) as LeadOrigem[]).map(o => (
              <option key={o} value={o}>{origemConfig[o].label}</option>
            ))}
          </select>

          {isAdmin && corretores.length > 0 && (
            <select
              value={filterCorretor}
              onChange={e => setFilterCorretor(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">Todos os corretores</option>
              {corretores.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-800">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {['', 'Nome', 'Telefone', 'Imovel', 'Corretor', 'Status', 'Proxima Acao', 'Atualizado', 'Acoes'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
            {paginated.map(lead => {
              const sCfg = statusConfig[lead.status]
              const isExpanded = expandedId === lead.id
              const sla = getSlaIndicator(lead)

              return (
                <Fragment key={lead.id}>
                  <tr
                    className="cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  >
                    {/* SLA dot */}
                    <td className="w-8 px-2 py-3 text-center">
                      {sla === 'red' && <CircleDot className="inline h-3.5 w-3.5 text-red-500" />}
                      {sla === 'yellow' && <CircleDot className="inline h-3.5 w-3.5 text-yellow-500" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{lead.nome}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{lead.telefone}</td>
                    <td className="px-4 py-3">
                      {lead.imovel_titulo ? (
                        <a
                          href={`/painel/imoveis/${lead.imovel_id}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {lead.imovel_titulo.length > 30 ? lead.imovel_titulo.slice(0, 30) + '...' : lead.imovel_titulo}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{lead.corretor_nome || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sCfg.bg} ${sCfg.color}`}>
                        {sCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {lead.proxima_acao ? (
                        <div className="flex flex-col">
                          <span className="text-xs">{lead.proxima_acao}</span>
                          {lead.proxima_acao_data && (
                            <span className={`text-xs ${new Date(lead.proxima_acao_data) < now ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              {fmtDate(lead.proxima_acao_data)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {relativeTime(lead.updated_at || lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://wa.me/55${formatPhone(lead.telefone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : lead.id) }}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ============ Expanded Detail ============ */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="bg-gray-50/50 px-4 py-6 dark:bg-gray-900/30">
                        {loadingDetail ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                          </div>
                        ) : (
                          <div className="grid gap-6 xl:grid-cols-3">
                            {/* ---- Column 1: Info + Status + Acao ---- */}
                            <div className="space-y-5">
                              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detalhes do Lead</h3>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Phone className="h-4 w-4 shrink-0" />
                                  <span>{lead.telefone}</span>
                                  <a
                                    href={`https://wa.me/55${formatPhone(lead.telefone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  >
                                    WhatsApp
                                  </a>
                                </div>
                                {lead.email && (
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Clock className="h-4 w-4 shrink-0" />
                                  <span>Entrada: {fmtDateTime(lead.created_at)}</span>
                                </div>
                                {lead.origem && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoConfig[lead.tipo]?.bg} ${tipoConfig[lead.tipo]?.color}`}>
                                      <span>{tipoConfig[lead.tipo]?.icon}</span>
                                      {tipoConfig[lead.tipo]?.label}
                                    </span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${origemConfig[lead.origem]?.bg} ${origemConfig[lead.origem]?.color}`}>
                                      {origemConfig[lead.origem]?.label}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {lead.mensagem && (
                                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Mensagem</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{lead.mensagem}</p>
                                </div>
                              )}

                              <LeadImoveisVinculados
                                leadId={lead.id}
                                leadNome={lead.nome}
                                leadTipo={lead.tipo}
                                onCaptarNovo={() => navigate(`/painel/imoveis/novo?from_lead=${lead.id}`)}
                              />


                              {/* Status change */}
                              <div>
                                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Alterar Status</p>
                                <select
                                  value={lead.status}
                                  onChange={e => {
                                    const ns = e.target.value as LeadStatus
                                    if (ns === lead.status) return
                                    if (ns === 'perdido') {
                                      setShowMotivoPerdaModal({ leadId: lead.id, fromStatus: lead.status })
                                    } else {
                                      handleStatusChange(lead.id, ns)
                                    }
                                  }}
                                  disabled={savingStatus}
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                >
                                  {allStatuses.map(s => (
                                    <option key={s} value={s}>{statusConfig[s].label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Reassign corretor (admin only) */}
                              {isAdmin && corretores.length > 0 && (
                                <div>
                                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Corretor Responsavel</p>
                                  <select
                                    value={lead.corretor_id}
                                    onChange={e => handleReassign(lead.id, e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  >
                                    <option value="">Sem corretor</option>
                                    {corretores.map(c => (
                                      <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Proxima acao */}
                              <div>
                                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Proxima Acao</p>
                                <input
                                  type="text"
                                  value={proxAcao}
                                  onChange={e => setProxAcao(e.target.value)}
                                  placeholder="Descreva a proxima acao..."
                                  className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                />
                                <input
                                  type="date"
                                  value={proxAcaoData}
                                  onChange={e => setProxAcaoData(e.target.value)}
                                  className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                />
                                <button
                                  onClick={() => handleSaveProxAcao(lead.id)}
                                  disabled={savingProxAcao}
                                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {savingProxAcao ? 'Salvando...' : 'Salvar'}
                                </button>
                              </div>
                            </div>

                            {/* ---- Column 2: Follow-ups + Observacoes ---- */}
                            <div className="space-y-5">
                              {/* Follow-ups */}
                              <div>
                                <div className="mb-3 flex items-center justify-between">
                                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Follow-ups</h3>
                                  <button
                                    onClick={() => setShowFollowupModal(lead.id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-700"
                                  >
                                    <CalendarPlus className="h-3.5 w-3.5" />
                                    Agendar
                                  </button>
                                </div>

                                {followups.length === 0 ? (
                                  <p className="text-xs text-gray-400">Nenhum follow-up registrado.</p>
                                ) : (
                                  <div className="max-h-52 space-y-2 overflow-y-auto">
                                    {followups.map(fu => {
                                      const isPending = fu.status === 'pendente'
                                      const isVencido = fu.status === 'pendente' && new Date(fu.data_agendada) < now
                                      return (
                                        <div
                                          key={fu.id}
                                          className={`rounded-lg border p-3 ${
                                            isVencido
                                              ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                                              : fu.status === 'realizado'
                                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                              {followupTipoLabels[fu.tipo]}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                              isVencido
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                : fu.status === 'realizado'
                                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                  : fu.status === 'cancelado'
                                                    ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
                                            }`}>
                                              {isVencido ? 'Vencido' : fu.status === 'pendente' ? 'Pendente' : fu.status === 'realizado' ? 'Realizado' : 'Cancelado'}
                                            </span>
                                          </div>
                                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Agendado: {fmtDateTime(fu.data_agendada)}
                                          </p>
                                          {fu.observacoes && (
                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{fu.observacoes}</p>
                                          )}
                                          {fu.resultado && (
                                            <p className="mt-1 text-xs text-green-700 dark:text-green-400">Resultado: {fu.resultado}</p>
                                          )}
                                          {isPending && (
                                            <button
                                              onClick={() => { setShowResultadoModal(fu); setResultadoText('') }}
                                              className="mt-2 inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                                            >
                                              <CheckCircle2 className="h-3 w-3" />
                                              Marcar Realizado
                                            </button>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Observacoes */}
                              <div>
                                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Adicionar Observacao</h3>
                                <textarea
                                  value={noteText}
                                  onChange={e => setNoteText(e.target.value)}
                                  placeholder="Escreva uma observacao..."
                                  rows={3}
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                />
                                <button
                                  onClick={() => handleAddNote(lead.id)}
                                  disabled={!noteText.trim() || savingNote}
                                  className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingNote ? 'Salvando...' : 'Salvar Observacao'}
                                </button>
                              </div>
                            </div>

                            {/* ---- Column 3: Timeline ---- */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Timeline</h3>
                              {historico.length === 0 ? (
                                <p className="text-xs text-gray-400">Nenhum registro no historico.</p>
                              ) : (
                                <div className="relative max-h-[450px] space-y-0 overflow-y-auto pl-6">
                                  {/* Vertical line */}
                                  <div className="absolute left-[11px] top-0 h-full w-px bg-gray-200 dark:bg-gray-700" />

                                  {historico.map((entry) => (
                                    <div key={entry.id} className="relative pb-4">
                                      {/* Dot */}
                                      <div className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-gray-900 ${
                                        entry.tipo === 'status'
                                          ? 'bg-blue-500 text-white'
                                          : entry.tipo === 'observacao'
                                            ? 'bg-amber-500 text-white'
                                            : entry.tipo === 'followup'
                                              ? 'bg-cyan-500 text-white'
                                              : entry.tipo === 'encaminhamento'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-400 text-white'
                                      }`}>
                                        <span className="scale-75">{historicoTipoIcons[entry.tipo] || <CircleDot className="h-3 w-3" />}</span>
                                      </div>

                                      <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{entry.descricao}</p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                          <span>{entry.usuario_nome}</span>
                                          <span>-</span>
                                          <span>{fmtDateTime(entry.created_at)}</span>
                                        </div>
                                        {entry.status_anterior && entry.status_novo && (
                                          <div className="mt-1 flex items-center gap-1 text-xs">
                                            <span className={`rounded px-1.5 py-0.5 ${statusConfig[entry.status_anterior as LeadStatus]?.bg} ${statusConfig[entry.status_anterior as LeadStatus]?.color}`}>
                                              {statusConfig[entry.status_anterior as LeadStatus]?.label}
                                            </span>
                                            <span className="text-gray-400">&rarr;</span>
                                            <span className={`rounded px-1.5 py-0.5 ${statusConfig[entry.status_novo as LeadStatus]?.bg} ${statusConfig[entry.status_novo as LeadStatus]?.color}`}>
                                              {statusConfig[entry.status_novo as LeadStatus]?.label}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`min-w-[32px] rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                    page === i
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ Modal: Motivo Perda ============ */}
      {showMotivoPerdaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Motivo da Perda</h3>
              <button onClick={() => { setShowMotivoPerdaModal(null); setMotivoPerda('') }} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Selecione o motivo pelo qual este lead foi perdido:
            </p>
            <select
              value={motivoPerda}
              onChange={e => setMotivoPerda(e.target.value as MotivoPerdaKey)}
              className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">Selecione...</option>
              {(Object.keys(motivoPerdaLabels) as MotivoPerdaKey[]).map(k => (
                <option key={k} value={k}>{motivoPerdaLabels[k]}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowMotivoPerdaModal(null); setMotivoPerda('') }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!motivoPerda) { toast.error('Selecione um motivo'); return }
                  handleStatusChange(showMotivoPerdaModal.leadId, 'perdido', motivoPerda as MotivoPerdaKey)
                }}
                disabled={!motivoPerda || savingStatus}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {savingStatus ? 'Salvando...' : 'Confirmar Perda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Modal: Agendar Follow-up ============ */}
      {showFollowupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agendar Follow-up</h3>
              <button onClick={() => setShowFollowupModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</label>
                <select
                  value={followupForm.tipo}
                  onChange={e => setFollowupForm(p => ({ ...p, tipo: e.target.value as FollowupTipo }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  {(Object.keys(followupTipoLabels) as FollowupTipo[]).map(t => (
                    <option key={t} value={t}>{followupTipoLabels[t]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Data</label>
                  <input
                    type="date"
                    value={followupForm.data}
                    onChange={e => setFollowupForm(p => ({ ...p, data: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hora</label>
                  <input
                    type="time"
                    value={followupForm.hora}
                    onChange={e => setFollowupForm(p => ({ ...p, hora: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Observacoes</label>
                <textarea
                  value={followupForm.observacoes}
                  onChange={e => setFollowupForm(p => ({ ...p, observacoes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowFollowupModal(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateFollowup(showFollowupModal)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
              >
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Modal: Resultado do Follow-up ============ */}
      {showResultadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resultado do Follow-up</h3>
              <button onClick={() => setShowResultadoModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {followupTipoLabels[showResultadoModal.tipo]} agendado para {fmtDateTime(showResultadoModal.data_agendada)}
            </p>
            <textarea
              value={resultadoText}
              onChange={e => setResultadoText(e.target.value)}
              placeholder="Descreva o resultado..."
              rows={3}
              className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResultadoModal(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleFollowupRealizado(showResultadoModal)}
                disabled={!resultadoText.trim()}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Modal Novo Lead (cadastro manual) ============ */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Novo Lead</h2>
              </div>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {/* Tipo · 4 cards */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo de interesse *</label>
                <div className="grid grid-cols-2 gap-2">
                  {allTipos.map(t => {
                    const cfg = tipoConfig[t]
                    const sel = newLeadForm.tipo === t
                    return (
                      <button
                        key={t}
                        onClick={() => setNewLeadForm(f => ({ ...f, tipo: t }))}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          sel
                            ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-current/20`
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-lg leading-none">{cfg.icon}</div>
                        <div className="mt-1 text-xs font-semibold leading-tight">{cfg.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Nome *</label>
                  <input
                    type="text"
                    value={newLeadForm.nome}
                    onChange={e => setNewLeadForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="Nome do lead"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Telefone *</label>
                  <input
                    type="tel"
                    value={newLeadForm.telefone}
                    onChange={e => setNewLeadForm(f => ({ ...f, telefone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                <input
                  type="email"
                  value={newLeadForm.email}
                  onChange={e => setNewLeadForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Imóvel (apenas para Comprar / Alugar imóvel) */}
              {(newLeadForm.tipo === 'comprar' || newLeadForm.tipo === 'alugar_imovel') && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Imóvel de interesse (opcional)</label>
                  <select
                    value={newLeadForm.imovel_id}
                    onChange={e => setNewLeadForm(f => ({ ...f, imovel_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">— sem imóvel específico —</option>
                    {imoveisOptions.map(im => (
                      <option key={im.id} value={im.id}>{im.codigo} · {im.titulo}</option>
                    ))}
                  </select>
                </div>
              )}

              {isAdmin && corretores.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Atribuir a corretor</label>
                  <select
                    value={newLeadForm.corretor_id}
                    onChange={e => setNewLeadForm(f => ({ ...f, corretor_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">— eu mesmo —</option>
                    {corretores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Observação / mensagem</label>
                <textarea
                  rows={3}
                  value={newLeadForm.mensagem}
                  onChange={e => setNewLeadForm(f => ({ ...f, mensagem: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Origem do contato, perfil do cliente, observações..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
              <button
                onClick={() => setShowNewLeadModal(false)}
                disabled={savingNewLead}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLead}
                disabled={savingNewLead || !newLeadForm.nome.trim() || !newLeadForm.telefone.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingNewLead ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {savingNewLead ? 'Salvando...' : 'Criar lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
