import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Send,
  Star,
  Trophy,
  Briefcase,
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
  duracao_minutos: number | null
  pontos_conclusao: number | null
  nota_minima: number | null
}

interface Questao {
  id: string
  aula_id: string
  tipo: 'multipla_escolha' | 'verdadeiro_falso'
  enunciado: string
  opcoes: string[] | null
  resposta_correta: number | boolean
  explicacao: string | null
  pontos: number
  ordem: number
}

interface Aula {
  id: string
  modulo_id: string
  titulo: string
  tipo: 'conteudo' | 'exercicio' | 'avaliacao' | 'checklist' | 'caso_pratico'
  conteudo: string | null
  ordem: number
  pontos: number
  questoes: Questao[]
}

interface ProgressoCorretor {
  corretor_id: string
  aula_id: string
  concluida: boolean
  pontuacao: number | null
  tentativas: number
  melhor_nota: number | null
  tempo_gasto_segundos: number | null
  respostas: Record<string, unknown> | null
  concluida_em: string | null
}

/* ------------------------------------------------------------------ */
/*  Markdown-like parser                                               */
/* ------------------------------------------------------------------ */

function parseMarkdown(text: string): string {
  if (!text) return ''

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const lines = text.split('\n')
  let html = ''
  let inList = false
  let inBlockquote = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Close blockquote if line doesn't start with >
    if (inBlockquote && !line.startsWith('>')) {
      html += '</blockquote>'
      inBlockquote = false
    }

    // Close list if line doesn't start with -
    if (inList && !line.trim().startsWith('- ') && !line.trim().startsWith('* ')) {
      html += '</ul>'
      inList = false
    }

    // Blank line = paragraph break
    if (line.trim() === '') {
      if (inList) { html += '</ul>'; inList = false }
      if (inBlockquote) { html += '</blockquote>'; inBlockquote = false }
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      const content = escapeHtml(line.slice(4))
      html += `<h3 class="text-lg font-semibold mt-6 mb-2 text-gray-900 dark:text-white">${applyInline(content)}</h3>`
      continue
    }
    if (line.startsWith('## ')) {
      const content = escapeHtml(line.slice(3))
      html += `<h2 class="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-white">${applyInline(content)}</h2>`
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const content = escapeHtml(line.slice(2))
      if (!inBlockquote) {
        html += '<blockquote class="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 pl-4 py-3 my-4 text-gray-700 dark:text-gray-300 rounded-r-lg">'
        inBlockquote = true
      }
      html += `<p>${applyInline(content)}</p>`
      continue
    }

    // Unordered list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = escapeHtml(line.trim().slice(2))
      if (!inList) {
        html += '<ul class="list-disc list-inside space-y-1.5 my-3 text-gray-700 dark:text-gray-300">'
        inList = true
      }
      html += `<li>${applyInline(content)}</li>`
      continue
    }

    // Regular paragraph
    html += `<p class="my-2 text-gray-700 dark:text-gray-300 leading-relaxed">${applyInline(escapeHtml(line))}</p>`
  }

  if (inList) html += '</ul>'
  if (inBlockquote) html += '</blockquote>'

  return html
}

function applyInline(text: string): string {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Inline code
  text = text.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
  return text
}

/* ------------------------------------------------------------------ */
/*  Aula type icons                                                    */
/* ------------------------------------------------------------------ */

