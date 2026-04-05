import { useState } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Bairro = 'centro' | 'jardim_jalisco' | 'paraiso' | 'campos_eliseos' | 'itapuca' | 'manejo'
type TipoImovel = 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'cobertura' | 'sobrado'

interface FormData {
  bairro: Bairro | ''
  tipo: TipoImovel | ''
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
  precoM2Min: number
  precoM2Max: number
  ultimaAtualizacao: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const bairroLabels: Record<Bairro, string> = {
  centro: 'Centro',
  jardim_jalisco: 'Jardim Jalisco',
  paraiso: 'Paraíso',
  campos_eliseos: 'Campos Elíseos',
  itapuca: 'Itapuca',
  manejo: 'Manejo',
}

const tipoLabels: Record<TipoImovel, string> = {
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

/* Price per m² reference data: bairro -> tipo -> price */
const priceRefMap: Record<string, Record<string, number>> = {
  centro: { casa: 4200, apartamento: 4800, terreno: 3200, comercial: 5200, cobertura: 5800, sobrado: 4500 },
  jardim_jalisco: { casa: 3800, apartamento: 4200, terreno: 2800, comercial: 4500, cobertura: 5200, sobrado: 4000 },
  paraiso: { casa: 4000, apartamento: 4500, terreno: 3000, comercial: 4800, cobertura: 5500, sobrado: 4200 },
  campos_eliseos: { casa: 4500, apartamento: 5200, terreno: 3500, comercial: 5500, cobertura: 6200, sobrado: 4800 },
  itapuca: { casa: 3200, apartamento: 3600, terreno: 2200, comercial: 3800, cobertura: 4500, sobrado: 3400 },
  manejo: { casa: 3000, apartamento: 3400, terreno: 2000, comercial: 3600, cobertura: 4200, sobrado: 3200 },
}

const similarCountMap: Record<string, number> = {
  centro: 18,
  jardim_jalisco: 12,
  paraiso: 14,
  campos_eliseos: 10,
  itapuca: 8,
  manejo: 6,
}

function buildRefData(): RefRow[] {
  const rows: RefRow[] = []
  const tiposRef: TipoImovel[] = ['casa', 'apartamento', 'terreno']
  for (const bairro of Object.keys(bairroLabels) as Bairro[]) {
    for (const tipo of tiposRef) {
      const medio = priceRefMap[bairro][tipo]
      rows.push({
        id: `${bairro}-${tipo}`,
        bairro: bairroLabels[bairro],
        tipo: tipoLabels[tipo],
        precoM2Medio: medio,
        precoM2Min: Math.round(medio * 0.8),
        precoM2Max: Math.round(medio * 1.2),
        ultimaAtualizacao: '2026-03-15',
      })
    }
  }
  return rows
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PrecificacaoPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isSuperadmin = profile?.role === 'superadmin'

  const [form, setForm] = useState<FormData>({
    bairro: '',
    tipo: '',
    area: 0,
    quartos: 0,
    suites: 0,
    vagas: 0,
    idade: 0,
    extras: [],
  })

  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [refData, setRefData] = useState<RefRow[]>(buildRefData)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ precoM2Medio: number; precoM2Min: number; precoM2Max: number }>({
    precoM2Medio: 0,
    precoM2Min: 0,
    precoM2Max: 0,
  })

  /* Form handlers */
  function updateForm<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
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
    if (!form.bairro || !form.tipo || !form.area) {
      toast.error('Preencha bairro, tipo do imóvel e área construída.')
      return
    }

    const precoM2 = priceRefMap[form.bairro]?.[form.tipo] ?? 3500
    const baseValue = form.area * precoM2

    const adjustQuartos = form.quartos >= 3 ? 1.05 : form.quartos >= 2 ? 1.02 : 1.0
    const adjustSuites = form.suites >= 2 ? 1.06 : form.suites >= 1 ? 1.03 : 1.0
    const adjustVagas = form.vagas >= 3 ? 1.08 : form.vagas >= 2 ? 1.04 : form.vagas >= 1 ? 1.02 : 1.0
    const adjustIdade = form.idade <= 2 ? 1.05 : form.idade <= 5 ? 1.0 : form.idade <= 10 ? 0.95 : form.idade <= 20 ? 0.90 : 0.85
    const adjustExtras = 1 + form.extras.length * 0.015

    const estimatedValue = baseValue * adjustQuartos * adjustSuites * adjustVagas * adjustIdade * adjustExtras
    const minValue = Math.round(estimatedValue * 0.9)
    const maxValue = Math.round(estimatedValue * 1.1)
    const avgValue = Math.round(estimatedValue)
    const pricePerM2Final = Math.round(estimatedValue / form.area)

    const similarCount = similarCountMap[form.bairro] ?? 8

    // Confidence based on similar count and data completeness
    let confidence: 'alta' | 'media' | 'baixa' = 'media'
    if (similarCount >= 12 && form.area >= 40) confidence = 'alta'
    else if (similarCount < 8 || form.area < 30) confidence = 'baixa'

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

  function exportarRelatorio() {
    toast.info('Funcionalidade de exportação será implementada em breve.')
  }

  /* Ref table editing */
  function startEdit(row: RefRow) {
    setEditingRowId(row.id)
    setEditValues({
      precoM2Medio: row.precoM2Medio,
      precoM2Min: row.precoM2Min,
      precoM2Max: row.precoM2Max,
    })
  }

  function saveEdit() {
    if (!editingRowId) return
    setRefData((prev) =>
      prev.map((r) =>
        r.id === editingRowId
          ? {
              ...r,
              precoM2Medio: editValues.precoM2Medio,
              precoM2Min: editValues.precoM2Min,
              precoM2Max: editValues.precoM2Max,
              ultimaAtualizacao: new Date().toISOString().slice(0, 10),
            }
          : r,
      ),
    )
    setEditingRowId(null)
    toast.success('Dados de referência atualizados.')
  }

  /* ---------------------------------------------------------------- */
  /*  Confidence badge                                                 */
  /* ---------------------------------------------------------------- */

  const confidenceConfig = {
    alta: { label: 'Alta', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40' },
    media: { label: 'Média', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    baixa: { label: 'Baixa', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40' },
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Precificação
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimativa de valor para imóveis
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: Form */}
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Dados do Imóvel
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Bairro */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="mr-1 inline h-4 w-4" />
                Bairro
              </label>
              <select
                value={form.bairro}
                onChange={(e) => updateForm('bairro', e.target.value as Bairro)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Selecione...</option>
                {(Object.keys(bairroLabels) as Bairro[]).map((b) => (
                  <option key={b} value={b}>{bairroLabels[b]}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Building2 className="mr-1 inline h-4 w-4" />
                Tipo do Imóvel
              </label>
              <select
                value={form.tipo}
                onChange={(e) => updateForm('tipo', e.target.value as TipoImovel)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Selecione...</option>
                {(Object.keys(tipoLabels) as TipoImovel[]).map((t) => (
                  <option key={t} value={t}>{tipoLabels[t]}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Área Construída (m²)
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
                Suítes
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
                Idade do Imóvel (anos)
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
              Características Extras
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
                    {form.extras.includes(extra) && <Check className="h-3 w-3" />}
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
        </div>

        {/* RIGHT: Results */}
        <div className="space-y-4">
          {!resultado ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                  Preencha os dados e clique em "Calcular Estimativa"
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
                    Confiança: {confidenceConfig[resultado.confidence].label}
                  </span>
                </div>

                {/* Range */}
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(resultado.minValue)} — {formatCurrency(resultado.maxValue)}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valor médio</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(resultado.avgValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Preço/m²</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(resultado.pricePerM2)}/m²
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Imóveis similares</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {resultado.similarCount} no bairro
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
                    label="Preço/m² médio do bairro"
                    value={`${formatCurrency(resultado.adjustments.base)}/m²`}
                    isBase
                  />
                  <AdjustmentRow label="Quartos" value={formatPercent(resultado.adjustments.quartos)} factor={resultado.adjustments.quartos} />
                  <AdjustmentRow label="Suítes" value={formatPercent(resultado.adjustments.suites)} factor={resultado.adjustments.suites} />
                  <AdjustmentRow label="Vagas" value={formatPercent(resultado.adjustments.vagas)} factor={resultado.adjustments.vagas} />
                  <AdjustmentRow label="Idade" value={formatPercent(resultado.adjustments.idade)} factor={resultado.adjustments.idade} />
                  <AdjustmentRow label="Extras" value={formatPercent(resultado.adjustments.extras)} factor={resultado.adjustments.extras} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={usarValorMedio}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Usar valor médio no cadastro
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={exportarRelatorio}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar
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
            Dados de Referência por Bairro
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Bairro', 'Tipo', 'Preço/m² Médio', 'Preço/m² Mín', 'Preço/m² Máx', 'Última Atualização', 'Ações'].map(
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
                {refData.map((row) => {
                  const isEditing = editingRowId === row.id
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
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
                              onChange={(e) => setEditValues((v) => ({ ...v, precoM2Medio: Number(e.target.value) }))}
                              className="w-24 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-sm text-gray-900 outline-none dark:border-blue-600 dark:bg-blue-900/30 dark:text-gray-100"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={editValues.precoM2Min}
                              onChange={(e) => setEditValues((v) => ({ ...v, precoM2Min: Number(e.target.value) }))}
                              className="w-24 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-sm text-gray-900 outline-none dark:border-blue-600 dark:bg-blue-900/30 dark:text-gray-100"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={editValues.precoM2Max}
                              onChange={(e) => setEditValues((v) => ({ ...v, precoM2Max: Number(e.target.value) }))}
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
                            {formatCurrency(row.precoM2Min)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {formatCurrency(row.precoM2Max)}
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
                              className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"
                              title="Salvar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
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
              </tbody>
            </table>
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
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${isBase ? 'text-gray-900 dark:text-gray-100' : textColor}`}>
        {value}
      </span>
    </div>
  )
}
