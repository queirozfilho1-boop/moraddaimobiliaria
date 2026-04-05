import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  Monitor,
  Award,
  Users,
  Building2,
  TrendingUp,
  Key,
  BarChart3,
  Lock,
  CheckCircle,
  Clock,
  Trophy,
  Star,
  ChevronDown,
  ChevronRight,
  Play,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Target,
  Handshake,
  Scale,
  Megaphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Modulo {
  id: string
  trilha_id: string
  titulo: string
  descricao: string | null
  ordem: number
  duracao_minutos: number | null
  pontos_conclusao: number | null
  nota_minima: number | null
}

interface Trilha {
  id: string
  titulo: string
  descricao: string | null
  icone: string | null
  ordem: number
  modulos: Modulo[]
}

interface ProgressoModulo {
  corretor_id: string
  modulo_id: string
  percentual: number
  nota_media: number | null
  concluido: boolean
  concluido_em: string | null
}

interface CorretorProgresso {
  id: string
  nome: string
  email: string
  avatar_url: string | null
  progresso: ProgressoModulo[]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="h-5 w-5" />,
  Monitor: <Monitor className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Key: <Key className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Handshake: <Handshake className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
  Megaphone: <Megaphone className="h-5 w-5" />,
}

function getIcon(name: string | null) {
  if (!name) return <BookOpen className="h-5 w-5" />
  return ICON_MAP[name] ?? <BookOpen className="h-5 w-5" />
}

