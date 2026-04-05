import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  Users,
  UserPlus,
  Plus,
  Eye,
  Calculator,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalImoveis: number
  imoveisPublicados: number
  leadsMes: number
  leadsNovos: number
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalImoveis: 0,
    imoveisPublicados: 0,
    leadsMes: 0,
    leadsNovos: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const isSuperadmin = profile?.role === 'superadmin'

        // Total imoveis
        let query = supabase
          .from('imoveis')
          .select('*', { count: 'exact', head: true })
        if (!isSuperadmin && profile?.id) {
          query = query.eq('corretor_id', profile.id)
        }
        const { count: totalImoveis } = await query

        // Imoveis publicados
        let pubQuery = supabase
          .from('imoveis')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'publicado')
        if (!isSuperadmin && profile?.id) {
          pubQuery = pubQuery.eq('corretor_id', profile.id)
        }
        const { count: imoveisPublicados } = await pubQuery

        // Leads do mes
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        let leadsQuery = supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
        if (!isSuperadmin && profile?.id) {
          leadsQuery = leadsQuery.eq('corretor_id', profile.id)
        }
        const { count: leadsMes } = await leadsQuery

        // Leads novos (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        let newLeadsQuery = supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString())
        if (!isSuperadmin && profile?.id) {
          newLeadsQuery = newLeadsQuery.eq('corretor_id', profile.id)
        }
        const { count: leadsNovos } = await newLeadsQuery

        setStats({
          totalImoveis: totalImoveis ?? 0,
          imoveisPublicados: imoveisPublicados ?? 0,
          leadsMes: leadsMes ?? 0,
          leadsNovos: leadsNovos ?? 0,
        })
      } catch {
        // Stats will stay at defaults
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [profile])

  const statCards = [
    {
      label: 'Total Imoveis',
      value: stats.totalImoveis,
      icon: <Building2 size={24} />,
      color: 'bg-moradda-blue-500',
    },
    {
      label: 'Imoveis Publicados',
      value: stats.imoveisPublicados,
      icon: <CheckCircle2 size={24} />,
      color: 'bg-green-500',
    },
    {
      label: 'Leads do Mes',
      value: stats.leadsMes,
      icon: <Users size={24} />,
      color: 'bg-moradda-gold-400',
    },
    {
      label: 'Leads Novos',
      value: stats.leadsNovos,
      icon: <UserPlus size={24} />,
      color: 'bg-purple-500',
    },
  ]

  const quickActions = [
    { label: 'Novo Imovel', path: '/painel/imoveis/novo', icon: <Plus size={18} /> },
    { label: 'Ver Leads', path: '/painel/leads', icon: <Eye size={18} /> },
    { label: 'Precificacao', path: '/painel/precificacao', icon: <Calculator size={18} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Bem-vindo, {profile?.nome?.split(' ')[0] || 'Usuario'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Aqui esta o resumo do seu painel.
        </p>
      </div>

      {/* Stat cards */}
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

      {/* Quick actions */}
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

      {/* Recent activity placeholder */}
      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
          Atividade Recente
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600" />
              <div className="flex-1">
                <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-600" />
                <div className="mt-1.5 h-2.5 w-24 rounded bg-gray-100 dark:bg-gray-600/50" />
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-gray-400">
            As atividades reais serao exibidas aqui em breve.
          </p>
        </div>
      </div>
    </div>
  )
}
