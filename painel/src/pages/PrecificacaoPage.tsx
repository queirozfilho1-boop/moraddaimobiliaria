import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  FileDown,
  ArrowRight,
  Pencil,
  Check,
  X,
  Building2,
  MapPin,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { gerarPTAM } from '@/lib/ptam-pdf'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BairroOption {
  id: string
  nome: string
}

interface PrecoReferencia {
  id: string
  bairro_id: string
  tipo_imovel: string
  preco_m2_medio: number
  preco_m2_minimo: number | null
  preco_m2_maximo: number | null
  data_referencia: string
  bairros: {
    id: string
    nome: string
  }
}

type Padrao = 'baixo' | 'medio' | 'alto'

interface FormData {
  bairro_id: string
  tipo: string
  padrao: Padrao
  area: number
  quartos: number
  suites: number
  vagas: number
  idade: number
  extras: string[]
}

interface Resultado {
  minValue: number
  maxValue: number
  avgValue: number
  pricePerM2: number
  similarCount: number
  confidence: 'alta' | 'media' | 'baixa'
  adjustments: {
    base: number
    quartos: number
    suites: number
    vagas: number
    idade: number
    extras: number
  }
}

interface RefRow {
  id: string
  bairro: string
  tipo: string
  precoM2Medio: number
  precoM2Min: number | null
  precoM2Max: number | null
  ultimaAtualizacao: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const tipoLabels: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
  cobertura: 'Cobertura',
  sobrado: 'Sobrado',
}