function getLevelInfo(pct: number) {
  if (pct >= 75) return { label: 'Especialista', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40' }
  if (pct >= 50) return { label: 'Avançado', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' }
  if (pct >= 25) return { label: 'Intermediário', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' }
  return { label: 'Iniciante', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' }
}

function getModuleStatus(
  modulo: Modulo,
  progresso: Map<string, ProgressoModulo>,
  trilhaModulos: Modulo[],
): 'completed' | 'in_progress' | 'available' | 'locked' {
  const prog = progresso.get(modulo.id)
  if (prog?.concluido) return 'completed'
  if (prog && prog.percentual > 0) return 'in_progress'
  // First module is always available
  if (modulo.ordem === 1) return 'available'
  // Available if previous module is completed
  const sorted = [...trilhaModulos].sort((a, b) => a.ordem - b.ordem)
  const idx = sorted.findIndex((m) => m.id === modulo.id)
  if (idx > 0) {
    const prev = progresso.get(sorted[idx - 1].id)
    if (prev?.concluido) return 'available'
  }
  return 'locked'
}

function formatDuration(min: number | null) {
  if (!min) return '—'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Nunca'
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'ontem'
  return `${diffD}d atrás`
}

/* ------------------------------------------------------------------ */
/*  Circular Progress Component                                        */
/* ------------------------------------------------------------------ */

function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value >= 75 ? '#10b981' : value >= 50 ? '#3b82f6' : value >= 25 ? '#f59e0b' : '#6b7280'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor"
          strokeWidth={stroke} className="text-gray-200 dark:text-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <span className="absolute text-2xl font-bold text-gray-800 dark:text-gray-100">
        {Math.round(value)}%
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusIcon({ status }: { status: 'completed' | 'in_progress' | 'available' | 'locked' }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    case 'in_progress':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30">
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
        </div>
      )
    case 'available':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/30">
          <Play className="h-2.5 w-2.5 text-blue-500" />
        </div>
      )
    case 'locked':
      return <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AprendizadoPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'gestor'

  const [view, setView] = useState<'corretor' | 'admin'>('corretor')
  const [trilhas, setTrilhas] = useState<Trilha[]>([])
  const [progresso, setProgresso] = useState<ProgressoModulo[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTrilha, setExpandedTrilha] = useState<string | null>(null)

  // Admin state
  const [corretores, setCorretores] = useState<CorretorProgresso[]>([])
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [selectedCorretor, setSelectedCorretor] = useState<string | null>(null)

  /* ---------- Fetch trilhas + personal progress ---------- */
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: trilhasData, error: tErr } = await supabase
          .from('trilhas')
          .select('*, modulos(*)')
          .eq('ativo', true)
          .order('ordem')

        if (tErr) throw tErr
        setTrilhas((trilhasData as Trilha[]) ?? [])

        if (profile?.id) {
          const { data: progData, error: pErr } = await supabase
            .from('progresso_modulo')
            .select('*')
            .eq('corretor_id', profile.id)

          if (pErr) throw pErr
          setProgresso((progData as ProgressoModulo[]) ?? [])
        }
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar dados de aprendizado')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.id])

  /* ---------- Fetch admin data ---------- */
  useEffect(() => {
    if (view !== 'admin' || !isAdmin) return
    async function loadAdmin() {
      setLoadingAdmin(true)
      try {
        const { data: profiles, error: profErr } = await supabase
          .from('users_profiles')
          .select('id, nome, email, avatar_url')
          .eq('role', 'corretor')
          .eq('ativo', true)

        if (profErr) throw profErr

        const { data: allProgress, error: progErr } = await supabase
          .from('progresso_modulo')
          .select('*')

        if (progErr) throw progErr

        const progressMap = new Map<string, ProgressoModulo[]>()
        for (const p of (allProgress ?? []) as ProgressoModulo[]) {
          const arr = progressMap.get(p.corretor_id) ?? []
          arr.push(p)
          progressMap.set(p.corretor_id, arr)
        }

        const result: CorretorProgresso[] = (profiles ?? []).map((p: any) => ({
          id: p.id,
          nome: p.nome,
          email: p.email,
          avatar_url: p.avatar_url,
          progresso: progressMap.get(p.id) ?? [],
        }))

        setCorretores(result)
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar dados administrativos')
      } finally {
        setLoadingAdmin(false)
      }
    }
    loadAdmin()
  }, [view, isAdmin])

  /* ---------- Derived data ---------- */
  const progressoMap = useMemo(() => {
    const m = new Map<string, ProgressoModulo>()
    for (const p of progresso) m.set(p.modulo_id, p)
    return m
  }, [progresso])

  const totalModulos = useMemo(() => trilhas.reduce((s, t) => s + t.modulos.length, 0), [trilhas])

  const modulosConcluidos = useMemo(
    () => progresso.filter((p) => p.concluido).length,
    [progresso],
  )

  const overallPct = totalModulos > 0 ? (modulosConcluidos / totalModulos) * 100 : 0

  const pontuacaoTotal = useMemo(
    () => progresso.reduce((s, p) => s + (p.nota_media ?? 0) * (p.percentual / 100), 0),
    [progresso],
  )

  const tempoEstudo = useMemo(() => {
    const totalMin = trilhas
      .flatMap((t) => t.modulos)
      .filter((m) => progressoMap.get(m.id)?.concluido)
      .reduce((s, m) => s + (m.duracao_minutos ?? 0), 0)
    return formatDuration(totalMin)
  }, [trilhas, progressoMap])

  const level = getLevelInfo(overallPct)

  /* ---------- Admin stats ---------- */
  const adminStats = useMemo(() => {
    if (!corretores.length || !totalModulos) return null
    const emTreinamento = corretores.filter((c) => c.progresso.length > 0).length
    const mediaProgresso =
      corretores.length > 0
        ? corretores.reduce((s, c) => {
            const concl = c.progresso.filter((p) => p.concluido).length
            return s + (totalModulos > 0 ? (concl / totalModulos) * 100 : 0)
          }, 0) / corretores.length
        : 0

    const moduloCount = new Map<string, number>()
    for (const c of corretores) {
      for (const p of c.progresso) {
        if (p.concluido) moduloCount.set(p.modulo_id, (moduloCount.get(p.modulo_id) ?? 0) + 1)
      }
    }
    let topModulo = '—'
    let topCount = 0
    for (const [mId, cnt] of moduloCount) {
      if (cnt > topCount) {
        topCount = cnt
        const mod = trilhas.flatMap((t) => t.modulos).find((m) => m.id === mId)
        topModulo = mod?.titulo ?? mId
        topCount = cnt
      }
    }

    const semAcesso = corretores.filter((c) => c.progresso.length === 0).length

    return { emTreinamento, mediaProgresso, topModulo, topCount, semAcesso }
  }, [corretores, totalModulos, trilhas])

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
            <GraduationCap className="h-7 w-7 text-primary-600" />
            Aprendizado
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Formação completa para corretores
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setView(view === 'corretor' ? 'admin' : 'corretor')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {view === 'corretor' ? (
              <>
                <BarChart3 className="h-4 w-4" />
                Painel Administrativo
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Minha Trilha
              </>
            )}
          </button>
        )}
      </div>

      {view === 'corretor' ? (
        /* ============================================================ */
        /*  CORRETOR VIEW                                                */
        /* ============================================================ */
        <div className="space-y-6">
          {/* Overall Progress Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <CircularProgress value={overallPct} />
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {modulosConcluidos}/{totalModulos}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Módulos Concluídos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {Math.round(pontuacaoTotal)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pontuação Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {tempoEstudo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tempo de Estudo</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${level.bg} ${level.color}`}>
                      <Trophy className="h-4 w-4" />
                      {level.label}
                    </span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Nível</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trilhas List */}
          <div className="space-y-4">
            {trilhas.map((trilha) => {
              const mods = [...trilha.modulos].sort((a, b) => a.ordem - b.ordem)
              const concl = mods.filter((m) => progressoMap.get(m.id)?.concluido).length
              const trilhaPct = mods.length > 0 ? (concl / mods.length) * 100 : 0
              const isExpanded = expandedTrilha === trilha.id

              return (
                <div key={trilha.id} className="rounded-xl bg-white shadow-sm dark:bg-gray-800">
                  {/* Trilha Header */}
                  <button
                    onClick={() => setExpandedTrilha(isExpanded ? null : trilha.id)}
                    className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                      {getIcon(trilha.icone)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-gray-800 dark:text-gray-100">
                          {trilha.titulo}
                        </h3>
                        {trilhaPct === 100 && (
                          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                      </div>
                      {trilha.descricao && (
                        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                          {trilha.descricao}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-primary-500 transition-all duration-500"
                            style={{ width: `${trilhaPct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                          {concl}/{mods.length} módulos
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-gray-400">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </button>

                  {/* Expanded Modules */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {mods.map((modulo) => {
                        const status = getModuleStatus(modulo, progressoMap, mods)
                        const prog = progressoMap.get(modulo.id)
                        const modPct = prog?.percentual ?? 0

                        return (
                          <div
                            key={modulo.id}
                            className={`flex items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-b-0 dark:border-gray-700/50 ${
                              status === 'locked' ? 'opacity-50' : ''
                            }`}
                          >
                            <StatusIcon status={status} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {modulo.titulo}
                              </p>
                              {modulo.descricao && (
                                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                  {modulo.descricao}
                                </p>
                              )}
                              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                                {modulo.duracao_minutos && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(modulo.duracao_minutos)}
                                  </span>
                                )}
                                {modulo.pontos_conclusao && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    {modulo.pontos_conclusao} pts
                                  </span>
                                )}
                                {status === 'in_progress' && (
                                  <span className="text-yellow-500">{Math.round(modPct)}% concluído</span>
                                )}
                              </div>
                            </div>
                            {status !== 'locked' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate('/painel/aprendizado/modulo/' + modulo.id)
                                }}
                                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-primary-700"
                              >
                                {status === 'completed' ? (
                                  <>Revisar <ArrowRight className="h-3 w-3" /></>
                                ) : status === 'in_progress' ? (
                                  <>Continuar <ArrowRight className="h-3 w-3" /></>
                                ) : (
                                  <>Iniciar <Play className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {trilhas.length === 0 && (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-gray-800">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma trilha de aprendizado disponível no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /*  ADMIN VIEW                                                   */
        /* ============================================================ */
        <div className="space-y-6">
          {loadingAdmin ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              {adminStats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {adminStats.emTreinamento}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Em treinamento</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {Math.round(adminStats.mediaProgresso)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Progresso médio</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100" title={adminStats.topModulo}>
                          {adminStats.topModulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Módulo mais concluído ({adminStats.topCount}x)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {adminStats.semAcesso}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sem acesso</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Corretores Progress Table */}
              <div className="rounded-xl bg-white shadow-sm dark:bg-gray-800">
                <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Progresso dos Corretores
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Corretor</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Progresso</th>
                        <th className="hidden px-6 py-3 font-medium text-gray-500 dark:text-gray-400 sm:table-cell">Módulos</th>
                        <th className="hidden px-6 py-3 font-medium text-gray-500 dark:text-gray-400 md:table-cell">Última Atividade</th>
                        <th className="hidden px-6 py-3 font-medium text-gray-500 dark:text-gray-400 lg:table-cell">Nível</th>
                        <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corretores.map((corretor) => {
                        const concl = corretor.progresso.filter((p) => p.concluido).length
                        const pct = totalModulos > 0 ? (concl / totalModulos) * 100 : 0
                        const lvl = getLevelInfo(pct)
                        const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                        const lastActivity = corretor.progresso
                          .map((p) => p.concluido_em)
                          .filter(Boolean)
                          .sort()
                          .pop()
                        const isSelected = selectedCorretor === corretor.id

                        return (
                          <tr
                            key={corretor.id}
                            onClick={() => setSelectedCorretor(isSelected ? null : corretor.id)}
                            className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/30"
                          >
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                                  {corretor.nome.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-gray-100">{corretor.nome}</p>
                                  <p className="text-xs text-gray-400">{corretor.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  {Math.round(pct)}%
                                </span>
                              </div>
                            </td>
                            <td className="hidden px-6 py-3 text-gray-600 dark:text-gray-300 sm:table-cell">
                              {concl}/{totalModulos}
                            </td>
                            <td className="hidden px-6 py-3 text-gray-500 dark:text-gray-400 md:table-cell">
                              {timeAgo(lastActivity ?? null)}
                            </td>
                            <td className="hidden px-6 py-3 lg:table-cell">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${lvl.bg} ${lvl.color}`}>
                                {lvl.label}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCorretor(isSelected ? null : corretor.id)
                                }}
                                className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                              >
                                {isSelected ? 'Fechar' : 'Detalhes'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {corretores.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                            Nenhum corretor encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Corretor Detail Expansion */}
                {selectedCorretor && (() => {
                  const corretor = corretores.find((c) => c.id === selectedCorretor)
                  if (!corretor) return null
                  const progMap = new Map<string, ProgressoModulo>()
                  for (const p of corretor.progresso) progMap.set(p.modulo_id, p)

                  return (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
                      <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Detalhes — {corretor.nome}
                      </h3>
                      <div className="space-y-3">
                        {trilhas.map((trilha) => {
                          const mods = [...trilha.modulos].sort((a, b) => a.ordem - b.ordem)
                          const concl = mods.filter((m) => progMap.get(m.id)?.concluido).length
                          const pct = mods.length > 0 ? (concl / mods.length) * 100 : 0

                          return (
                            <div key={trilha.id} className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                                {getIcon(trilha.icone)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {trilha.titulo}
                                  </p>
                                  <span className="ml-2 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                    {concl}/{mods.length}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                  <div
                                    className="h-full rounded-full bg-primary-500 transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
