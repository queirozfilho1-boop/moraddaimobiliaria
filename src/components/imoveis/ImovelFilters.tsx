import { Search, SlidersHorizontal, X } from 'lucide-react'
import { TIPOS_IMOVEL, FINALIDADES, FAIXAS_PRECO, QUARTOS_OPTIONS } from '@/lib/constants'
import type { FiltrosBusca } from '@/types'
import { useState } from 'react'

interface ImovelFiltersProps {
  filtros: FiltrosBusca
  onFiltrosChange: (filtros: FiltrosBusca) => void
  bairros?: { id: string; nome: string }[]
  totalResultados?: number
}

export default function ImovelFilters({ filtros, onFiltrosChange, bairros = [], totalResultados }: ImovelFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFiltro = (key: keyof FiltrosBusca, value: unknown) => {
    onFiltrosChange({ ...filtros, [key]: value || undefined, pagina: 1 })
  }

  const limparFiltros = () => {
    onFiltrosChange({ pagina: 1, por_pagina: 12 })
  }

  const temFiltrosAtivos = filtros.tipo || filtros.finalidade || filtros.bairro_id || filtros.preco_min || filtros.quartos_min || filtros.busca

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Search + main filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        {/* Search */}
        <div className="flex-1">
          <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Busque por título, bairro, código..."
              value={filtros.busca || ''}
              onChange={(e) => updateFiltro('busca', e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
            />
          </div>
        </div>

        {/* Tipo */}
        <div className="w-full lg:w-44">
          <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tipo
          </label>
          <select
            value={filtros.tipo || ''}
            onChange={(e) => updateFiltro('tipo', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_IMOVEL.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Finalidade */}
        <div className="w-full lg:w-40">
          <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
            Finalidade
          </label>
          <select
            value={filtros.finalidade || ''}
            onChange={(e) => updateFiltro('finalidade', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
          >
            <option value="">Todas</option>
            {FINALIDADES.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Bairro */}
        <div className="w-full lg:w-44">
          <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
            Bairro
          </label>
          <select
            value={filtros.bairro_id || ''}
            onChange={(e) => updateFiltro('bairro_id', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
          >
            <option value="">Todos os bairros</option>
            {bairros.map(b => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>

        {/* Toggle advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 rounded-xl border border-moradda-blue-200 px-4 py-3 font-body text-sm font-medium text-moradda-blue-600 transition-all hover:bg-moradda-blue-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Faixa de preço */}
          <div>
            <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
              Faixa de Preço
            </label>
            <select
              value={filtros.preco_min !== undefined && filtros.preco_max !== undefined
                ? `${filtros.preco_min}-${filtros.preco_max}`
                : ''}
              onChange={(e) => {
                if (!e.target.value) {
                  onFiltrosChange({ ...filtros, preco_min: undefined, preco_max: undefined, pagina: 1 })
                } else {
                  const [min, max] = e.target.value.split('-').map(Number)
                  onFiltrosChange({ ...filtros, preco_min: min, preco_max: max === Infinity ? undefined : max, pagina: 1 })
                }
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
            >
              <option value="">Qualquer preço</option>
              {FAIXAS_PRECO.map((f, i) => (
                <option key={i} value={`${f.min}-${f.max}`}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Quartos */}
          <div>
            <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quartos
            </label>
            <select
              value={filtros.quartos_min || ''}
              onChange={(e) => updateFiltro('quartos_min', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
            >
              <option value="">Qualquer</option>
              {QUARTOS_OPTIONS.map(q => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>

          {/* Área mínima */}
          <div>
            <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
              Área mínima (m²)
            </label>
            <input
              type="number"
              placeholder="Ex: 80"
              value={filtros.area_min || ''}
              onChange={(e) => updateFiltro('area_min', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
            />
          </div>

          {/* Ordenar */}
          <div>
            <label className="mb-1.5 block font-body text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ordenar por
            </label>
            <select
              value={filtros.ordenar || 'recentes'}
              onChange={(e) => updateFiltro('ordenar', e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
            >
              <option value="recentes">Mais recentes</option>
              <option value="preco_asc">Menor preço</option>
              <option value="preco_desc">Maior preço</option>
              <option value="relevancia">Relevância</option>
            </select>
          </div>
        </div>
      )}

      {/* Active filters bar */}
      {temFiltrosAtivos && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          {totalResultados !== undefined && (
            <span className="font-body text-sm text-gray-500">
              {totalResultados} {totalResultados === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </span>
          )}
          <button
            onClick={limparFiltros}
            className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 font-body text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  )
}
