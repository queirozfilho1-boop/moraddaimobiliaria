import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, FileSignature, Loader2, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ContratoLocacao } from '@/lib/contratos'
import {
  STATUS_LABEL,
  STATUS_COR,
  TIPO_LABEL,
  fmtData,
  fmtMoeda,
} from '@/lib/contratos'

interface Row extends ContratoLocacao {
  imoveis?: { codigo?: string | null; titulo?: string | null } | null
  locatario_nome?: string | null
}

const ContratosPage = () => {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contratos_locacao')
      .select(`
        id, numero, tipo, status, valor_aluguel, data_inicio, data_fim, dia_vencimento,
        taxa_admin_pct, garantia_tipo, indice_reajuste, created_at,
        imoveis(codigo, titulo),
        contratos_partes(nome, papel)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar contratos: ' + error.message)
      setLoading(false)
      return
    }

    const mapped: Row[] = (data || []).map((r: any) => {
      const locatario = (r.contratos_partes || []).find((p: any) => p.papel === 'locatario')
      return {
        ...r,
        locatario_nome: locatario?.nome || null,
      }
    })
    setRows(mapped)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('contratos_locacao').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Contrato removido')
    setDeleteTarget(null)
    load()
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (search) {
        const s = search.toLowerCase()
        const blob = `${r.numero} ${r.imoveis?.codigo || ''} ${r.imoveis?.titulo || ''} ${r.locatario_nome || ''}`.toLowerCase()
        if (!blob.includes(s)) return false
      }
      return true
    })
  }, [rows, search, statusFilter])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Locações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Contratos de locação ativos, rascunhos e histórico.</p>
        </div>
        <Link
          to="/painel/contratos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
        >
          <Plus size={16} />
          Novo Contrato
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, código do imóvel ou locatário..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <FileSignature size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">
            {rows.length === 0 ? 'Nenhum contrato cadastrado' : 'Nenhum contrato encontrado'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {rows.length === 0 ? 'Crie seu primeiro contrato de locação.' : 'Ajuste os filtros pra encontrar.'}
          </p>
          {rows.length === 0 && (
            <Link
              to="/painel/contratos/novo"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
            >
              <Plus size={16} />
              Criar Contrato
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Número</th>
                <th className="px-4 py-3 text-left font-medium">Imóvel</th>
                <th className="px-4 py-3 text-left font-medium">Locatário</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Aluguel</th>
                <th className="px-4 py-3 text-left font-medium">Vigência</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-mono text-xs text-moradda-blue-700 dark:text-moradda-blue-300">{r.numero}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <p className="font-medium">{r.imoveis?.codigo || '—'}</p>
                    <p className="text-xs text-gray-500">{r.imoveis?.titulo || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.locatario_nome || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{TIPO_LABEL[r.tipo]}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">{fmtMoeda(r.valor_aluguel)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {fmtData(r.data_inicio)} → {fmtData(r.data_fim)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/painel/contratos/${r.id}`}
                        title="Ver / editar"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/painel/contratos/${r.id}`}
                        title="Editar"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        title="Excluir"
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Excluir contrato</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir o contrato <strong>{deleteTarget.numero}</strong>?
              Todos os dados (partes, eventos, aditivos) serão removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContratosPage
