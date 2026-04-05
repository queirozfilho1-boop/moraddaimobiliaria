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
  ClipboardCheck,
  Eye,
  Pause,
  Play,
  Archive,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
type ImovelStatus =
  | 'rascunho'
  | 'enviado_revisao'
  | 'em_correcao'
  | 'aprovado'
  | 'publicado'
  | 'pausado'
  | 'reprovado'
  | 'vendido'
  | 'alugado'
  | 'arquivado'
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
  enviado_revisao: {
    label: 'Enviado p/ Revisão',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
  em_correcao: {
    label: 'Em Correção',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-700 dark:text-orange-300',
  },
  aprovado: {
    label: 'Aprovado',
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-700 dark:text-teal-300',
  },
  publicado: {
    label: 'Publicado',
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
  },
  pausado: {
    label: 'Pausado',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  reprovado: {
    label: 'Reprovado',
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-300',
  },
  vendido: {
    label: 'Vendido',
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  alugado: {
    label: 'Alugado',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  arquivado: {
    label: 'Arquivado',
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-500 dark:text-gray-400',
  },
  inativo: {
    label: 'Inativo',
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-500 dark:text-gray-400',
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
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'gestor'

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
    if (isAdmin) return imoveis
    return imoveis.filter((i) => i.corretor_id === profile?.id)
  }, [isAdmin, profile?.id, imoveis])

  // Count pending reviews (for admins)
  const pendentesRevisao = useMemo(() => {
    return baseList.filter((i) => i.status === 'enviado_revisao').length
  }, [baseList])

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

  async function handleQuickAction(imovelId: string, action: 'publicar' | 'pausar' | 'despausar' | 'arquivar') {
    const statusMap = {
      publicar: 'publicado',
      pausar: 'pausado',
      despausar: 'publicado',
      arquivar: 'arquivado',
    }
    try {
      const { error } = await supabase
        .from('imoveis')
        .update({ status: statusMap[action] })
        .eq('id', imovelId)

      if (error) throw error

      if (action === 'pausar' || action === 'despausar') {
        // Create review record for pause/unpause
        await supabase.from('imoveis_revisoes').insert({
          imovel_id: imovelId,
          revisor_id: profile?.id,
          acao: action === 'pausar' ? 'pausado' : 'despausado',
          observacoes: action === 'pausar' ? 'Imóvel pausado' : 'Imóvel despausado',
        })
      }

      const labels = { publicar: 'publicado', pausar: 'pausado', despausar: 'despausado', arquivar: 'arquivado' }
      toast.success(`Imóvel ${labels[action]} com sucesso!`)
      await fetchImoveis()
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'))
    }
  }

  // ── Status badge ──
  function StatusBadge({ status }: { status: ImovelStatus }) {
    const cfg = statusConfig[status] || statusConfig.rascunho
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
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
          <Link
            to={`/painel/imoveis/${imovel.id}`}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-moradda-blue-700 transition hover:bg-moradda-blue-50 dark:text-moradda-blue-300 dark:hover:bg-moradda-blue-900/30"
          >
            <Pencil size={14} />
            Editar
          </Link>
          {isAdmin && imovel.status === 'enviado_revisao' && (
            <Link
              to={`/painel/imoveis/${imovel.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-900/30"
            >
              <ClipboardCheck size={14} />
              Revisar
            </Link>
          )}
          {isAdmin && imovel.status === 'aprovado' && (
            <button
              onClick={() => handleQuickAction(imovel.id, 'publicar')}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/30"
            >
              <Eye size={14} />
              Publicar
            </button>
          )}
          {isAdmin && imovel.status === 'publicado' && (
            <button
              onClick={() => handleQuickAction(imovel.id, 'pausar')}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-yellow-700 transition hover:bg-yellow-50 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
            >
              <Pause size={14} />
              Pausar
            </button>
          )}
          {isAdmin && imovel.status === 'pausado' && (
            <button
              onClick={() => handleQuickAction(imovel.id, 'despausar')}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/30"
            >
              <Play size={14} />
              Despausar
            </button>
          )}
          {isAdmin && (
            <>
              {!['arquivado', 'inativo'].includes(imovel.status) && (
                <button
                  onClick={() => handleQuickAction(imovel.id, 'arquivar')}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <Archive size={14} />
                  Arquivar
                </button>
              )}
              <button
                onClick={() => setDeleteTarget(imovel)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </>
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

      {/* Pending reviews badge (admin only) */}
      {isAdmin && pendentesRevisao > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <ClipboardCheck size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {pendentesRevisao} {pendentesRevisao === 1 ? 'imóvel pendente' : 'imóveis pendentes'} de revisão
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Clique no botão abaixo para filtrar apenas os imóveis aguardando revisão
            </p>
          </div>
          <button
            onClick={() => {
              setStatusFilter('enviado_revisao')
              setPage(1)
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Ver Pendentes
          </button>
        </div>
      )}

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
            <option value="enviado_revisao">Enviado p/ Revisão</option>
            <option value="em_correcao">Em Correção</option>
            <option value="aprovado">Aprovado</option>
            <option value="publicado">Publicado</option>
            <option value="pausado">Pausado</option>
            <option value="reprovado">Reprovado</option>
            <option value="vendido">Vendido</option>
            <option value="alugado">Alugado</option>
            <option value="arquivado">Arquivado</option>
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
                      {isAdmin && imovel.status === 'enviado_revisao' && (
                        <Link
                          to={`/painel/imoveis/${imovel.id}`}
                          className="rounded-lg p-2 text-teal-500 transition hover:bg-teal-50 hover:text-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20 dark:hover:text-teal-300"
                          title="Revisar"
                        >
                          <ClipboardCheck size={16} />
                        </Link>
                      )}
                      {isAdmin && imovel.status === 'aprovado' && (
                        <button
                          onClick={() => handleQuickAction(imovel.id, 'publicar')}
                          className="rounded-lg p-2 text-green-500 transition hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                          title="Publicar"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {isAdmin && imovel.status === 'publicado' && (
                        <button
                          onClick={() => handleQuickAction(imovel.id, 'pausar')}
                          className="rounded-lg p-2 text-yellow-500 transition hover:bg-yellow-50 hover:text-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300"
                          title="Pausar"
                        >
                          <Pause size={16} />
                        </button>
                      )}
                      {isAdmin && imovel.status === 'pausado' && (
                        <button
                          onClick={() => handleQuickAction(imovel.id, 'despausar')}
                          className="rounded-lg p-2 text-green-500 transition hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                          title="Despausar"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      {isAdmin && !['arquivado', 'inativo'].includes(imovel.status) && (
                        <button
                          onClick={() => handleQuickAction(imovel.id, 'arquivar')}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title="Arquivar"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      {isAdmin && (
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
