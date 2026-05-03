import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Loader2, Trash2, Plus, Eye, Download, Send,
  ClipboardCheck, Search, Camera, Upload, MapPin, AlertTriangle,
  Building2, FileText, User, CheckCircle2, Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  type Vistoria, type VistoriaItem, type VistoriaStatus, type VistoriaTipo,
  type VistoriaItemEstado,
  COMODOS, ESTADOS, ITEMS_PADRAO, TIPO_LABEL, STATUS_LABEL, STATUS_COR, ESTADO_COR, ESTADO_LABEL,
  isAvariado,
} from '@/lib/vistorias'
import { printVistoria, gerarPdfBase64Vistoria, type VistoriaPdfData } from '@/lib/vistoriaPrint'
import { fmtData } from '@/lib/contratos'
import VistoriaFotosSection from '@/components/VistoriaFotosSection'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

// =====================================================================
// Lista
// =====================================================================

interface VistoriaRow extends Vistoria {
  imoveis?: { codigo?: string; titulo?: string } | null
  contratos_locacao?: { numero?: string } | null
  itens_count?: number
  avariados_count?: number
}

export const VistoriaListPage = () => {
  const navigate = useNavigate()
  const [rows, setRows] = useState<VistoriaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<VistoriaRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  // KPI: avariados no mês corrente
  const [avariadosMes, setAvariadosMes] = useState(0)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vistorias')
      .select('*, imoveis(codigo, titulo), contratos_locacao(numero)')
      .order('realizada_em', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) toast.error('Erro: ' + error.message)
    const list = (data || []) as VistoriaRow[]

    // Agrega contagem de itens e avariados por vistoria
    if (list.length > 0) {
      const ids = list.map((v) => v.id)
      const { data: its } = await supabase
        .from('vistorias_itens')
        .select('vistoria_id, estado')
        .in('vistoria_id', ids)
      const totals = new Map<string, { total: number; avar: number }>()
      for (const it of (its || []) as any[]) {
        const cur = totals.get(it.vistoria_id) || { total: 0, avar: 0 }
        cur.total++
        if (isAvariado(it.estado)) cur.avar++
        totals.set(it.vistoria_id, cur)
      }
      for (const r of list) {
        const t = totals.get(r.id)
        r.itens_count = t?.total || 0
        r.avariados_count = t?.avar || 0
      }
    }

    setRows(list)
    setLoading(false)

    // KPI: avariados no mês corrente
    const inicioMes = new Date()
    inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
    const fimMes = new Date(inicioMes)
    fimMes.setMonth(fimMes.getMonth() + 1)
    const idsMes = list
      .filter((r) => {
        const d = r.realizada_em || r.created_at
        if (!d) return false
        const dt = new Date(d)
        return dt >= inicioMes && dt < fimMes
      })
      .map((r) => r.id)
    if (idsMes.length > 0) {
      const { count } = await supabase
        .from('vistorias_itens')
        .select('id', { count: 'exact', head: true })
        .in('vistoria_id', idsMes)
        .eq('estado', 'avariado')
      setAvariadosMes(count || 0)
    } else {
      setAvariadosMes(0)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    // Apaga itens primeiro pra evitar FK
    await supabase.from('vistorias_itens').delete().eq('vistoria_id', deleteTarget.id)
    const { error } = await supabase.from('vistorias').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Vistoria removida')
    setDeleteTarget(null)
    load()
  }

  async function gerarPdfRapido(v: VistoriaRow) {
    setActing(v.id)
    try {
      const data = await carregarDadosPdf(v.id)
      if (!data) { toast.error('Não foi possível carregar dados'); return }
      printVistoria(data)
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    } finally {
      setActing(null)
    }
  }

  async function enviarAssinar(v: VistoriaRow) {
    setActing(v.id)
    try {
      const data = await carregarDadosPdf(v.id)
      if (!data) { toast.error('Não foi possível carregar dados'); return }
      let pdfBase64: string
      try {
        pdfBase64 = await gerarPdfBase64Vistoria(data)
      } catch (e: any) {
        toast.error('Erro ao gerar PDF: ' + (e.message || ''))
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/vistoria-zapsign-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ vistoria_id: v.id, pdf_base64: pdfBase64 }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`)
      toast.success(`Vistoria enviada pra ${j.signers?.length || 0} signatário(s) via ZapSign`)
      load()
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    } finally {
      setActing(null)
    }
  }

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    if (tipoFilter && r.tipo !== tipoFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const blob = `${r.imoveis?.codigo || ''} ${r.imoveis?.titulo || ''} ${r.contratos_locacao?.numero || ''} ${r.locatario_nome || ''}`.toLowerCase()
      if (!blob.includes(s)) return false
    }
    return true
  }), [rows, search, statusFilter, tipoFilter])

  const kpis = useMemo(() => {
    const total = rows.length
    const rascunho = rows.filter((r) => r.status === 'rascunho').length
    const aguardando = rows.filter((r) => r.status === 'aguardando_assinatura').length
    return { total, rascunho, aguardando, avariadosMes }
  }, [rows, avariadosMes])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vistorias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Entrada e saída · checklist por cômodo, fotos e ciclo com despesas.
          </p>
        </div>
        <Link
          to="/painel/vistorias/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
        >
          <Plus size={16} /> Nova Vistoria
        </Link>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total" value={kpis.total} color="blue" icon={<ClipboardCheck size={16} />} />
        <KpiCard label="Rascunho" value={kpis.rascunho} color="gray" icon={<FileText size={16} />} />
        <KpiCard label="Aguardando assinatura" value={kpis.aguardando} color="amber" icon={<Send size={16} />} />
        <KpiCard label="Itens avariados (mês)" value={kpis.avariadosMes} color="red" icon={<AlertTriangle size={16} />} />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por imóvel, contrato ou locatário..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <ClipboardCheck size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">
            {rows.length === 0 ? 'Nenhuma vistoria cadastrada' : 'Nenhuma vistoria encontrada'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {rows.length === 0 ? 'Crie a primeira vistoria de entrada ou saída.' : 'Ajuste os filtros pra encontrar.'}
          </p>
          {rows.length === 0 && (
            <Link
              to="/painel/vistorias/novo"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
            >
              <Plus size={16} /> Criar Vistoria
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Imóvel</th>
                <th className="px-4 py-3 text-left font-medium">Contrato</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-center font-medium">Itens</th>
                <th className="px-4 py-3 text-center font-medium">Avariados</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/painel/vistorias/${r.id}`)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{r.imoveis?.codigo || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{r.imoveis?.titulo || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {r.contratos_locacao?.numero ? (
                      <span className="font-mono text-moradda-blue-700 dark:text-moradda-blue-300">{r.contratos_locacao.numero}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
                      r.tipo === 'entrada'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>
                      {TIPO_LABEL[r.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                    {r.realizada_em ? fmtData(r.realizada_em) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                    {r.itens_count || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(r.avariados_count || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        <AlertTriangle size={10} /> {r.avariados_count}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/painel/vistorias/${r.id}`}
                        title="Ver / editar"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        onClick={() => gerarPdfRapido(r)}
                        disabled={acting === r.id}
                        title="Gerar PDF"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {acting === r.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                      </button>
                      <button
                        onClick={() => enviarAssinar(r)}
                        disabled={acting === r.id || r.status !== 'finalizada'}
                        title={r.status !== 'finalizada' ? 'Finalize a vistoria primeiro' : 'Enviar pra assinar (ZapSign)'}
                        className="rounded-lg p-2 text-amber-500 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-amber-900/20"
                      >
                        <Send size={15} />
                      </button>
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

      {/* Modal — Excluir */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Excluir vistoria</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir esta vistoria do imóvel{' '}
              <strong>{deleteTarget.imoveis?.codigo || '—'}</strong>?
              Esta ação não pode ser desfeita e irá remover também os itens vinculados.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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

const KpiCard = ({ label, value, color, icon }: { label: string; value: number; color: 'blue'|'gray'|'amber'|'red'; icon: React.ReactNode }) => {
  const colors: Record<string, string> = {
    blue:  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300',
    gray:  'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300',
    red:   'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</p>
        <span className="opacity-70">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}

// =====================================================================
// Loader compartilhado: monta VistoriaPdfData a partir de uma vistoria
// =====================================================================

async function carregarDadosPdf(vistoriaId: string): Promise<VistoriaPdfData | null> {
  const { data: v } = await supabase
    .from('vistorias')
    .select('*, imoveis(codigo, titulo, endereco, numero, complemento, cidade, estado, cep, matricula, bairros(nome)), contratos_locacao(numero)')
    .eq('id', vistoriaId)
    .single()
  if (!v) return null
  const { data: its } = await supabase
    .from('vistorias_itens')
    .select('*')
    .eq('vistoria_id', vistoriaId)
    .order('ordem', { ascending: true, nullsFirst: false })

  const im: any = v.imoveis || {}
  return {
    numero: `V-${vistoriaId.slice(0, 8).toUpperCase()}`,
    tipo: v.tipo,
    realizada_em: v.realizada_em,
    estado_geral: v.estado_geral,
    observacoes: v.observacoes,
    imovel: {
      codigo: im.codigo,
      titulo: im.titulo,
      endereco: im.endereco,
      numero: im.numero,
      complemento: im.complemento,
      bairro_nome: im.bairros?.nome || null,
      cidade: im.cidade,
      estado: im.estado,
      cep: im.cep,
      matricula: im.matricula,
    },
    locador: v.locador_nome ? { nome: v.locador_nome, cpf: v.locador_cpf } : null,
    locatario: v.locatario_nome ? { nome: v.locatario_nome, cpf: v.locatario_cpf } : null,
    contrato_numero: v.contratos_locacao?.numero || null,
    itens: ((its || []) as any[]).map((it) => ({
      comodo: it.comodo,
      item: it.item,
      estado: it.estado,
      observacoes: it.observacoes,
      fotos: Array.isArray(it.fotos) ? it.fotos : (it.fotos ? [] : []),
    })),
  }
}

// =====================================================================
// Editor
// =====================================================================

interface ImovelLite { id: string; codigo?: string | null; titulo?: string | null }
interface ContratoLite { id: string; numero: string; imovel_id: string; status: string }

interface CriarDespesaForm {
  itemIdx: number
  descricao: string
  valor: number
  abater_em: 'aluguel' | 'repasse' | 'nao_abater'
  quem_paga: 'locador' | 'locatario' | 'imobiliaria'
}

export const VistoriaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  const [v, setV] = useState<Partial<Vistoria>>({
    tipo: 'entrada',
    status: 'rascunho',
    realizada_em: new Date().toISOString().split('T')[0],
  })
  const [itens, setItens] = useState<VistoriaItem[]>([])
  const [imoveis, setImoveis] = useState<ImovelLite[]>([])
  const [contratos, setContratos] = useState<ContratoLite[]>([])
  const [despesaModal, setDespesaModal] = useState<CriarDespesaForm | null>(null)

  // Carrega imóveis
  useEffect(() => {
    supabase.from('imoveis').select('id, codigo, titulo').order('codigo').then(({ data }) => {
      setImoveis((data || []) as ImovelLite[])
    })
  }, [])

  // Carrega contratos (todos, vamos filtrar por imóvel)
  useEffect(() => {
    supabase.from('contratos_locacao').select('id, numero, imovel_id, status').order('created_at', { ascending: false }).then(({ data }) => {
      setContratos((data || []) as ContratoLite[])
    })
  }, [])

  // Carrega vistoria existente
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      setLoading(true)
      const [vist, its] = await Promise.all([
        supabase.from('vistorias').select('*').eq('id', id).single(),
        supabase.from('vistorias_itens').select('*').eq('vistoria_id', id).order('ordem', { ascending: true, nullsFirst: false }),
      ])
      if (vist.error || !vist.data) {
        toast.error('Vistoria não encontrada'); navigate('/painel/vistorias'); return
      }
      setV(vist.data as Vistoria)
      setItens(((its.data || []) as any[]).map((it) => ({
        ...it,
        fotos: Array.isArray(it.fotos) ? it.fotos : [],
      })))
      setLoading(false)
    })()
  }, [id, isNew, navigate])

  // Pré-popula via querystring
  useEffect(() => {
    if (!isNew) return
    const contratoId = searchParams.get('contrato_id')
    const imovelIdQS = searchParams.get('imovel_id')
    if (!contratoId && !imovelIdQS) return
    ;(async () => {
      const updates: Partial<Vistoria> = {}
      if (imovelIdQS) updates.imovel_id = imovelIdQS
      if (contratoId) {
        updates.contrato_id = contratoId
        // Busca contrato pra confirmar imóvel
        const { data: c } = await supabase
          .from('contratos_locacao')
          .select('id, imovel_id')
          .eq('id', contratoId)
          .maybeSingle()
        if (c?.imovel_id && !updates.imovel_id) updates.imovel_id = c.imovel_id

        // Auto-popula partes do contrato
        const { data: ps } = await supabase
          .from('contratos_partes')
          .select('papel, nome, cpf_cnpj')
          .eq('contrato_id', contratoId)
        for (const p of ((ps || []) as any[])) {
          if (p.papel === 'locador' && !updates.locador_nome) {
            updates.locador_nome = p.nome
            updates.locador_cpf = p.cpf_cnpj
          }
          if ((p.papel === 'locatario' || p.papel === 'hospede') && !updates.locatario_nome) {
            updates.locatario_nome = p.nome
            updates.locatario_cpf = p.cpf_cnpj
          }
        }
      }
      setV((prev) => ({ ...prev, ...updates }))
    })()
  }, [isNew, searchParams])

  // Quando seleciona contrato manualmente: auto-popula partes
  async function aoSelecionarContrato(contratoId: string | null) {
    setV((prev) => ({ ...prev, contrato_id: contratoId || null }))
    if (!contratoId) return
    const c = contratos.find((x) => x.id === contratoId)
    if (c?.imovel_id) {
      setV((prev) => ({ ...prev, contrato_id: contratoId, imovel_id: c.imovel_id }))
    }
    const { data: ps } = await supabase
      .from('contratos_partes')
      .select('papel, nome, cpf_cnpj')
      .eq('contrato_id', contratoId)
    setV((prev) => {
      const next = { ...prev, contrato_id: contratoId }
      for (const p of ((ps || []) as any[])) {
        if (p.papel === 'locador' && !next.locador_nome) {
          next.locador_nome = p.nome
          next.locador_cpf = p.cpf_cnpj
        }
        if ((p.papel === 'locatario' || p.papel === 'hospede') && !next.locatario_nome) {
          next.locatario_nome = p.nome
          next.locatario_cpf = p.cpf_cnpj
        }
      }
      return next
    })
  }

  function adicionarPadrao() {
    const novos: VistoriaItem[] = []
    for (const c of COMODOS.slice(0, 4)) {
      for (const it of ITEMS_PADRAO) {
        novos.push({ comodo: c, item: it, estado: 'bom', observacoes: '', fotos: [], ordem: novos.length })
      }
    }
    setItens(novos)
  }

  async function uploadFoto(idx: number, file: File) {
    const path = `vistorias/${v.id || 'temp'}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`
    const { error } = await supabase.storage.from('imoveis').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro upload: ' + error.message); return }
    const { data: pub } = supabase.storage.from('imoveis').getPublicUrl(path)
    setItens((p) => p.map((it, i) => i === idx
      ? { ...it, fotos: [...(it.fotos || []), pub.publicUrl] }
      : it
    ))
  }

  function removerFoto(idx: number, fotoIdx: number) {
    setItens((p) => p.map((it, i) => i === idx
      ? { ...it, fotos: (it.fotos || []).filter((_, fi) => fi !== fotoIdx) }
      : it
    ))
  }

  function capturarLocalizacao() {
    if (!navigator.geolocation) { toast.error('Geolocalização não suportada'); return }
    setActing('geo')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setV((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        toast.success('Localização capturada')
        setActing(null)
      },
      (err) => {
        toast.error('Erro: ' + err.message)
        setActing(null)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function save(novoStatus?: VistoriaStatus): Promise<string | null> {
    if (!v.imovel_id) { toast.error('Selecione o imóvel'); return null }
    setSaving(true)
    try {
      const sanitize = (obj: any) => {
        const out: any = {}
        for (const [k, val] of Object.entries(obj)) out[k] = val === '' ? null : val
        return out
      }

      let vid = v.id
      const payload = sanitize({
        contrato_id: v.contrato_id || null,
        imovel_id: v.imovel_id,
        tipo: v.tipo,
        status: novoStatus || v.status || 'rascunho',
        realizada_em: v.realizada_em || null,
        estado_geral: v.estado_geral || null,
        observacoes: v.observacoes || null,
        locador_nome: v.locador_nome || null,
        locador_cpf: v.locador_cpf || null,
        locatario_nome: v.locatario_nome || null,
        locatario_cpf: v.locatario_cpf || null,
        lat: v.lat ?? null,
        lng: v.lng ?? null,
        responsavel_id: v.responsavel_id || profile?.id || null,
        finalizada: (novoStatus || v.status) === 'finalizada' ? true : (v.finalizada ?? false),
      })
      if (!vid) {
        const { data, error } = await supabase.from('vistorias').insert(payload).select().single()
        if (error) throw error
        vid = data.id
        setV((prev) => ({ ...prev, id: vid, status: payload.status }))
      } else {
        const { error } = await supabase.from('vistorias').update(payload).eq('id', vid)
        if (error) throw error
        setV((prev) => ({ ...prev, status: payload.status }))
      }

      // Itens: usa upsert manual — preserva IDs existentes (necessário pra preservar despesa_id)
      // Estratégia: deleta itens removidos, atualiza existentes, insere novos.
      const { data: existentes } = await supabase
        .from('vistorias_itens')
        .select('id')
        .eq('vistoria_id', vid)
      const idsExistentes = new Set(((existentes || []) as any[]).map((x) => x.id))
      const idsAtuais = new Set(itens.filter((x) => x.id).map((x) => x.id as string))
      const aRemover = [...idsExistentes].filter((x) => !idsAtuais.has(x))
      if (aRemover.length > 0) {
        await supabase.from('vistorias_itens').delete().in('id', aRemover)
      }
      // Update + Insert
      for (let i = 0; i < itens.length; i++) {
        const it = itens[i]
        const row: any = {
          vistoria_id: vid,
          comodo: it.comodo,
          item: it.item,
          estado: it.estado,
          observacoes: it.observacoes || null,
          fotos: it.fotos || [],
          ordem: i,
          despesa_id: it.despesa_id || null,
        }
        if (it.id) {
          await supabase.from('vistorias_itens').update(row).eq('id', it.id)
        } else {
          const { data: ins } = await supabase.from('vistorias_itens').insert(row).select('id').single()
          if (ins?.id) itens[i].id = ins.id
        }
      }
      setItens([...itens])

      toast.success(novoStatus === 'finalizada' ? 'Vistoria finalizada' : 'Vistoria salva')
      if (isNew && vid) navigate(`/painel/vistorias/${vid}`, { replace: true })
      return vid || null
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || ''))
      return null
    } finally {
      setSaving(false)
    }
  }

  async function gerarPdf() {
    if (!v.id) { toast.error('Salve a vistoria antes'); return }
    if (!v.imovel_id) { toast.error('Selecione o imóvel'); return }
    try {
      const data = await carregarDadosPdf(v.id)
      if (!data) { toast.error('Erro ao montar dados'); return }
      printVistoria(data)
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    }
  }

  async function enviarAssinatura() {
    if (!v.id) { toast.error('Salve a vistoria antes'); return }
    if (v.status !== 'rascunho' && v.status !== 'finalizada') {
      toast.error('Vistoria já enviada'); return
    }
    if (itens.length === 0) { toast.error('Adicione itens antes de enviar'); return }
    setActing('zapsign')
    try {
      const data = await carregarDadosPdf(v.id)
      if (!data) { toast.error('Erro ao montar dados'); return }
      let pdfBase64: string
      try {
        pdfBase64 = await gerarPdfBase64Vistoria(data)
      } catch (e: any) {
        toast.error('Erro ao gerar PDF: ' + (e.message || ''))
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/vistoria-zapsign-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ vistoria_id: v.id, pdf_base64: pdfBase64 }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`)
      toast.success(`Enviado pra ${j.signers?.length || 0} signatário(s) via ZapSign`)
      // Recarrega
      const { data: updated } = await supabase.from('vistorias').select('*').eq('id', v.id).single()
      if (updated) setV(updated as Vistoria)
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    } finally {
      setActing(null)
    }
  }

  function abrirModalDespesa(itemIdx: number) {
    const it = itens[itemIdx]
    if (!it) return
    if (!v.contrato_id) {
      toast.error('Vincule um contrato pra criar despesa')
      return
    }
    if (it.despesa_id) {
      toast.info('Item já tem despesa vinculada'); return
    }
    const desc = `Vistoria ${v.tipo === 'entrada' ? 'entrada' : 'saída'} · ${it.comodo} · ${it.item} (${ESTADO_LABEL[it.estado] || it.estado})${it.observacoes ? ' — ' + it.observacoes : ''}`
    setDespesaModal({
      itemIdx,
      descricao: desc,
      valor: 0,
      abater_em: 'aluguel',
      // entrada → locador (proprietário absorve do imóvel novo); saída → locatário (devolveu danificado)
      quem_paga: v.tipo === 'entrada' ? 'locador' : 'locatario',
    })
  }

  async function confirmarDespesa() {
    if (!despesaModal) return
    if (!v.contrato_id) { toast.error('Sem contrato vinculado'); return }
    if (!despesaModal.valor || despesaModal.valor <= 0) { toast.error('Defina o valor'); return }
    if (!v.id) { toast.error('Salve a vistoria primeiro'); return }
    setActing('despesa')
    try {
      const { data: d, error } = await supabase.from('contratos_despesas').insert({
        contrato_id: v.contrato_id,
        tipo: 'manutencao',
        descricao: despesaModal.descricao,
        valor: despesaModal.valor,
        data_despesa: v.realizada_em || new Date().toISOString().split('T')[0],
        quem_paga: despesaModal.quem_paga,
        abater_em: despesaModal.abater_em,
        status: 'orcamento',
      }).select('id').single()
      if (error) throw error

      // Vincula item à despesa
      const item = itens[despesaModal.itemIdx]
      if (item.id) {
        await supabase.from('vistorias_itens').update({ despesa_id: d.id }).eq('id', item.id)
      }
      setItens((p) => p.map((it, i) => i === despesaModal.itemIdx ? { ...it, despesa_id: d.id } : it))
      toast.success('Despesa criada e vinculada ao item')
      setDespesaModal(null)
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    } finally {
      setActing(null)
    }
  }

  async function criarDespesasEmLote() {
    if (!v.contrato_id) { toast.error('Vincule um contrato pra criar despesas'); return }
    if (!v.id) { toast.error('Salve a vistoria antes'); return }
    const elegiveis = itens
      .map((it, idx) => ({ it, idx }))
      .filter(({ it }) => isAvariado(it.estado) && !it.despesa_id && it.id)
    if (elegiveis.length === 0) { toast.info('Nenhum item elegível'); return }
    setActing('lote')
    try {
      const inserts = elegiveis.map(({ it }) => ({
        contrato_id: v.contrato_id,
        tipo: 'manutencao' as const,
        descricao: `Vistoria ${v.tipo === 'entrada' ? 'entrada' : 'saída'} · ${it.comodo} · ${it.item} (${ESTADO_LABEL[it.estado] || it.estado})${it.observacoes ? ' — ' + it.observacoes : ''}`,
        valor: 0,
        data_despesa: v.realizada_em || new Date().toISOString().split('T')[0],
        quem_paga: (v.tipo === 'entrada' ? 'locador' : 'locatario') as 'locador' | 'locatario',
        abater_em: 'aluguel' as const,
        status: 'orcamento' as const,
      }))
      const { data: created, error } = await supabase
        .from('contratos_despesas')
        .insert(inserts)
        .select('id')
      if (error) throw error
      // Vincula
      for (let i = 0; i < elegiveis.length; i++) {
        const target = elegiveis[i]
        const desp = (created as any[])[i]
        if (target.it.id && desp?.id) {
          await supabase.from('vistorias_itens').update({ despesa_id: desp.id }).eq('id', target.it.id)
        }
      }
      // Atualiza state
      setItens((p) => p.map((it, idx) => {
        const found = elegiveis.findIndex((e) => e.idx === idx)
        if (found < 0) return it
        const desp = (created as any[])[found]
        return { ...it, despesa_id: desp?.id || it.despesa_id }
      }))
      toast.success(`${created?.length || 0} despesa(s) criada(s) — ajuste valores na seção Despesas do contrato`)
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  // Contratos relacionados ao imóvel selecionado (ativos primeiro)
  const contratosFiltrados = useMemo(() => {
    if (!v.imovel_id) return [] as ContratoLite[]
    return contratos
      .filter((c) => c.imovel_id === v.imovel_id)
      .sort((a, b) => {
        if (a.status === 'ativo' && b.status !== 'ativo') return -1
        if (a.status !== 'ativo' && b.status === 'ativo') return 1
        return a.numero.localeCompare(b.numero)
      })
  }, [contratos, v.imovel_id])

  const avariados = itens
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => isAvariado(it.estado))
  const semDespesa = avariados.filter(({ it }) => !it.despesa_id).length

  const podeEnviar = !isNew && v.status === 'rascunho' && itens.length > 0

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/vistorias" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isNew ? 'Nova Vistoria' : `Vistoria de ${v.tipo === 'entrada' ? 'Entrada' : 'Saída'}`}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {v.status && (
                <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[v.status]}`}>
                  {STATUS_LABEL[v.status]}
                </span>
              )}
              {isNew ? 'Cadastre o checklist e gere o laudo.' : 'Edite, gere PDF, finalize e envie pra assinatura.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={gerarPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              <Download size={15} /> Gerar PDF
            </button>
          )}
          {!isNew && (
            <button
              type="button"
              onClick={enviarAssinatura}
              disabled={!podeEnviar || acting === 'zapsign'}
              title={!podeEnviar ? 'Precisa estar em rascunho com pelo menos um item' : 'Enviar pra ZapSign'}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {acting === 'zapsign' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Enviar pra Assinar
            </button>
          )}
          <button
            onClick={() => save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-moradda-blue-300 bg-white px-4 py-2 text-sm font-medium text-moradda-blue-700 hover:bg-moradda-blue-50 disabled:opacity-50 dark:border-moradda-blue-700 dark:bg-gray-700 dark:text-moradda-blue-300"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Salvar
          </button>
          <button
            onClick={() => save('finalizada')}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle2 size={15} /> Finalizar
          </button>
        </div>
      </div>

      {/* Imóvel & Contrato */}
      <Section icon={<Building2 size={16} />} title="Imóvel & Contrato">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Imóvel *</label>
            <select
              className={inputCls}
              value={v.imovel_id || ''}
              onChange={(e) => {
                const imovel_id = e.target.value
                setV((prev) => ({ ...prev, imovel_id, contrato_id: null }))
              }}
            >
              <option value="">Selecione o imóvel...</option>
              {imoveis.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Contrato (opcional)</label>
            <select
              className={inputCls}
              value={v.contrato_id || ''}
              onChange={(e) => aoSelecionarContrato(e.target.value || null)}
              disabled={!v.imovel_id}
            >
              <option value="">— Sem contrato vinculado —</option>
              {contratosFiltrados.map((c) => (
                <option key={c.id} value={c.id}>{c.numero}{c.status === 'ativo' ? ' (ativo)' : ` · ${c.status}`}</option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-gray-500">
              Vincular contrato auto-popula locador e locatário. Sem contrato, preencha manualmente.
            </p>
          </div>
        </div>
      </Section>

      {/* Tipo & Estado geral */}
      <Section icon={<ClipboardCheck size={16} />} title="Tipo & Estado Geral">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={v.tipo || 'entrada'} onChange={(e) => setV({ ...v, tipo: e.target.value as VistoriaTipo })}>
              {Object.entries(TIPO_LABEL).map(([k, val]) => <option key={k} value={k}>{val}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Realizada em</label>
            <input type="date" className={inputCls} value={v.realizada_em || ''} onChange={(e) => setV({ ...v, realizada_em: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Estado geral</label>
            <select className={inputCls} value={v.estado_geral || ''} onChange={(e) => setV({ ...v, estado_geral: e.target.value })}>
              <option value="">—</option>
              {ESTADOS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Observações gerais</label>
            <textarea rows={2} className={inputCls} value={v.observacoes || ''} onChange={(e) => setV({ ...v, observacoes: e.target.value })} />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={capturarLocalizacao}
              disabled={acting === 'geo'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              {acting === 'geo' ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
              Capturar localização
            </button>
            {(v.lat != null && v.lng != null) && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {Number(v.lat).toFixed(5)}, {Number(v.lng).toFixed(5)}
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* Locador / Locatário (snapshot) */}
      <Section icon={<User size={16} />} title="Locador / Locatário (snapshot)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Locador</p>
            <div className="space-y-2">
              <div>
                <label className={labelCls}>Nome</label>
                <input className={inputCls} value={v.locador_nome || ''} onChange={(e) => setV({ ...v, locador_nome: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>CPF/CNPJ</label>
                <input className={inputCls} value={v.locador_cpf || ''} onChange={(e) => setV({ ...v, locador_cpf: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Locatário</p>
            <div className="space-y-2">
              <div>
                <label className={labelCls}>Nome</label>
                <input className={inputCls} value={v.locatario_nome || ''} onChange={(e) => setV({ ...v, locatario_nome: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>CPF/CNPJ</label>
                <input className={inputCls} value={v.locatario_cpf || ''} onChange={(e) => setV({ ...v, locatario_cpf: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Avariados detectados */}
      {avariados.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-900/10">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Avariados detectados ({avariados.length})
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  {semDespesa > 0
                    ? `${semDespesa} item(ns) ainda sem despesa vinculada.`
                    : 'Todos têm despesa vinculada.'}
                </p>
              </div>
            </div>
            {semDespesa > 0 && v.contrato_id && (
              <button
                onClick={criarDespesasEmLote}
                disabled={acting === 'lote'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {acting === 'lote' ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
                Criar despesas em lote
              </button>
            )}
          </div>
          <ul className="mt-3 space-y-1 text-xs text-amber-900 dark:text-amber-200">
            {avariados.map(({ it, idx }) => (
              <li key={idx} className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ESTADO_COR[it.estado]}`}>
                  {ESTADO_LABEL[it.estado]}
                </span>
                <span><strong>{it.comodo}</strong> · {it.item}</span>
                {it.despesa_id && <span className="text-green-700 dark:text-green-400 text-[10px]">✓ despesa</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Galeria de fotos da vistoria (gerais, não da checklist) */}
      {!isNew && id && <VistoriaFotosSection vistoriaId={id} />}

      {/* Checklist */}
      <Section icon={<ClipboardCheck size={16} />} title="Checklist por Cômodo" right={
        <div className="flex gap-2">
          {itens.length === 0 && (
            <button
              onClick={adicionarPadrao}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
            >
              <Plus size={12} /> Carregar padrão
            </button>
          )}
          <button
            onClick={() => setItens([...itens, { comodo: 'Sala', item: '', estado: 'bom', observacoes: '', fotos: [], ordem: itens.length }])}
            className="inline-flex items-center gap-1 rounded-lg bg-moradda-blue-500 px-3 py-1.5 text-xs text-white hover:bg-moradda-blue-600"
          >
            <Plus size={12} /> Item
          </button>
        </div>
      }>
        {itens.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Nenhum item. Use "Carregar padrão" pra começar com modelos prontos ou adicione um item.
          </p>
        ) : (
          <div className="space-y-2">
            {itens.map((it, idx) => {
              const avariadoOuRuim = isAvariado(it.estado)
              const temDespesa = !!it.despesa_id
              return (
                <div
                  key={it.id || idx}
                  className={`rounded-lg border p-3 ${
                    avariadoOuRuim
                      ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/30'
                  }`}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-start">
                    <select
                      className={`sm:col-span-2 ${inputCls}`}
                      value={it.comodo}
                      onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, comodo: e.target.value } : x))}
                    >
                      {COMODOS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      className={`sm:col-span-3 ${inputCls}`}
                      placeholder="Item"
                      value={it.item}
                      onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, item: e.target.value } : x))}
                    />
                    <select
                      className={`sm:col-span-2 ${inputCls}`}
                      value={it.estado}
                      onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, estado: e.target.value as VistoriaItemEstado } : x))}
                    >
                      {ESTADOS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                    <input
                      className={`sm:col-span-3 ${inputCls}`}
                      placeholder="Observações"
                      value={it.observacoes || ''}
                      onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, observacoes: e.target.value } : x))}
                    />
                    <div className="sm:col-span-2 flex items-center gap-1 flex-wrap">
                      <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" title="Adicionar foto">
                        <Upload size={11} className="inline" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            Array.from(e.target.files || []).forEach((f) => uploadFoto(idx, f))
                            e.target.value = ''
                          }}
                        />
                      </label>
                      {(it.fotos && it.fotos.length > 0) && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">
                          <Camera size={11} /> {it.fotos.length}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (temDespesa) { toast.error('Item com despesa vinculada não pode ser removido'); return }
                          setItens(itens.filter((_, i) => i !== idx))
                        }}
                        disabled={temDespesa}
                        title={temDespesa ? 'Item com despesa vinculada' : 'Remover'}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Botão criar despesa pra avariado/ruim */}
                  {avariadoOuRuim && v.contrato_id && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {temDespesa ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle2 size={10} /> Despesa vinculada
                        </span>
                      ) : (
                        <button
                          onClick={() => abrirModalDespesa(idx)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-600"
                        >
                          <Wrench size={10} /> Criar despesa
                        </button>
                      )}
                    </div>
                  )}

                  {/* Fotos */}
                  {(it.fotos && it.fotos.length > 0) && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {it.fotos.map((url, fi) => (
                        <div key={fi} className="relative shrink-0 group">
                          <img src={url} alt="" className="h-20 w-20 rounded object-cover" />
                          <button
                            onClick={() => removerFoto(idx, fi)}
                            className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition"
                            title="Remover foto"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Modal — Criar despesa */}
      {despesaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => acting !== 'despesa' && setDespesaModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Criar despesa</h3>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Descrição</label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={despesaModal.descricao}
                  onChange={(e) => setDespesaModal({ ...despesaModal, descricao: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  className={inputCls}
                  value={despesaModal.valor || ''}
                  onChange={(e) => setDespesaModal({ ...despesaModal, valor: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Quem paga</label>
                  <select
                    className={inputCls}
                    value={despesaModal.quem_paga}
                    onChange={(e) => setDespesaModal({ ...despesaModal, quem_paga: e.target.value as any })}
                  >
                    <option value="locador">Locador</option>
                    <option value="locatario">Locatário</option>
                    <option value="imobiliaria">Imobiliária</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Abater em</label>
                  <select
                    className={inputCls}
                    value={despesaModal.abater_em}
                    onChange={(e) => setDespesaModal({ ...despesaModal, abater_em: e.target.value as any })}
                  >
                    <option value="aluguel">Aluguel</option>
                    <option value="repasse">Repasse</option>
                    <option value="nao_abater">Não abater</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDespesaModal(null)}
                disabled={acting === 'despesa'}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDespesa}
                disabled={acting === 'despesa'}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {acting === 'despesa' ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                Criar despesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Section = ({ icon, title, children, right }: { icon: React.ReactNode; title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
        <span className="text-moradda-blue-500">{icon}</span>
        {title}
      </h2>
      {right}
    </div>
    {children}
  </div>
)
