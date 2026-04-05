import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  StickyNote,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LeadStatus = 'novo' | 'em_atendimento' | 'convertido' | 'perdido'
type LeadOrigem = 'site_contato' | 'imovel' | 'avaliacao' | 'whatsapp' | 'vender'

interface LeadNote {
  id: string
  text: string
  author: string
  date: string
}

interface Lead {
  id: string
  nome: string
  telefone: string
  email: string
  origem: LeadOrigem
  imovelId?: string
  imovelTitulo?: string
  corretorId: string
  corretorNome: string
  status: LeadStatus
  data: string
  notas: LeadNote[]
  mensagem?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusConfig: Record<LeadStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  novo: { label: 'Novo', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', icon: <UserPlus className="h-3.5 w-3.5" /> },
  em_atendimento: { label: 'Em Atendimento', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/40', icon: <Users className="h-3.5 w-3.5" /> },
  convertido: { label: 'Convertido', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40', icon: <UserCheck className="h-3.5 w-3.5" /> },
  perdido: { label: 'Perdido', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40', icon: <UserX className="h-3.5 w-3.5" /> },
}

const origemConfig: Record<LeadOrigem, { label: string; color: string; bg: string }> = {
  site_contato: { label: 'Site - Contato', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  imovel: { label: 'Página do Imóvel', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
  avaliacao: { label: 'Avaliação', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-900/40' },
  whatsapp: { label: 'WhatsApp', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  vender: { label: 'Quero Vender', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40' },
}

function formatPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LeadsPage() {
  const { profile } = useAuth()
  const isSuperadmin = profile?.role === 'superadmin'

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | ''>('')
  const [filterOrigem, setFilterOrigem] = useState<LeadOrigem | ''>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState<Record<string, string>>({})
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)

  /* Fetch leads from Supabase */
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
        imovelId: row.imoveis?.id,
        imovelTitulo: row.imoveis?.titulo,
        corretorId: row.corretor_id || '',
        corretorNome: row.users_profiles?.nome || '',
        status: row.status as LeadStatus,
        data: row.created_at ? row.created_at.slice(0, 10) : '',
        notas: Array.isArray(row.notas) ? row.notas : [],
        mensagem: row.mensagem,
      }))

      setLeads(mapped)
    } catch (err) {
      console.error('Erro ao buscar leads:', err)
      toast.error('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  /* Filter logic */
  const filtered = useMemo(() => {
    let result = leads

    // Permission: corretor sees only their leads
    if (!isSuperadmin && profile?.id) {
      result = result.filter((l) => l.corretorId === profile.id)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.nome.toLowerCase().includes(q) ||
          l.telefone.includes(q) ||
          l.email.toLowerCase().includes(q),
      )
    }
    if (filterStatus) result = result.filter((l) => l.status === filterStatus)
    if (filterOrigem) result = result.filter((l) => l.origem === filterOrigem)

    return result
  }, [leads, search, filterStatus, filterOrigem, isSuperadmin, profile?.id])

  /* Stats */
  const visibleLeads = isSuperadmin ? leads : leads.filter((l) => l.corretorId === profile?.id)
  const stats = {
    novos: visibleLeads.filter((l) => l.status === 'novo').length,
    em_atendimento: visibleLeads.filter((l) => l.status === 'em_atendimento').length,
    convertidos: visibleLeads.filter((l) => l.status === 'convertido').length,
    perdidos: visibleLeads.filter((l) => l.status === 'perdido').length,
  }

  /* Actions */
  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId)

    if (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao alterar status')
      return
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    )
    setStatusDropdownId(null)
    toast.success(`Status alterado para "${statusConfig[newStatus].label}"`)
  }

  async function handleAddNote(leadId: string) {
    const text = noteText[leadId]?.trim()
    if (!text) return
    const note: LeadNote = {
      id: Date.now().toString(),
      text,
      author: profile?.nome ?? 'Usuário',
      date: new Date().toISOString().slice(0, 10),
    }

    const lead = leads.find((l) => l.id === leadId)
    const updatedNotas = [...(lead?.notas || []), note]

    const { error } = await supabase
      .from('leads')
      .update({ notas: updatedNotas })
      .eq('id', leadId)

    if (error) {
      console.error('Erro ao adicionar nota:', error)
      toast.error('Erro ao salvar observação')
      return
    }

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, notas: updatedNotas } : l,
      ),
    )
    setNoteText((prev) => ({ ...prev, [leadId]: '' }))
    toast.success('Nota adicionada')
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Leads
        </h1>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { key: 'novos', label: 'Novos', status: 'novo' as LeadStatus },
          { key: 'em_atendimento', label: 'Em Atendimento', status: 'em_atendimento' as LeadStatus },
          { key: 'convertidos', label: 'Convertidos', status: 'convertido' as LeadStatus },
          { key: 'perdidos', label: 'Perdidos', status: 'perdido' as LeadStatus },
        ] as const).map((s) => {
          const cfg = statusConfig[s.status]
          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 rounded-xl p-4 ${cfg.bg} border border-transparent`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 ${cfg.color}`}>
                {cfg.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {s.label}
                </p>
                <p className={`text-xl font-bold ${cfg.color}`}>
                  {stats[s.key]}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeadStatus | '')}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Todos os status</option>
            <option value="novo">Novo</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="convertido">Convertido</option>
            <option value="perdido">Perdido</option>
          </select>

          <select
            value={filterOrigem}
            onChange={(e) => setFilterOrigem(e.target.value as LeadOrigem | '')}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Todas as origens</option>
            <option value="site_contato">Site - Contato</option>
            <option value="imovel">Página do Imóvel</option>
            <option value="avaliacao">Avaliação</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="vender">Quero Vender</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {['Nome', 'Telefone', 'E-mail', 'Origem', 'Imóvel', 'Corretor', 'Status', 'Data', 'Ações'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
            {filtered.map((lead) => {
              const sCfg = statusConfig[lead.status]
              const oCfg = origemConfig[lead.origem]
              const isExpanded = expandedId === lead.id

              return (
                <tbody key={lead.id}>
                  <tr
                    className="cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {lead.nome}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {lead.telefone}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${oCfg.bg} ${oCfg.color}`}>
                        {oCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.imovelTitulo ? (
                        <a
                          href={`/painel/imoveis/${lead.imovelId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {lead.imovelTitulo}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {lead.corretorNome}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sCfg.bg} ${sCfg.color}`}>
                        {sCfg.icon}
                        {sCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(lead.data)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Status dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setStatusDropdownId(statusDropdownId === lead.id ? null : lead.id)
                            }}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            title="Alterar status"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          {statusDropdownId === lead.id && (
                            <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
                              {(Object.keys(statusConfig) as LeadStatus[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusChange(lead.id, s)
                                  }}
                                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                    lead.status === s ? 'font-semibold' : ''
                                  } ${statusConfig[s].color}`}
                                >
                                  {statusConfig[s].icon}
                                  {statusConfig[s].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Note button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedId(isExpanded ? null : lead.id)
                          }}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          title="Notas e detalhes"
                        >
                          <StickyNote className="h-4 w-4" />
                        </button>

                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/55${formatPhone(lead.telefone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>

                        {/* Expand toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedId(isExpanded ? null : lead.id)
                          }}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          title={isExpanded ? 'Recolher' : 'Expandir'}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="bg-gray-50/50 px-4 py-5 dark:bg-gray-900/30">
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Left: Info */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Detalhes do Lead
                            </h3>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4" />
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
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${lead.email}`} className="hover:underline">
                                  {lead.email}
                                </a>
                              </div>
                            </div>

                            {lead.mensagem && (
                              <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Mensagem
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {lead.mensagem}
                                </p>
                              </div>
                            )}

                            {lead.imovelTitulo && (
                              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800 dark:bg-cyan-900/20">
                                <p className="mb-1 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                                  Imóvel de Interesse
                                </p>
                                <a
                                  href={`/painel/imoveis/${lead.imovelId}`}
                                  className="text-sm font-medium text-cyan-700 hover:underline dark:text-cyan-300"
                                >
                                  {lead.imovelTitulo}
                                </a>
                              </div>
                            )}

                            {/* Status change buttons */}
                            <div>
                              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                Alterar Status
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(Object.keys(statusConfig) as LeadStatus[]).map((s) => {
                                  const cfg = statusConfig[s]
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(lead.id, s)}
                                      disabled={lead.status === s}
                                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        lead.status === s
                                          ? `${cfg.bg} ${cfg.color} ring-2 ring-current/20 opacity-60 cursor-not-allowed`
                                          : `${cfg.bg} ${cfg.color} hover:opacity-80`
                                      }`}
                                    >
                                      {cfg.icon}
                                      {cfg.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Right: Notes */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Observações
                            </h3>

                            {lead.notas.length === 0 && (
                              <p className="text-xs text-gray-400">
                                Nenhuma observação registrada.
                              </p>
                            )}

                            <div className="max-h-40 space-y-2 overflow-y-auto">
                              {lead.notas.map((nota) => (
                                <div
                                  key={nota.id}
                                  className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                                >
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {nota.text}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-400">
                                    {nota.author} - {formatDate(nota.date)}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <textarea
                                value={noteText[lead.id] ?? ''}
                                onChange={(e) =>
                                  setNoteText((prev) => ({ ...prev, [lead.id]: e.target.value }))
                                }
                                placeholder="Adicionar observação..."
                                rows={2}
                                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                              />
                              <button
                                onClick={() => handleAddNote(lead.id)}
                                disabled={!noteText[lead.id]?.trim()}
                                className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Click-away handler for status dropdown */}
      {statusDropdownId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setStatusDropdownId(null)}
        />
      )}
    </div>
  )
}
