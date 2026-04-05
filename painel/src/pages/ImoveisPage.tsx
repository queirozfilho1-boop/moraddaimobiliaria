import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
type ImovelStatus =
  | 'rascunho'
  | 'em_revisao'
  | 'publicado'
  | 'vendido'
  | 'alugado'
  | 'inativo'

type ImovelTipo =
  | 'casa'
  | 'apartamento'
  | 'terreno'
  | 'comercial'
  | 'rural'
  | 'cobertura'
  | 'kitnet'
  | 'sobrado'

interface Imovel {
  id: string
  codigo: string
  titulo: string
  tipo: ImovelTipo
  bairro: string
  preco: number
  status: ImovelStatus
  corretor_nome: string
  corretor_id: string
  foto_url: string | null
}

// ── Status badge config ────────────────────────────────────────────────────
const statusConfig: Record<
  ImovelStatus,
  { label: string; bg: string; text: string }
> = {
  rascunho: {
    label: 'Rascunho',
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
  },
  em_revisao: {
    label: 'Em Revisão',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  publicado: {
    label: 'Publicado',
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
  },
  vendido: {
    label: 'Vendido',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
  alugado: {
    label: 'Alugado',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  inativo: {
    label: 'Inativo',
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-300',
  },
}

const tipoLabels: Record<ImovelTipo, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
  rural: 'Rural',
  cobertura: 'Cobertura',
  kitnet: 'Kitnet',
  sobrado: 'Sobrado',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ImoveisPage() {
  const { profile } = useAuth()
  const isSuperadmin = profile?.role === 'superadmin'

  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ImovelStatus | ''>('')
  const [tipoFilter, setTipoFilter] = useState<ImovelTipo | ''>('')
  const [deleteTarget, setDeleteTarget] = useState<Imovel | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)

  const perPage = 10

  const fetchImoveis = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('id, codigo, slug, titulo, tipo, preco, status, corretor_id, bairros(nome), users_profiles!corretor_id(nome)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped: Imovel[] = (data || []).map((row: any) => ({
        id: row.id,
        codigo: row.codigo || '',
        titulo: row.titulo || '',
        tipo: row.tipo as ImovelTipo,
        bairro: row.bairros?.nome || '',
        preco: row.preco || 0,
        status: row.status as ImovelStatus,
        corretor_nome: row.users_profiles?.nome || '',
        corretor_id: row.corretor_id || '',
        foto_url: null,
      }))

      setImoveis(mapped)
    } catch (err: any) {
      toast.error('Erro ao carregar imóveis: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImoveis()
  }, [fetchImoveis])

  // For corretor role, filter to only their own properties
  const baseList = useMemo(() => {
    if (isSuperadmin) return imoveis
    return imoveis.filter((i) => i.corretor_id === profile?.id)
  }, [isSuperadmin, profile?.id, imoveis])

  const filtered = useMemo(() => {
    let list = baseList
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.titulo.toLowerCase().includes(q) ||
          i.codigo.toLowerCase().includes(q) ||
          i.bairro.toLowerCase().includes(q),
      )
    }
    if (statusFilter) list = list.filter((i) => i.status === statusFilter)
    if (tipoFilter) list = list.filter((i) => i.tipo === tipoFilter)
    return list
  }, [baseList, search, statusFilter, tipoFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', deleteTarget.id)

      if (error) throw error

      toast.success('Imóvel excluído com sucesso!')
      setDeleteTarget(null)
      await fetchImoveis()
    } catch (err: any) {
      toast.error('Erro ao excluir imóvel: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setDeleting(false)
    }
  }

  // ── Status badge ──
  function StatusBadge({ status }: { status: ImovelStatus }) {
    const cfg = statusConfig[status]
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
      >
        {cfg.label}
      </span>
    )
  }

  // ── Property card (mobile) ──
  function PropertyCard({ imovel }: { imovel: Imovel }) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            {imovel.foto_url ? (
              <img
                src={imovel.foto_url}
                alt={imovel.titulo}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <Building2 size={24} className="text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {imovel.codigo}
              </span>
              <StatusBadge status={imovel.status} />
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
              {imovel.titulo}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tipoLabels[imovel.tipo]} &middot; {imovel.bairro}
            </p>
            <p className="mt-1 text-sm font-bold text-moradda-blue-700 dark:text-moradda-blue-300">
              {formatBRL(imovel.preco)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {imovel.corretor_nome}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
          <Link
            to={`/painel/imoveis/${imovel.id}`}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-moradda-blue-700 transition hover:bg-moradda-blue-50 dark:text-moradda-blue-300 dark:hover:bg-moradda-blue-900/30"
          >
            <Pencil size={14} />
            Editar
          </Link>
          {isSuperadmin && (
            <button
              onClick={() => setDeleteTarget(imovel)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-moradda-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Imóveis
        </h1>
        <Link
          to="/painel/imoveis/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-gold-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moradda-gold-600"
        >
          <Plus size={18} />
          Novo Imóvel
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por título, código ou bairro..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 transition focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ImovelStatus | '')
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="em_revisao">Em Revisão</option>
            <option value="publicado">Publicado</option>
            <option value="vendido">Vendido</option>
            <option value="alugado">Alugado</option>
            <option value="inativo">Inativo</option>
          </select>
          {/* Tipo filter */}
          <select
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value as ImovelTipo | '')
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="">Todos os tipos</option>
            {(Object.keys(tipoLabels) as ImovelTipo[]).map((t) => (
              <option key={t} value={t}>
                {tipoLabels[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} {filtered.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
      </p>

      {/* Mobile cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {paginated.map((imovel) => (
          <PropertyCard key={imovel.id} imovel={imovel} />
        ))}
        {paginated.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Nenhum imóvel encontrado.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Foto
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Código
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Título
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Tipo
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Bairro
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Preço
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Corretor
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginated.map((imovel) => (
                <tr
                  key={imovel.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                      {imovel.foto_url ? (
                        <img
                          src={imovel.foto_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 size={18} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {imovel.codigo}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                    {imovel.titulo}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                    {tipoLabels[imovel.tipo]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                    {imovel.bairro}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
                    {formatBRL(imovel.preco)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={imovel.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                    {imovel.corretor_nome}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/painel/imoveis/${imovel.id}`}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-moradda-blue-400"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Link>
                      {isSuperadmin && (
                        <button
                          onClick={() => setDeleteTarget(imovel)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Nenhum imóvel encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Excluir imóvel
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir o imóvel{' '}
              <strong>{deleteTarget.codigo}</strong> —{' '}
              <em>{deleteTarget.titulo}</em>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