const extrasOptions = [
  'Piscina',
  'Churrasqueira',
  'Varanda',
  'Elevador',
  'Portaria 24h',
  'Espaço Gourmet',
  'Sauna',
  'Jardim',
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatPercent(value: number): string {
  const pct = (value - 1) * 100
  if (pct > 0) return `+${pct.toFixed(0)}%`
  if (pct < 0) return `${pct.toFixed(0)}%`
  return '0%'
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

// PDF generation moved to @/lib/ptam-pdf.ts

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PrecificacaoPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isSuperadmin = profile?.role === 'superadmin'

  /* ---- Supabase data ---- */
  const [precosRef, setPrecosRef] = useState<PrecoReferencia[]>([])
  const [todosBairros, setTodosBairros] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Nova referência
  const [showNovaRef, setShowNovaRef] = useState(false)
  const [novaRef, setNovaRef] = useState({ bairro_id: '', tipo: '', area_construida: 0, area_total: 0, valor: 0 })
  const [salvandoRef, setSalvandoRef] = useState(false)

  useEffect(() => {
    fetchPrecos()
    fetchTodosBairros()
  }, [])

  async function fetchTodosBairros() {
    const { data } = await supabase.from('bairros').select('id, nome').order('nome')
    setTodosBairros(data || [])
  }

  async function salvarNovaReferencia() {
    if (!novaRef.bairro_id || !novaRef.tipo || !novaRef.valor || !novaRef.area_construida) {
      toast.error('Preencha bairro, tipo, área construída e valor')
      return
    }
    const precoM2 = Math.round(novaRef.valor / novaRef.area_construida)
    if (precoM2 <= 0) {
      toast.error('Valor ou área inválidos')
      return
    }

    setSalvandoRef(true)

    // Verificar se já existe referência para esse bairro+tipo
    const { data: existing } = await supabase
      .from('precos_referencia')
      .select('id, preco_m2_medio, preco_m2_minimo, preco_m2_maximo')
      .eq('bairro_id', novaRef.bairro_id)
      .eq('tipo_imovel', novaRef.tipo)
      .limit(1)

    let error
    if (existing && existing.length > 0) {
      // Atualizar média com o novo dado
      const old = existing[0]
      const novoMedio = Math.round((old.preco_m2_medio + precoM2) / 2)
      const novoMin = Math.min(old.preco_m2_minimo || precoM2, precoM2)
      const novoMax = Math.max(old.preco_m2_maximo || precoM2, precoM2)
      const res = await supabase.from('precos_referencia').update({
        preco_m2_medio: novoMedio,
        preco_m2_minimo: novoMin,
        preco_m2_maximo: novoMax,
        observacoes: `Atualizado com novo dado: ${novaRef.area_construida}m² por ${formatCurrency(novaRef.valor)} (R$${precoM2}/m²)`,
      }).eq('id', old.id)
      error = res.error
    } else {
      // Criar novo registro
      const res = await supabase.from('precos_referencia').insert({
        bairro_id: novaRef.bairro_id,
        tipo_imovel: novaRef.tipo,
        preco_m2_medio: precoM2,
        preco_m2_minimo: precoM2,
        preco_m2_maximo: precoM2,
        fonte: 'manual',
        observacoes: `Imóvel: ${novaRef.area_construida}m² por ${formatCurrency(novaRef.valor)} (R$${precoM2}/m²)`,
      })
      error = res.error
    }

    setSalvandoRef(false)
    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
      return
    }
    toast.success(`Referência salva! Preço/m² calculado: R$ ${precoM2.toLocaleString('pt-BR')}`)
    setNovaRef({ bairro_id: '', tipo: '', area_construida: 0, area_total: 0, valor: 0 })
    setShowNovaRef(false)
    await fetchPrecos()
  }

  async function fetchPrecos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('precos_referencia')
      .select(
        'id, bairro_id, tipo_imovel, preco_m2_medio, preco_m2_minimo, preco_m2_maximo, data_referencia, bairros(id, nome)',
      )
      .order('bairro_id')

    if (error) {
      toast.error('Erro ao carregar dados de referencia: ' + error.message)
      setLoading(false)
      return
    }

    setPrecosRef((data as unknown as PrecoReferencia[]) ?? [])
    setLoading(false)
  }

  /* Derived: unique bairros from data */
  const bairroOptions = useMemo<BairroOption[]>(() => {
    const map = new Map<string, string>()
    for (const p of precosRef) {
      if (p.bairros && !map.has(p.bairros.id)) {
        map.set(p.bairros.id, p.bairros.nome)
      }
    }
    return Array.from(map, ([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome),
    )
  }, [precosRef])

  /* ---- Form state ---- */
  const [form, setForm] = useState<FormData>({
    bairro_id: '',
    tipo: '',
    padrao: 'medio',
    area: 0,
    quartos: 0,
    suites: 0,
    vagas: 0,
    idade: 0,
    extras: [],
  })

  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({
    precoM2Medio: 0,
    precoM2Min: 0,
    precoM2Max: 0,
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [historico, setHistorico] = useState<{ id: string; bairro_nome: string; tipo_imovel: string; area: number; valor_medio: number; confianca: string; corretor_nome: string; created_at: string }[]>([])

  useEffect(() => { fetchHistorico() }, [])

  async function fetchHistorico() {
    const { data } = await supabase
      .from('ptam_historico')
      .select('id, bairro_nome, tipo_imovel, area, valor_medio, confianca, corretor_nome, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    setHistorico(data || [])
  }

  const [fotosPreview, setFotosPreview] = useState<{ file: File; preview: string }[]>([])
  const [fotosBase64, setFotosBase64] = useState<string[]>([])

  function handleFotos(files: FileList | File[]) {
    const newFotos = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 6 - fotosPreview.length)
    const previews = newFotos.map(file => ({ file, preview: URL.createObjectURL(file) }))
    setFotosPreview(prev => [...prev, ...previews].slice(0, 6))
    // Convert to base64 for PDF
    newFotos.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setFotosBase64(prev => [...prev, reader.result as string].slice(0, 6))
      }
      reader.readAsDataURL(file)
    })
  }

  function removeFoto(index: number) {
    setFotosPreview(prev => prev.filter((_, i) => i !== index))
    setFotosBase64(prev => prev.filter((_, i) => i !== index))
  }

  /* Derived: available tipos for the selected bairro */
  const tipoOptions = useMemo(() => {
    if (!form.bairro_id) return []
    const tipos = new Set<string>()
    for (const p of precosRef) {
      if (p.bairro_id === form.bairro_id) {
        tipos.add(p.tipo_imovel)
      }
    }
    return Array.from(tipos).sort()
  }, [form.bairro_id, precosRef])

  /* Derived: matching reference row for current bairro+tipo */
  const matchingRef = useMemo(() => {
    if (!form.bairro_id || !form.tipo) return null
    return (
      precosRef.find(
        (p) => p.bairro_id === form.bairro_id && p.tipo_imovel === form.tipo,
      ) ?? null
    )
  }, [form.bairro_id, form.tipo, precosRef])

  /* Derived: selected bairro name */
  const selectedBairroNome = useMemo(() => {
    return bairroOptions.find((b) => b.id === form.bairro_id)?.nome ?? ''
  }, [form.bairro_id, bairroOptions])

  /* Derived: ref table rows */
  const refData = useMemo<RefRow[]>(() => {
    return precosRef.map((p) => ({
      id: p.id,
      bairro: p.bairros?.nome ?? '—',
      tipo: tipoLabels[p.tipo_imovel] ?? p.tipo_imovel,
      precoM2Medio: p.preco_m2_medio,
      precoM2Min: p.preco_m2_minimo,
      precoM2Max: p.preco_m2_maximo,
      ultimaAtualizacao: p.data_referencia,
    }))
  }, [precosRef])

  /* Form handlers */
  function updateForm<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Reset tipo when bairro changes
      if (key === 'bairro_id') {
        next.tipo = ''
      }
      return next
    })
    // Clear resultado when form changes
    setResultado(null)
  }

  function toggleExtra(extra: string) {
    setForm((prev) => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter((e) => e !== extra)
        : [...prev.extras, extra],
    }))
  }

  /* Calculation */
  function calcular() {
    if (!form.bairro_id || !form.tipo || !form.area) {
      toast.error('Preencha bairro, tipo do imovel e area construida.')
      return
    }

    if (!matchingRef) {
      toast.error('Dados nao disponiveis para este bairro/tipo.')
      return
    }

    // Ajustar preço/m² base pelo padrão do imóvel
    const refMedio = matchingRef.preco_m2_medio
    const refMin = matchingRef.preco_m2_minimo ?? refMedio * 0.7
    const refMax = matchingRef.preco_m2_maximo ?? refMedio * 1.3

    let precoM2: number
    if (form.padrao === 'baixo') {
      precoM2 = Math.round((refMin + refMedio) / 2) // entre mín e médio
    } else if (form.padrao === 'alto') {
      precoM2 = Math.round((refMedio + refMax) / 2) // entre médio e máx
    } else {
      precoM2 = refMedio // padrão médio
    }
    const baseValue = form.area * precoM2

    const adjustQuartos =
      form.quartos >= 3 ? 1.05 : form.quartos >= 2 ? 1.02 : 1.0
    const adjustSuites =
      form.suites >= 2 ? 1.06 : form.suites >= 1 ? 1.03 : 1.0
    const adjustVagas =
      form.vagas >= 3
        ? 1.08
        : form.vagas >= 2
          ? 1.04
          : form.vagas >= 1
            ? 1.02
            : 1.0
    const adjustIdade =
      form.idade <= 2
        ? 1.05
        : form.idade <= 5
          ? 1.0
          : form.idade <= 10
            ? 0.95
            : form.idade <= 20
              ? 0.9
              : 0.85
    const adjustExtras = 1 + form.extras.length * 0.015

    const estimatedValue =
      baseValue *
      adjustQuartos *
      adjustSuites *
      adjustVagas *
      adjustIdade *
      adjustExtras
    const minValue = Math.round(estimatedValue * 0.9)
    const maxValue = Math.round(estimatedValue * 1.1)
    const avgValue = Math.round(estimatedValue)
    const pricePerM2Final = Math.round(estimatedValue / form.area)

    // Count how many records exist for this bairro as "similar" count
    const similarCount = precosRef.filter(
      (p) => p.bairro_id === form.bairro_id,
    ).length

    // Confidence: based on whether we have min/max data and record count
    const hasMinMax =
      matchingRef.preco_m2_minimo != null &&
      matchingRef.preco_m2_maximo != null
    let confidence: 'alta' | 'media' | 'baixa' = 'media'
    if (hasMinMax && similarCount >= 3 && form.area >= 40) confidence = 'alta'
    else if (!hasMinMax || similarCount < 2 || form.area < 30)
      confidence = 'baixa'

    setResultado({
      minValue,
      maxValue,
      avgValue,
      pricePerM2: pricePerM2Final,
      similarCount,
      confidence,
      adjustments: {
        base: precoM2,
        quartos: adjustQuartos,
        suites: adjustSuites,
        vagas: adjustVagas,
        idade: adjustIdade,
        extras: adjustExtras,
      },
    })
  }

  function usarValorMedio() {
    if (!resultado) return
    navigate('/painel/imoveis/novo', { state: { preco: resultado.avgValue } })
  }

  async function exportarRelatorio() {
    if (!resultado || !form.bairro_id || !form.tipo) {
      toast.error('Calcule a estimativa antes de gerar o PTAM.')
      return
    }
    const tipoLabel = tipoLabels[form.tipo] ?? form.tipo
    gerarPTAM({
      bairroNome: selectedBairroNome,
      tipo: form.tipo,
      tipoLabel,
      area: form.area,
      quartos: form.quartos,
      suites: form.suites,
      vagas: form.vagas,
      idade: form.idade,
      extras: form.extras,
      minValue: resultado.minValue,
      maxValue: resultado.maxValue,
      avgValue: resultado.avgValue,
      pricePerM2: resultado.pricePerM2,
      similarCount: resultado.similarCount,
      confidence: resultado.confidence,
      adjustments: resultado.adjustments,
      fotos: fotosBase64,
    })

    // Salvar no histórico
    await supabase.from('ptam_historico').insert({
      bairro_nome: selectedBairroNome,
      tipo_imovel: form.tipo,
      area: form.area,
      quartos: form.quartos,
      suites: form.suites,
      vagas: form.vagas,
      idade: form.idade,
      extras: form.extras,
      valor_minimo: resultado.minValue,
      valor_maximo: resultado.maxValue,
      valor_medio: resultado.avgValue,
      preco_m2: resultado.pricePerM2,
      confianca: resultado.confidence,
      corretor_id: profile?.id || null,
      corretor_nome: profile?.nome || null,
    })
    fetchHistorico()
    toast.success('PTAM gerado com sucesso!')
  }

  /* Ref table editing */
  function startEdit(row: RefRow) {
    setEditingRowId(row.id)
    setEditValues({
      precoM2Medio: row.precoM2Medio,
      precoM2Min: row.precoM2Min ?? 0,
      precoM2Max: row.precoM2Max ?? 0,
    })
  }

  async function saveEdit() {
    if (!editingRowId) return
    setSavingEdit(true)

    const { error } = await supabase
      .from('precos_referencia')
      .update({
        preco_m2_medio: editValues.precoM2Medio,
        preco_m2_minimo: editValues.precoM2Min,
        preco_m2_maximo: editValues.precoM2Max,
      })
      .eq('id', editingRowId)

    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
      setSavingEdit(false)
      return
    }

    // Refresh data from Supabase
    await fetchPrecos()
    setEditingRowId(null)
    setSavingEdit(false)
    toast.success('Dados de referencia atualizados.')
  }

  /* ---------------------------------------------------------------- */
  /*  Confidence badge                                                 */
  /* ---------------------------------------------------------------- */

  const confidenceConfig = {
    alta: {
      label: 'Alta',
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-100 dark:bg-green-900/40',
    },
    media: {
      label: 'Media',
      color: 'text-yellow-700 dark:text-yellow-300',
      bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    },
    baixa: {
      label: 'Baixa',
      color: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-100 dark:bg-red-900/40',
    },
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
          Carregando dados de referencia...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Precificacao
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimativa de valor para imoveis
          </p>
        </div>
      </div>

      {/* Nova Referência */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Faltam dados de um bairro? Cadastre a referência de preço/m².
          </p>
          <button
            onClick={() => setShowNovaRef(!showNovaRef)}
            className="rounded-lg bg-moradda-gold-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-moradda-gold-600"
          >
            {showNovaRef ? 'Fechar' : '+ Nova Referência'}
          </button>
        </div>
        {showNovaRef && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Encontrou um imóvel anunciado? Preencha os dados abaixo e o sistema calcula o preço/m² automaticamente.
            </p>
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Bairro</label>
                <select
                  value={novaRef.bairro_id}
                  onChange={(e) => setNovaRef(p => ({ ...p, bairro_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Selecione o bairro...</option>
                  {todosBairros.map(b => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tipo</label>
                <select
                  value={novaRef.tipo}
                  onChange={(e) => setNovaRef(p => ({ ...p, tipo: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Tipo...</option>
                  {Object.entries(tipoLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Área Construída (m²)</label>
                <input type="number" value={novaRef.area_construida || ''} onChange={(e) => setNovaRef(p => ({ ...p, area_construida: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="120" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Área Total (m²)</label>
                <input type="number" value={novaRef.area_total || ''} onChange={(e) => setNovaRef(p => ({ ...p, area_total: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="250" />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Valor do Imóvel (R$)</label>
                <input type="number" value={novaRef.valor || ''} onChange={(e) => setNovaRef(p => ({ ...p, valor: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="450000" />
              </div>
              <div className="flex items-end">
                <div className="w-full rounded-lg bg-moradda-blue-50 px-3 py-2 text-center dark:bg-moradda-blue-900/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Preço/m² calculado</p>
                  <p className="text-lg font-bold text-moradda-blue-600 dark:text-moradda-blue-300">
                    {novaRef.area_construida > 0 && novaRef.valor > 0
                      ? `R$ ${Math.round(novaRef.valor / novaRef.area_construida).toLocaleString('pt-BR')}/m²`
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={salvarNovaReferencia}
                  disabled={salvandoRef}
                  className="w-full rounded-lg bg-moradda-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-moradda-blue-600 disabled:opacity-50"
                >
                  {salvandoRef ? 'Salvando...' : 'Salvar Referência'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: Form */}
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Dados do Imovel
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Bairro */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="mr-1 inline h-4 w-4" />
                Bairro
              </label>
              <select
                value={form.bairro_id}
                onChange={(e) => updateForm('bairro_id', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Selecione...</option>
                {todosBairros.map((b) => {
                  const temDados = bairroOptions.some(bo => bo.id === b.id)
                  return (
                    <option key={b.id} value={b.id}>
                      {b.nome}{temDados ? '' : ' (sem dados)'}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Building2 className="mr-1 inline h-4 w-4" />
                Tipo do Imovel
              </label>
              <select
                value={form.tipo}
                onChange={(e) => updateForm('tipo', e.target.value)}
                disabled={!form.bairro_id}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">
                  {form.bairro_id
                    ? 'Selecione...'
                    : 'Selecione o bairro primeiro'}
                </option>
                {tipoOptions.map((t) => (
                  <option key={t} value={t}>
                    {tipoLabels[t] ?? t}
                  </option>
                ))}
              </select>
            </div>

            {/* No data message */}
            {form.bairro_id && form.tipo && !matchingRef && (
              <div className="sm:col-span-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300">
                Dados nao disponiveis para este bairro/tipo.
              </div>
            )}

            {/* Padrão */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Padrão do Imóvel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([['baixo', 'Baixo Padrão'], ['medio', 'Médio Padrão'], ['alto', 'Alto Padrão']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateForm('padrao', val)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      form.padrao === val
                        ? val === 'baixo'
                          ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-900/30 dark:text-orange-300'
                          : val === 'alto'
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Area */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Area Construida (m2)
              </label>
              <input
                type="number"
                min={0}
                value={form.area || ''}
                onChange={(e) => updateForm('area', Number(e.target.value))}
                placeholder="Ex: 120"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Quartos */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quartos
              </label>
              <input
                type="number"
                min={0}
                value={form.quartos || ''}
                onChange={(e) => updateForm('quartos', Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Suites */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Suites
              </label>
              <input
                type="number"
                min={0}
                value={form.suites || ''}
                onChange={(e) => updateForm('suites', Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Vagas */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vagas
              </label>
              <input
                type="number"
                min={0}
                value={form.vagas || ''}
                onChange={(e) => updateForm('vagas', Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Idade */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Idade do Imovel (anos)
              </label>
              <input
                type="number"
                min={0}
                value={form.idade || ''}
                onChange={(e) => updateForm('idade', Number(e.target.value))}
                placeholder="Ex: 5"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Extras */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Caracteristicas Extras
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {extrasOptions.map((extra) => (
                <label
                  key={extra}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    form.extras.includes(extra)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.extras.includes(extra)}
                    onChange={() => toggleExtra(extra)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      form.extras.includes(extra)
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {form.extras.includes(extra) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {extra}
                </label>
              ))}
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={calcular}
            className="w-full rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 focus:ring-2 focus:ring-amber-500/20 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            <Calculator className="mr-2 inline h-4 w-4" />
            Calcular Estimativa
          </button>

          {/* Fotos para o PTAM */}
          <div className="mt-4 rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Fotos para o Parecer (opcional, máx. 6)
            </h3>
            <div
              onClick={() => document.getElementById('ptam-fotos')?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 transition hover:border-amber-400 dark:border-gray-600"
            >
              <FileDown className="mb-2 h-6 w-6 text-gray-400" />
              <p className="text-xs text-gray-500">Clique para selecionar fotos</p>
              <input
                id="ptam-fotos"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files) handleFotos(e.target.files); e.target.value = '' }}
              />
            </div>
            {fotosPreview.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {fotosPreview.map((f, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg">
                    <img src={f.preview} alt={`Foto ${i+1}`} className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFoto(i)}
                      className="absolute top-1 right-1 rounded bg-red-500 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="space-y-4">
          {!resultado ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                  Preencha os dados e clique em &quot;Calcular Estimativa&quot;
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Main result card */}
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Estimativa de Valor
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceConfig[resultado.confidence].bg} ${confidenceConfig[resultado.confidence].color}`}
                  >
                    Confianca: {confidenceConfig[resultado.confidence].label}
                  </span>
                </div>

                {/* Range */}
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(resultado.minValue)} &mdash;{' '}
                  {formatCurrency(resultado.maxValue)}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Valor medio
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(resultado.avgValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Preco/m2
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(resultado.pricePerM2)}/m2
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tipos no bairro
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {resultado.similarCount} registros
                    </p>
                  </div>
                </div>
              </div>

              {/* Adjustments breakdown card */}
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Fatores de Ajuste
                </h3>
                <div className="space-y-2">
                  <AdjustmentRow
                    label="Preco/m2 medio do bairro"
                    value={`${formatCurrency(resultado.adjustments.base)}/m2`}
                    isBase
                  />
                  <AdjustmentRow
                    label="Quartos"
                    value={formatPercent(resultado.adjustments.quartos)}
                    factor={resultado.adjustments.quartos}
                  />
                  <AdjustmentRow
                    label="Suites"
                    value={formatPercent(resultado.adjustments.suites)}
                    factor={resultado.adjustments.suites}
                  />
                  <AdjustmentRow
                    label="Vagas"
                    value={formatPercent(resultado.adjustments.vagas)}
                    factor={resultado.adjustments.vagas}
                  />
                  <AdjustmentRow
                    label="Idade"
                    value={formatPercent(resultado.adjustments.idade)}
                    factor={resultado.adjustments.idade}
                  />
                  <AdjustmentRow
                    label="Extras"
                    value={formatPercent(resultado.adjustments.extras)}
                    factor={resultado.adjustments.extras}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={usarValorMedio}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Usar valor medio no cadastro
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={exportarRelatorio}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileDown className="h-4 w-4" />
                  Gerar PTAM (PDF)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reference Data Section (superadmin only) */}
      {isSuperadmin && (
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
            Dados de Referencia por Bairro
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {[
                    'Bairro',
                    'Tipo',
                    'Preco/m2 Medio',
                    'Preco/m2 Min',
                    'Preco/m2 Max',
                    'Data Referencia',
                    'Acoes',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {refData.map((row) => {
                  const isEditing = editingRowId === row.id
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/20"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {row.bairro}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {row.tipo}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={editValues.precoM2Medio}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  precoM2Medio: Number(e.target.value),
                                }))
                              }
                              className="w-24 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-sm text-gray-900 outline-none dark:border-blue-600 dark:bg-blue-900/30 dark:text-gray-100"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={editValues.precoM2Min}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  precoM2Min: Number(e.target.value),
                                }))
                              }
                              className="w-24 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-sm text-gray-900 outline-none dark:border-blue-600 dark:bg-blue-900/30 dark:text-gray-100"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={editValues.precoM2Max}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  precoM2Max: Number(e.target.value),
                                }))
                              }
                              className="w-24 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-sm text-gray-900 outline-none dark:border-blue-600 dark:bg-blue-900/30 dark:text-gray-100"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {formatCurrency(row.precoM2Medio)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {row.precoM2Min != null
                              ? formatCurrency(row.precoM2Min)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {row.precoM2Max != null
                              ? formatCurrency(row.precoM2Max)
                              : '—'}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(row.ultimaAtualizacao)}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={savingEdit}
                              className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/30"
                              title="Salvar"
                            >
                              {savingEdit ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              disabled={savingEdit}
                              className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(row)}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {refData.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      Nenhum dado de referencia cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Histórico de PTAMs */}
      {historico.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">
            Histórico de Pareceres (PTAM)
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Data</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Bairro</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Área</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Valor Estimado</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Confiança</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Corretor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {historico.map((h) => (
                    <tr key={h.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(h.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{h.bairro_nome}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{tipoLabels[h.tipo_imovel] || h.tipo_imovel}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{h.area} m²</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(h.valor_medio)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          h.confianca === 'alta' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                          h.confianca === 'baixa' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                        }`}>
                          {h.confianca === 'alta' ? 'Alta' : h.confianca === 'baixa' ? 'Baixa' : 'Média'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{h.corretor_nome || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Adjustment Row sub-component                                       */
/* ------------------------------------------------------------------ */

function AdjustmentRow({
  label,
  value,
  factor,
  isBase,
}: {
  label: string
  value: string
  factor?: number
  isBase?: boolean
}) {
  let icon = <Minus className="h-4 w-4 text-gray-400" />
  let textColor = 'text-gray-600 dark:text-gray-300'

  if (!isBase && factor !== undefined) {
    if (factor > 1) {
      icon = <TrendingUp className="h-4 w-4 text-green-500" />
      textColor = 'text-green-600 dark:text-green-400'
    } else if (factor < 1) {
      icon = <TrendingDown className="h-4 w-4 text-red-500" />
      textColor = 'text-red-600 dark:text-red-400'
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-semibold ${isBase ? 'text-gray-900 dark:text-gray-100' : textColor}`}
      >
        {value}
      </span>
    </div>
  )
}