function getAulaIcon(tipo: Aula['tipo']) {
  switch (tipo) {
    case 'conteudo':
      return <BookOpen className="h-4 w-4" />
    case 'exercicio':
      return <Play className="h-4 w-4" />
    case 'avaliacao':
      return <Star className="h-4 w-4" />
    case 'checklist':
      return <ClipboardCheck className="h-4 w-4" />
    case 'caso_pratico':
      return <Briefcase className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

function getAulaTipoLabel(tipo: Aula['tipo']) {
  switch (tipo) {
    case 'conteudo': return 'Conteudo'
    case 'exercicio': return 'Exercicio'
    case 'avaliacao': return 'Avaliacao'
    case 'checklist': return 'Checklist'
    case 'caso_pratico': return 'Caso Pratico'
    default: return tipo
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ModuloAulaPage() {
  const { moduloId } = useParams<{ moduloId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [progresso, setProgresso] = useState<Map<string, ProgressoCorretor>>(new Map())
  const [currentAulaId, setCurrentAulaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Avaliacao state
  const [respostas, setRespostas] = useState<Map<string, number | boolean>>(new Map())
  const [submitted, setSubmitted] = useState(false)
  const [aulaScore, setAulaScore] = useState<number | null>(null)
  const [questionResults, setQuestionResults] = useState<Map<string, boolean>>(new Map())

  const currentAula = useMemo(
    () => aulas.find((a) => a.id === currentAulaId) ?? null,
    [aulas, currentAulaId],
  )

  const aulasConcluidasCount = useMemo(
    () => aulas.filter((a) => progresso.get(a.id)?.concluida).length,
    [aulas, progresso],
  )

  const progressPercent = useMemo(
    () => (aulas.length > 0 ? Math.round((aulasConcluidasCount / aulas.length) * 100) : 0),
    [aulasConcluidasCount, aulas.length],
  )

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    if (!moduloId || !profile) return
    setLoading(true)

    try {
      const [moduloRes, aulasRes] = await Promise.all([
        supabase.from('modulos').select('*').eq('id', moduloId).single(),
        supabase
          .from('aulas')
          .select('*, questoes(*)')
          .eq('modulo_id', moduloId)
          .order('ordem'),
      ])

      if (moduloRes.error) throw moduloRes.error
      if (aulasRes.error) throw aulasRes.error

      const mod = moduloRes.data as Modulo
      const aulasList = (aulasRes.data as Aula[]).map((a) => ({
        ...a,
        questoes: (a.questoes ?? []).sort((x, y) => x.ordem - y.ordem),
      }))

      setModulo(mod)
      setAulas(aulasList)

      // Fetch progress
      if (aulasList.length > 0) {
        const aulaIds = aulasList.map((a) => a.id)
        const progRes = await supabase
          .from('progresso_corretor')
          .select('*')
          .eq('corretor_id', profile.id)
          .in('aula_id', aulaIds)

        if (!progRes.error && progRes.data) {
          const map = new Map<string, ProgressoCorretor>()
          for (const p of progRes.data as ProgressoCorretor[]) {
            map.set(p.aula_id, p)
          }
          setProgresso(map)

          // Set current aula: first uncompleted or first
          const firstUncompleted = aulasList.find((a) => !map.get(a.id)?.concluida)
          setCurrentAulaId(firstUncompleted?.id ?? aulasList[0]?.id ?? null)
        } else {
          setCurrentAulaId(aulasList[0]?.id ?? null)
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar modulo')
    } finally {
      setLoading(false)
    }
  }, [moduloId, profile])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset avaliacao state when changing aula
  useEffect(() => {
    setRespostas(new Map())
    setSubmitted(false)
    setAulaScore(null)
    setQuestionResults(new Map())
  }, [currentAulaId])

  /* ---------------------------------------------------------------- */
  /*  Conclude aula (conteudo/exercicio/checklist/caso_pratico)        */
  /* ---------------------------------------------------------------- */

  const handleConcluirAula = useCallback(async () => {
    if (!currentAula || !profile) return
    setSaving(true)

    try {
      const now = new Date().toISOString()
      const existing = progresso.get(currentAula.id)

      await supabase.from('progresso_corretor').upsert(
        {
          corretor_id: profile.id,
          aula_id: currentAula.id,
          concluida: true,
          pontuacao: currentAula.pontos,
          tentativas: (existing?.tentativas ?? 0) + 1,
          melhor_nota: 100,
          tempo_gasto_segundos: existing?.tempo_gasto_segundos ?? 0,
          respostas: null,
          concluida_em: now,
        },
        { onConflict: 'corretor_id,aula_id' },
      )

      // Update local state
      const newProg = new Map(progresso)
      newProg.set(currentAula.id, {
        corretor_id: profile.id,
        aula_id: currentAula.id,
        concluida: true,
        pontuacao: currentAula.pontos,
        tentativas: (existing?.tentativas ?? 0) + 1,
        melhor_nota: 100,
        tempo_gasto_segundos: existing?.tempo_gasto_segundos ?? 0,
        respostas: null,
        concluida_em: now,
      })
      setProgresso(newProg)

      await updateProgressoModulo(newProg)
      toast.success('Aula concluida!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar progresso')
    } finally {
      setSaving(false)
    }
  }, [currentAula, profile, progresso])

  /* ---------------------------------------------------------------- */
  /*  Submit avaliacao                                                  */
  /* ---------------------------------------------------------------- */

  const handleSubmitAvaliacao = useCallback(async () => {
    if (!currentAula || !profile) return

    const questoes = currentAula.questoes
    if (respostas.size < questoes.length) {
      toast.error('Responda todas as questoes antes de enviar')
      return
    }

    setSaving(true)

    try {
      let correct = 0
      let totalPontos = 0
      let earnedPontos = 0
      const results = new Map<string, boolean>()

      for (const q of questoes) {
        totalPontos += q.pontos
        const userAnswer = respostas.get(q.id)

        let isCorrect = false
        if (q.tipo === 'multipla_escolha') {
          isCorrect = userAnswer === q.resposta_correta
        } else {
          isCorrect = userAnswer === q.resposta_correta
        }

        results.set(q.id, isCorrect)
        if (isCorrect) {
          correct++
          earnedPontos += q.pontos
        }
      }

      const score = questoes.length > 0 ? Math.round((correct / questoes.length) * 100) : 0
      setQuestionResults(results)
      setAulaScore(score)
      setSubmitted(true)

      const existing = progresso.get(currentAula.id)
      const notaMinima = modulo?.nota_minima ?? 70
      const passed = score >= notaMinima

      const respostasObj: Record<string, unknown> = {}
      respostas.forEach((val, key) => {
        respostasObj[key] = val
      })

      await supabase.from('progresso_corretor').upsert(
        {
          corretor_id: profile.id,
          aula_id: currentAula.id,
          concluida: passed,
          pontuacao: earnedPontos,
          tentativas: (existing?.tentativas ?? 0) + 1,
          melhor_nota: Math.max(score, existing?.melhor_nota ?? 0),
          tempo_gasto_segundos: existing?.tempo_gasto_segundos ?? 0,
          respostas: respostasObj,
          concluida_em: passed ? new Date().toISOString() : existing?.concluida_em ?? null,
        },
        { onConflict: 'corretor_id,aula_id' },
      )

      const newProg = new Map(progresso)
      newProg.set(currentAula.id, {
        corretor_id: profile.id,
        aula_id: currentAula.id,
        concluida: passed,
        pontuacao: earnedPontos,
        tentativas: (existing?.tentativas ?? 0) + 1,
        melhor_nota: Math.max(score, existing?.melhor_nota ?? 0),
        tempo_gasto_segundos: existing?.tempo_gasto_segundos ?? 0,
        respostas: respostasObj,
        concluida_em: passed ? new Date().toISOString() : existing?.concluida_em ?? null,
      })
      setProgresso(newProg)

      await updateProgressoModulo(newProg)

      if (passed) {
        toast.success(`Aprovado com ${score}%!`)
      } else {
        toast.error(`Voce obteve ${score}%. Minimo necessario: ${notaMinima}%.`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar respostas')
    } finally {
      setSaving(false)
    }
  }, [currentAula, profile, respostas, progresso, modulo])

  /* ---------------------------------------------------------------- */
  /*  Update module progress                                           */
  /* ---------------------------------------------------------------- */

  const updateProgressoModulo = useCallback(
    async (progressMap: Map<string, ProgressoCorretor>) => {
      if (!profile || !moduloId || aulas.length === 0) return

      const totalAulas = aulas.length
      const concluidas = aulas.filter((a) => progressMap.get(a.id)?.concluida).length
      const percentual = Math.round((concluidas / totalAulas) * 100)

      // Average score of avaliacoes only
      const avaliacoes = aulas.filter((a) => a.tipo === 'avaliacao')
      let notaMedia: number | null = null
      if (avaliacoes.length > 0) {
        const scores = avaliacoes
          .map((a) => progressMap.get(a.id)?.melhor_nota)
          .filter((s): s is number => s != null)
        notaMedia = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      }

      const concluido = percentual === 100

      await supabase.from('progresso_modulo').upsert(
        {
          corretor_id: profile.id,
          modulo_id: moduloId,
          percentual,
          nota_media: notaMedia,
          concluido,
          concluido_em: concluido ? new Date().toISOString() : null,
        },
        { onConflict: 'corretor_id,modulo_id' },
      )
    },
    [profile, moduloId, aulas],
  )

  /* ---------------------------------------------------------------- */
  /*  Navigation helpers                                               */
  /* ---------------------------------------------------------------- */

  const goToNextAula = useCallback(() => {
    if (!currentAula) return
    const idx = aulas.findIndex((a) => a.id === currentAula.id)
    if (idx < aulas.length - 1) {
      setCurrentAulaId(aulas[idx + 1].id)
    }
  }, [currentAula, aulas])

  const handleRetry = useCallback(() => {
    setRespostas(new Map())
    setSubmitted(false)
    setAulaScore(null)
    setQuestionResults(new Map())
  }, [])

  const getAulaStatus = useCallback(
    (aula: Aula): 'done' | 'current' | 'locked' => {
      if (progresso.get(aula.id)?.concluida) return 'done'
      if (aula.id === currentAulaId) return 'current'
      return 'locked'
    },
    [progresso, currentAulaId],
  )

  const isCurrentAulaConcluida = currentAula ? progresso.get(currentAula.id)?.concluida ?? false : false
  const currentIdx = currentAula ? aulas.findIndex((a) => a.id === currentAula.id) : -1
  const hasNextAula = currentIdx >= 0 && currentIdx < aulas.length - 1

  /* ---------------------------------------------------------------- */
  /*  Loading                                                          */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!modulo || aulas.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">Modulo nao encontrado ou sem aulas.</p>
        <button
          onClick={() => navigate('/painel/aprendizado')}
          className="text-primary-600 hover:underline"
        >
          Voltar ao Aprendizado
        </button>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen">
      {/* ---- HEADER ---- */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/painel/aprendizado')}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{modulo.titulo}</h1>
            {modulo.descricao && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{modulo.descricao}</p>
            )}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-gray-300">
                {aulasConcluidasCount}/{aulas.length} aulas concluidas
              </span>
              {progressPercent === 100 && (
                <Trophy className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- MOBILE TABS ---- */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {aulas.map((aula) => {
          const status = getAulaStatus(aula)
          return (
            <button
              key={aula.id}
              onClick={() => { setCurrentAulaId(aula.id); setSidebarOpen(false) }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
                aula.id === currentAulaId
                  ? 'bg-primary-600 text-white shadow-md'
                  : status === 'done'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {status === 'done' ? <CheckCircle className="h-3.5 w-3.5" /> : getAulaIcon(aula.tipo)}
              <span className="max-w-[120px] truncate">{aula.titulo}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-6">
        {/* ---- SIDEBAR (desktop) ---- */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6 space-y-1 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Aulas do modulo
            </h3>
            {aulas.map((aula, idx) => {
              const status = getAulaStatus(aula)
              const isCurrent = aula.id === currentAulaId
              return (
                <button
                  key={aula.id}
                  onClick={() => setCurrentAulaId(aula.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isCurrent
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium ${
                      status === 'done'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                        : isCurrent
                          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}
                  >
                    {status === 'done' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isCurrent ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${isCurrent ? '' : ''}`}>
                      {idx + 1}. {aula.titulo}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {getAulaTipoLabel(aula.tipo)}
                      {aula.pontos > 0 && ` - ${aula.pontos} pts`}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ---- MAIN CONTENT ---- */}
        <main className="min-w-0 flex-1">
          {currentAula && (
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
              {/* Aula header */}
              <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  {getAulaIcon(currentAula.tipo)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentAula.titulo}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {getAulaTipoLabel(currentAula.tipo)}
                    {currentAula.pontos > 0 && ` - ${currentAula.pontos} pontos`}
                  </p>
                </div>
                {isCurrentAulaConcluida && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Concluida
                  </span>
                )}
              </div>

              {/* ---- CONTENT TYPE: conteudo / exercicio / checklist / caso_pratico ---- */}
              {currentAula.tipo !== 'avaliacao' && (
                <>
                  {currentAula.conteudo && (
                    <div
                      className="prose-custom mb-8"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(currentAula.conteudo) }}
                    />
                  )}

                  {!isCurrentAulaConcluida && (
                    <button
                      onClick={handleConcluirAula}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Marcar como concluida
                    </button>
                  )}

                  {isCurrentAulaConcluida && hasNextAula && (
                    <button
                      onClick={goToNextAula}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                    >
                      Proxima aula
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}

              {/* ---- CONTENT TYPE: avaliacao ---- */}
              {currentAula.tipo === 'avaliacao' && (
                <>
                  {currentAula.conteudo && (
                    <div
                      className="prose-custom mb-8"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(currentAula.conteudo) }}
                    />
                  )}

                  <div className="space-y-8">
                    {currentAula.questoes.map((q, qIdx) => {
                      const result = questionResults.get(q.id)
                      const isCorrect = result === true
                      const isWrong = result === false

                      return (
                        <div
                          key={q.id}
                          className={`rounded-xl border p-5 transition ${
                            submitted
                              ? isCorrect
                                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                                : isWrong
                                  ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <p className="mb-4 font-medium text-gray-900 dark:text-white">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                              {qIdx + 1}
                            </span>
                            {q.enunciado}
                          </p>

                          {/* Multipla escolha */}
                          {q.tipo === 'multipla_escolha' && q.opcoes && (
                            <div className="space-y-2">
                              {q.opcoes.map((opcao, optIdx) => {
                                const selected = respostas.get(q.id) === optIdx
                                const isCorrectOpt = submitted && optIdx === q.resposta_correta
                                const isWrongOpt = submitted && selected && optIdx !== q.resposta_correta

                                return (
                                  <label
                                    key={optIdx}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                                      submitted
                                        ? isCorrectOpt
                                          ? 'border-green-400 bg-green-100 dark:border-green-600 dark:bg-green-900/30'
                                          : isWrongOpt
                                            ? 'border-red-400 bg-red-100 dark:border-red-600 dark:bg-red-900/30'
                                            : 'border-gray-200 dark:border-gray-600'
                                        : selected
                                          ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
                                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`q-${q.id}`}
                                      checked={selected}
                                      disabled={submitted}
                                      onChange={() => {
                                        const newR = new Map(respostas)
                                        newR.set(q.id, optIdx)
                                        setRespostas(newR)
                                      }}
                                      className="h-4 w-4 text-primary-600 accent-primary-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {opcao}
                                    </span>
                                    {submitted && isCorrectOpt && (
                                      <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                                    )}
                                  </label>
                                )
                              })}
                            </div>
                          )}

                          {/* Verdadeiro / Falso */}
                          {q.tipo === 'verdadeiro_falso' && (
                            <div className="flex gap-3">
                              {[
                                { label: 'Verdadeiro', value: true },
                                { label: 'Falso', value: false },
                              ].map(({ label, value }) => {
                                const selected = respostas.get(q.id) === value
                                const isCorrectOpt = submitted && value === q.resposta_correta
                                const isWrongOpt = submitted && selected && value !== q.resposta_correta

                                return (
                                  <button
                                    key={label}
                                    disabled={submitted}
                                    onClick={() => {
                                      const newR = new Map(respostas)
                                      newR.set(q.id, value)
                                      setRespostas(newR)
                                    }}
                                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                                      submitted
                                        ? isCorrectOpt
                                          ? 'border-green-400 bg-green-100 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-400'
                                          : isWrongOpt
                                            ? 'border-red-400 bg-red-100 text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-400'
                                        : selected
                                          ? 'border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                                          : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500'
                                    }`}
                                  >
                                    {label}
                                    {submitted && isCorrectOpt && (
                                      <CheckCircle className="ml-2 inline h-4 w-4" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Explicacao after submit */}
                          {submitted && q.explicacao && (
                            <div className={`mt-3 rounded-lg p-3 text-sm ${
                              isCorrect
                                ? 'bg-green-100/50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-red-100/50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            }`}>
                              <strong>{isCorrect ? 'Correto!' : 'Incorreto.'}</strong>{' '}
                              {q.explicacao}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Score summary */}
                  {submitted && aulaScore !== null && (
                    <div className={`mt-8 rounded-xl border p-6 text-center ${
                      aulaScore >= (modulo.nota_minima ?? 70)
                        ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                        : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                    }`}>
                      <div className="mb-2 text-4xl font-bold">
                        <span className={aulaScore >= (modulo.nota_minima ?? 70) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {aulaScore}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {Array.from(questionResults.values()).filter(Boolean).length} de{' '}
                        {currentAula.questoes.length} questoes corretas
                      </p>

                      {aulaScore >= (modulo.nota_minima ?? 70) ? (
                        <div className="mt-4">
                          <p className="mb-3 flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                            <Trophy className="h-5 w-5" /> Aprovado!
                          </p>
                          {hasNextAula && (
                            <button
                              onClick={goToNextAula}
                              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                            >
                              Proxima aula
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <p className="mb-3 text-sm text-red-700 dark:text-red-400">
                            Voce precisa de {modulo.nota_minima ?? 70}% para aprovar. Tente novamente.
                          </p>
                          <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Tentar novamente
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit button */}
                  {!submitted && (
                    <div className="mt-8">
                      <button
                        onClick={handleSubmitAvaliacao}
                        disabled={saving || respostas.size < currentAula.questoes.length}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Enviar Respostas
                      </button>
                      <p className="mt-2 text-xs text-gray-400">
                        {respostas.size}/{currentAula.questoes.length} questoes respondidas
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
