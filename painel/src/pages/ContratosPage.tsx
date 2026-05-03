import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileSignature, Loader2, Pencil, Trash2, Eye, Upload, Send, FileCheck2, Download, Award, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ContratoLocacao } from '@/lib/contratos'
import {
  STATUS_LABEL,
  STATUS_COR,
  TIPO_LABEL,
  fmtData,
} from '@/lib/contratos'
import { mergeTemplate } from '@/lib/contratoMerge'
import { printContratoFromMd } from '@/lib/contratoPrint'

interface Row extends ContratoLocacao {
  imoveis?: { codigo?: string | null; titulo?: string | null } | null
  locatario_nome?: string | null
  total_signatarios?: number
  total_assinados?: number
}

const ContratosPage = () => {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  async function handleSyncStatus(row: Row) {
    if (!(row as any).zapsign_doc_id) {
      toast.info('Contrato ainda não foi enviado pra ZapSign')
      return
    }
    setSyncingId(row.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`
      const res = await fetch(`${SUPA_FN}/zapsign-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ contrato_id: row.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success(`${data.assinados}/${data.total} assinaram · status: ${data.status}`)
      await load()
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || ''))
    } finally {
      setSyncingId(null)
    }
  }

  async function handleUploadPdf(row: Row, file: File) {
    setUploadingId(row.id)
    try {
      const path = `${row.id}.pdf`
      const { error: upErr } = await supabase.storage
        .from('contratos-pdf')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('contratos-pdf').getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`
      const { error: updErr } = await supabase
        .from('contratos_locacao')
        .update({ pdf_url: publicUrl })
        .eq('id', row.id)
      if (updErr) throw updErr
      toast.success('PDF anexado ao contrato')
      await load()
    } catch (e: any) {
      toast.error('Erro ao anexar: ' + (e.message || ''))
    } finally {
      setUploadingId(null)
    }
  }

  async function handleGerarOriginal(row: Row) {
    try {
      // Busca dados completos do contrato (partes + imóvel)
      const [{ data: c }, { data: ps }, { data: modeloPadrao }] = await Promise.all([
        supabase.from('contratos_locacao').select('*, imoveis(*)').eq('id', row.id).single(),
        supabase.from('contratos_partes').select('*').eq('contrato_id', row.id).order('ordem'),
        supabase.from('contratos_modelos').select('conteudo').eq('tipo', row.tipo).eq('padrao', true).eq('ativo', true).limit(1).maybeSingle(),
      ])
      if (!c) { toast.error('Contrato não encontrado'); return }

      let md: string | null = (c as any).modelo_id
        ? (await supabase.from('contratos_modelos').select('conteudo').eq('id', (c as any).modelo_id).single()).data?.conteudo
        : null
      md = md || (modeloPadrao?.conteudo as string | undefined) || null

      if (!md) {
        // Fallback: tentar template estático do tipo
        const { TEMPLATE_MAP } = await import('@/lib/templates')
        md = (TEMPLATE_MAP as any)[row.tipo] || null
      }

      if (!md) { toast.error('Modelo não encontrado pra esse tipo'); return }

      const merged = mergeTemplate(md, {
        contrato: c as any,
        partes: (ps || []) as any,
        imovel: (c as any).imoveis as any,
      })
      printContratoFromMd(merged, row.numero)
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || ''))
    }
  }

  async function handleEnviarZapSign(row: Row) {
    if (!row.pdf_url) {
      toast.error('Anexe o PDF do contrato antes de enviar')
      return
    }
    setSendingId(row.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`
      const res = await fetch(`${SUPA_FN}/zapsign-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ contrato_id: row.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success(`Enviado pra ${data.signers?.length || 0} signatário(s)`)
      await load()
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || ''))
    } finally {
      setSendingId(null)
    }
  }

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contratos_locacao')
      .select(`
        id, numero, tipo, status, valor_aluguel, data_inicio, data_fim, dia_vencimento,
        taxa_admin_pct, garantia_tipo, indice_reajuste, created_at, pdf_url, pdf_signed_url, zapsign_doc_id,
        imoveis(codigo, titulo),
        contratos_partes(nome, papel, zapsign_signed_at)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar contratos: ' + error.message)
      setLoading(false)
      return
    }

    const mapped: Row[] = (data || []).map((r: any) => {
      const partes = (r.contratos_partes || []) as Array<{ papel: string; zapsign_signed_at: string | null; nome: string }>
      const locatario = partes.find((p) => p.papel === 'locatario')
      const signatarios = partes.filter((p) => p.papel !== 'testemunha')
      const assinados = signatarios.filter((p) => p.zapsign_signed_at).length
      return {
        ...r,
        locatario_nome: locatario?.nome || null,
        total_signatarios: signatarios.length,
        total_assinados: assinados,
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
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Vigência</th>
                <th className="px-4 py-3 text-center font-medium">Assinaturas</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => {
                const total = r.total_signatarios || 0
                const ass = r.total_assinados || 0
                const pct = total > 0 ? (ass / total) * 100 : 0
                return (
                <tr key={r.id}
                    onClick={() => navigate(`/painel/contratos/${r.id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-mono text-xs text-moradda-blue-700 dark:text-moradda-blue-300">{r.numero}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{TIPO_LABEL[r.tipo]}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {r.data_inicio ? `${fmtData(r.data_inicio)} → ${fmtData(r.data_fim)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-semibold ${
                        ass === 0 ? 'text-gray-500' :
                        ass < total ? 'text-amber-700 dark:text-amber-400' :
                        'text-green-700 dark:text-green-400'
                      }`}>
                        {ass}/{total}
                      </span>
                      {total > 0 && (
                        <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ass === 0 ? 'bg-gray-300' :
                              ass < total ? 'bg-amber-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/painel/contratos/${r.id}`}
                        title="Ver / editar"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <Eye size={15} />
                      </Link>

                      {/* Gerar documento original (mesmo do botão "Gerar PDF" do editor) */}
                      <button
                        onClick={() => handleGerarOriginal(r)}
                        title="Gerar documento original (PDF do template)"
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <Download size={15} />
                      </button>

                      {/* Baixar documento assinado */}
                      <a
                        href={r.pdf_signed_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { if (!r.pdf_signed_url) { e.preventDefault(); toast.info('Documento ainda não foi assinado por todos') } }}
                        title={r.pdf_signed_url ? 'Baixar documento assinado' : 'Documento assinado (após assinaturas)'}
                        className={`rounded-lg p-2 ${r.pdf_signed_url
                          ? 'text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                          : 'text-gray-300 cursor-not-allowed dark:text-gray-600'}`}
                      >
                        <Award size={15} />
                      </a>

                      {/* Anexar PDF */}
                      <label
                        title={r.pdf_url ? 'Substituir PDF anexado' : 'Anexar PDF do contrato'}
                        className={`rounded-lg p-2 cursor-pointer ${r.pdf_url
                          ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                      >
                        {uploadingId === r.id ? <Loader2 size={15} className="animate-spin" />
                          : r.pdf_url ? <FileCheck2 size={15} />
                          : <Upload size={15} />}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUploadPdf(r, f)
                            e.target.value = ''
                          }}
                        />
                      </label>

                      {/* Enviar pra ZapSign */}
                      <button
                        disabled={!r.pdf_url || sendingId === r.id}
                        onClick={() => handleEnviarZapSign(r)}
                        title={r.pdf_url ? 'Enviar pra ZapSign' : 'Anexe um PDF antes'}
                        className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed dark:text-amber-400 dark:hover:bg-amber-900/20"
                      >
                        {sendingId === r.id ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      </button>

                      {/* Sincronizar status do ZapSign */}
                      <button
                        disabled={!(r as any).zapsign_doc_id || syncingId === r.id}
                        onClick={() => handleSyncStatus(r)}
                        title={(r as any).zapsign_doc_id ? 'Atualizar status (busca na ZapSign)' : 'Envie pra ZapSign primeiro'}
                        className="rounded-lg p-2 text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed dark:text-purple-400 dark:hover:bg-purple-900/20"
                      >
                        {syncingId === r.id ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                      </button>

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
              )})}
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
