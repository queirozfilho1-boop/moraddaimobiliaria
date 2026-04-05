import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  UserPlus,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
  Clock,
  FileWarning,
  UserX,
  Plus,
  Eye,
  Calculator,
  Activity,
  ArrowRight,
  RefreshCw,
  Users,
  CheckCircle,
  PhoneCall,
  MessageSquare,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Stats {
  imoveisAtivos: number
  leadsNovos: number
  followupsPendentes: number
  taxaConversao: number
}

interface Alerta {
  label: string
  count: number
  icon: React.ReactNode
  color: string
  link: string
}

interface AtividadeRecente {
  id: string
  created_at: string
  usuario_nome: string | null
  descricao: string
  tipo: string
}

interface ImovelRevisao {
  id: string
  titulo: string
  created_at: string
}

interface LeadsPorCorretor {
  corretor_nome: string
  total: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atras`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atras`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'ontem'
  return `${diffD}d atras`
}

function iconForTipo(tipo: string) {
  switch (tipo) {
    case 'status_change':
      return <RefreshCw size={16} />
    case 'followup':
      return <CalendarClock size={16} />
    case 'ligacao':
      return <PhoneCall size={16} />
    case 'mensagem':
      return <MessageSquare size={16} />
    case 'proposta':
      return <FileText size={16} />
    default:
      return <Activity size={16} />
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    imoveisAtivos: 0,
    leadsNovos: 0,
    followupsPendentes: 0,
    taxaConversao: 0,
  })
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([])
  const [imoveisRevisao, setImoveisRevisao] = useState<ImovelRevisao[]>([])
  const [leadsPorCorretor, setLeadsPorCorretor] = useState<LeadsPorCorretor[]>([])
  const [loading, setLoading] = useState(true)

  const isSuperadminOrGestor =
    profile?.role === 'superadmin' || (profile?.role as string) === 'gestor'
  const isSuperadmin = profile?.role === 'superadmin'

  useEffect(() => {
    if (!profile) return
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadDashboard() {
    try {
      await Promise.all([
        loadStats(),
        loadAlertas(),
        loadAtividades(),
        ...(isSuperadminOrGestor ? [loadImoveisRevisao(), loadLeadsPorCorretor()] : []),
      ])
    } catch {
      // stats stay at defaults
    } finally {
      setLoading(false)
    }
  }

  /* ---------- Stats ---------- */

  async function loadStats() {
    // Imoveis ativos (publicado)
    let imoveisQ = supabase
      .from('imoveis')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'publicado')
    if (!isSuperadmin && profile?.id) {
      imoveisQ = imoveisQ.eq('corretor_id', profile.id)
    }
    const { count: imoveisAtivos } = await imoveisQ

    // Leads novos (last 7 days, status=novo)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    let leadsNovosQ = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'novo')
      .gte('created_at', sevenDaysAgo.toISOString())
    if (!isSuperadmin && profile?.id) {
      leadsNovosQ = leadsNovosQ.eq('corretor_id', profile.id)
    }
    const { count: leadsNovos } = await leadsNovosQ

    // Follow-ups pendentes
    let followupsQ = supabase
      .from('followups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
    if (!isSuperadmin && profile?.id) {
      followupsQ = followupsQ.eq('corretor_id', profile.id)
    }
    const { count: followupsPendentes } = await followupsQ

    // Taxa de conversao (this month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let totalLeadsQ = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())
    if (!isSuperadmin && profile?.id) {
      totalLeadsQ = totalLeadsQ.eq('corretor_id', profile.id)
    }
    const { count: totalLeadsMes } = await totalLeadsQ

    let convertidosQ = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'convertido')
      .gte('created_at', startOfMonth.toISOString())
    if (!isSuperadmin && profile?.id) {
      convertidosQ = convertidosQ.eq('corretor_id', profile.id)
    }
    const { count: convertidos } = await convertidosQ

    const taxa =
      (totalLeadsMes ?? 0) > 0
        ? Math.round(((convertidos ?? 0) / (totalLeadsMes ?? 1)) * 100)
        : 0

    setStats({
      imoveisAtivos: imoveisAtivos ?? 0,
      leadsNovos: leadsNovos ?? 0,
      followupsPendentes: followupsPendentes ?? 0,
      taxaConversao: taxa,
    })
  }

  /* ---------- Alertas ---------- */

  async function loadAlertas() {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    // Leads sem atendimento > 1h
    let semAtendQ = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'novo')
      .lt('created_at', oneHourAgo.toISOString())
    if (!isSuperadmin && profile?.id) {
      semAtendQ = semAtendQ.eq('corretor_id', profile.id)
    }
    const { count: semAtendimento } = await semAtendQ

    // Follow-ups vencidos
    const now = new Date().toISOString()
    let vencidosQ = supabase
      .from('followups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .lt('data_agendada', now)
    if (!isSuperadmin && profile?.id) {
      vencidosQ = vencidosQ.eq('corretor_id', profile.id)
    }
    const { count: followupsVencidos } = await vencidosQ

    // Imoveis aguardando revisao
    const { count: aguardandoRevisao } = await supabase
      .from('imoveis')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'enviado_revisao')

    // Leads sem proxima acao
    const statusesSemAcao = ['em_atendimento', 'qualificado', 'em_triagem']
    let semAcaoQ = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', statusesSemAcao)
      .is('proxima_acao', null)
    if (!isSuperadmin && profile?.id) {
      semAcaoQ = semAcaoQ.eq('corretor_id', profile.id)
    }
    const { count: semProximaAcao } = await semAcaoQ

    const newAlertas: Alerta[] = []

    if ((semAtendimento ?? 0) > 0) {
      newAlertas.push({
        label: 'Leads sem atendimento ha mais de 1h',
        count: semAtendimento ?? 0,
        icon: <Clock size={18} />,
        color: 'text-red-500',
        link: '/painel/leads?status=novo',
      })
    }
    if ((followupsVencidos ?? 0) > 0) {
      newAlertas.push({
        label: 'Follow-ups vencidos',
        count: followupsVencidos ?? 0,
        icon: <AlertTriangle size={18} />,
        color: 'text-red-500',
        link: '/painel/leads?tab=followups',
      })
    }
    if ((aguardandoRevisao ?? 0) > 0) {
      newAlertas.push({
        label: 'Imoveis aguardando revisao',
        count: aguardandoRevisao ?? 0,
        icon: <FileWarning size={18} />,
        color: 'text-yellow-500',
        link: '/painel/imoveis?status=enviado_revisao',
      })
    }
    if ((semProximaAcao ?? 0) > 0) {
      newAlertas.push({
        label: 'Leads sem proxima acao definida',
        count: semProximaAcao ?? 0,
        icon: <UserX size={18} />,
        color: 'text-yellow-500',
        link: '/painel/leads?sem_acao=true',
      })
    }

    setAlertas(newAlertas)
  }

  /* ---------- Atividade Recente ---------- */

  async function loadAtividades() {
    const { data } = await supabase
      .from('leads_historico')
      .select('id, created_at, usuario_nome, descricao, tipo')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setAtividades(data as AtividadeRecente[])
    }
  }

  /* ---------- Superadmin/Gestor sections ---------- */

  async function loadImoveisRevisao() {
    const { data } = await supabase
      .from('imoveis')
      .select('id, titulo, created_at')
      .eq('status', 'enviado_revisao')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setImoveisRevisao(data as ImovelRevisao[])
    }
  }

  async function loadLeadsPorCorretor() {
    const { data } = await supabase
      .from('leads')
      .select('corretor_id, users_profiles!leads_corretor_id_fkey(nome)')
      .not('status', 'in', '("convertido","perdido","sem_resposta")')

    if (data) {
      const contagem: Record<string, { nome: string; total: number }> = {}
      for (const lead of data as any[]) {
        const cId = lead.corretor_id
        if (!cId) continue
        const nome = lead.users_profiles?.nome || 'Sem nome'
        if (!contagem[cId]) {
          contagem[cId] = { nome, total: 0 }
        }
        contagem[cId].total++
      }
      setLeadsPorCorretor(
        Object.values(contagem).sort((a, b) => b.total - a.total),
      )
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Stat cards config                                                  */
  /* ------------------------------------------------------------------ */

  const statCards = [
    {
      label: 'Imoveis Ativos',
      value: stats.imoveisAtivos,
      icon: <Building2 size={24} />,
      color: 'bg-moradda-blue-500',
    },
    {
      label: 'Leads Novos (7d)',
      value: stats.leadsNovos,
      icon: <UserPlus size={24} />,
      color: 'bg-purple-500',
    },
    {
      label: 'Follow-ups Pendentes',
      value: stats.followupsPendentes,
      icon: <CalendarClock size={24} />,
      color: 'bg-moradda-gold-400',
    },
    {
      label: 'Taxa de Conversao',
      value: `${stats.taxaConversao}%`,
      icon: <TrendingUp size={24} />,
      color: 'bg-green-500',
    },
  ]

  const quickActions = [
    { label: 'Novo Imovel', path: '/painel/imoveis/novo', icon: <Plus size={18} /> },
    { label: 'Ver Leads', path: '/painel/leads', icon: <Eye size={18} /> },
    { label: 'Precificacao', path: '/painel/precificacao', icon: <Calculator size={18} /> },
  ]

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Bem-vindo, {profile?.nome?.split(' ')[0] || 'Usuario'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Aqui esta o resumo do seu CRM imobiliario.
        </p>
      </div>

      {/* -------- Quick Stats Row -------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-white ${card.color}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* -------- Alertas Urgentes -------- */}
      {!loading && alertas.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-800/40 dark:bg-red-900/20">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-400">
            <AlertTriangle size={20} />
            Alertas Urgentes
          </h3>
          <div className="space-y-2">
            {alertas.map((alerta, i) => (
              <Link
                key={i}
                to={alerta.link}
                className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-3 transition hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className={alerta.color}>{alerta.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {alerta.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-700 dark:bg-red-800/40 dark:text-red-300">
                    {alerta.count}
                  </span>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* -------- Quick Actions -------- */}
      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
          Acoes Rapidas
        </h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-moradda-blue-600"
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* -------- Atividade Recente -------- */}
      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
          Atividade Recente
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
              >
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-600" />
                <div className="flex-1">
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
                  <div className="mt-1.5 h-2.5 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-600/50" />
                </div>
              </div>
            ))}
          </div>
        ) : atividades.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">
            Nenhuma atividade recente encontrada.
          </p>
        ) : (
          <div className="space-y-2">
            {atividades.map((at) => (
              <div
                key={at.id}
                className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moradda-blue-100 text-moradda-blue-600 dark:bg-moradda-blue-900/40 dark:text-moradda-blue-400">
                  {iconForTipo(at.tipo)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{at.usuario_nome || 'Sistema'}</span>
                    {' — '}
                    {at.descricao}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {timeAgo(at.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -------- Superadmin / Gestor Only -------- */}
      {isSuperadminOrGestor && !loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Imoveis Pendentes de Revisao */}
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
              <FileWarning size={20} className="text-yellow-500" />
              Imoveis Pendentes de Revisao
              {imoveisRevisao.length > 0 && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-800/40 dark:text-yellow-300">
                  {imoveisRevisao.length}
                </span>
              )}
            </h3>
            {imoveisRevisao.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                <CheckCircle size={16} className="mb-0.5 mr-1 inline" />
                Nenhum imovel aguardando revisao.
              </p>
            ) : (
              <div className="space-y-2">
                {imoveisRevisao.map((im) => (
                  <Link
                    key={im.id}
                    to={`/painel/imoveis/${im.id}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 transition hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                  >
                    <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                      {im.titulo}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {timeAgo(im.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Leads por Corretor */}
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
              <Users size={20} className="text-moradda-blue-500" />
              Leads por Corretor
            </h3>
            {leadsPorCorretor.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Nenhum lead ativo no momento.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">
                        Corretor
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-600 dark:text-gray-400">
                        Leads Ativos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {leadsPorCorretor.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                          {c.corretor_nome}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-gray-200">
                          {c.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
