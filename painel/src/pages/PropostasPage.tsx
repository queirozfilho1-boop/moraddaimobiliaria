import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, ArrowLeft, Save, Loader2, Trash2, Eye,
  Check, X, MessageSquareReply, Trophy, Handshake, Download,
  Building2, User, DollarSign, Activity, FileText, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { fmtMoeda, fmtData } from '@/lib/contratos'
import type { PropostaStatus } from '@/lib/vendas'
import { PROPOSTA_STATUS_LABEL, PROPOSTA_STATUS_COR } from '@/lib/vendas'
import BuscarCliente, { type Cliente } from '@/components/BuscarCliente'
import { printProposta } from '@/lib/propostaPrint'

interface Proposta {
  id: string
  numero: string
  imovel_id: string
  cliente_id?: string | null
  lead_id?: string | null
  visita_id?: string | null
  comprador_nome: string
  comprador_cpf_cnpj?: string | null
  comprador_email?: string | null
  comprador_telefone?: string | null
  valor: number
  forma_pagamento?: string | null
  condicoes?: string | null
  prazo_resposta?: string | null
  status: PropostaStatus
  contraproposta_valor?: number | null
  contraproposta_obs?: string | null
  observacoes?: string | null
  imoveis?: { codigo?: string; titulo?: string } | null
  created_at: string
}

// =====================================================================
// Lista
// =====================================================================

export const PropostasListPage = () => {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<Proposta | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [contraTarget, setContraTarget] = useState<Proposta | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('propostas')
      .select('*, imoveis(codigo, titulo)')
      .order('created_at', { ascending: false })
    if (error) toast.error('Erro: ' + error.message)
    setRows((data || []) as Proposta[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function mudarStatus(p: Proposta, novo: PropostaStatus, contra?: { valor: number; obs: string }) {
    const patch: any = { status: novo }
    if (contra) {
      patch.contraproposta_valor = contra.valor
      patch.contraproposta_obs = contra.obs
    }
    const { error } = await supabase.from('propostas').update(patch).eq('id', p.id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success(`Proposta marcada como ${PROPOSTA_STATUS_LABEL[novo]}`)
    load()
  }

  async function virarVenda(p: Proposta) {
    if (p.status !== 'aceita') { toast.error('Apenas propostas aceitas podem virar venda'); return }
    if (!confirm(`Criar venda a partir desta proposta?`)) return
    const { data: numData } = await supabase.rpc('proximo_numero_venda')
    const numero = (numData as string) || `V-${new Date().getFullYear()}/000001`
    const { data, error } = await supabase.from('vendas').insert({
      numero,
      proposta_id: p.id,
      imovel_id: p.imovel_id,
      comprador_nome: p.comprador_nome,
      comprador_cpf_cnpj: p.comprador_cpf_cnpj,
      comprador_email: p.comprador_email,
      comprador_telefone: p.comprador_telefone,
      valor_venda: p.valor,
      data_proposta: p.created_at?.split('T')[0],
      status: 'em_negociacao',
    }).select().single()
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Venda criada · ' + numero)
    navigate(`/painel/vendas/${data.id}`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('propostas').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Proposta removida')
    setDeleteTarget(null)
    load()
  }

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const blob = `${r.numero} ${r.comprador_nome} ${r.imoveis?.codigo || ''} ${r.imoveis?.titulo || ''}`.toLowerCase()
      if (!blob.includes(s)) return false
    }
    return true
  }), [rows, search, statusFilter])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Propostas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ofertas dos compradores · aceite, recusa, contraproposta e conversão em venda.
          </p>
        </div>
        <Link
          to="/painel/propostas/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
        >
          <Plus size={16} />
          Nova Proposta
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
            placeholder="Buscar por número, código do imóvel ou comprador..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Todos os status</option>
          {Object.entries(PROPOSTA_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <Handshake size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">
            {rows.length === 0 ? 'Nenhuma proposta cadastrada' : 'Nenhuma proposta encontrada'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {rows.length === 0 ? 'Crie sua primeira proposta a partir de uma visita ou diretamente.' : 'Ajuste os filtros pra encontrar.'}
          </p>
          {rows.length === 0 && (
            <Link
              to="/painel/propostas/novo"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
            >
              <Plus size={16} />
              Criar Proposta
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
                <th className="px-4 py-3 text-left font-medium">Comprador</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/painel/propostas/${r.id}`)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-moradda-blue-700 dark:text-moradda-blue-300">
                    {r.numero}
                    {r.prazo_resposta && (
                      <p className="mt-0.5 text-[10px] font-normal text-gray-500 dark:text-gray-400">
                        Resp. até {fmtData(r.prazo_resposta)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{r.imoveis?.codigo || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{r.imoveis?.titulo || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.comprador_nome}</p>
                    {r.comprador_cpf_cnpj && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.comprador_cpf_cnpj}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">{fmtMoeda(r.valor)}</p>
                    {r.contraproposta_valor && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        Contra: {fmtMoeda(r.contraproposta_valor)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PROPOSTA_STATUS_COR[r.status]}`}>
                      {PROPOSTA_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/painel/propostas/${r.id}`}
                        title="Ver / editar"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <Eye size={15} />
                      </Link>

                      {r.status === 'feita' && (
                        <>
                          <button
                            onClick={() => mudarStatus(r, 'aceita')}
                            title="Aceitar"
                            className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => mudarStatus(r, 'recusada')}
                            title="Recusar"
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <X size={15} />
                          </button>
                          <button
                            onClick={() => setContraTarget(r)}
                            title="Contraproposta"
                            className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                          >
                            <MessageSquareReply size={15} />
                          </button>
                        </>
                      )}

                      {r.status === 'aceita' && (
                        <button
                          onClick={() => virarVenda(r)}
                          title="Virar venda"
                          className="rounded-lg bg-purple-50 p-2 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400"
                        >
                          <Trophy size={15} />
                        </button>
                      )}

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
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Excluir proposta</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir a proposta <strong>{deleteTarget.numero}</strong>?
              Esta ação não pode ser desfeita.
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

      {/* Modal — Contraproposta */}
      {contraTarget && (
        <ContrapropostaModal
          proposta={contraTarget}
          onClose={() => setContraTarget(null)}
          onConfirm={async (valor, obs) => {
            await mudarStatus(contraTarget, 'contraproposta', { valor, obs })
            setContraTarget(null)
          }}
        />
      )}
    </div>
  )
}

// =====================================================================
// Modal de Contraproposta
// =====================================================================

interface ContrapropostaModalProps {
  proposta: Proposta
  onClose: () => void
  onConfirm: (valor: number, obs: string) => Promise<void>
}

function ContrapropostaModal({ proposta, onClose, onConfirm }: ContrapropostaModalProps) {
  const [valor, setValor] = useState<number>(proposta.valor || 0)
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)

  async function confirm() {
    if (!valor || valor <= 0) { toast.error('Defina o valor da contraproposta'); return }
    setSaving(true)
    try { await onConfirm(valor, obs) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Registrar contraproposta</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Proposta <span className="font-mono">{proposta.numero}</span> · Valor original: {fmtMoeda(proposta.valor)}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Valor da contraproposta (R$)
            </label>
            <input
              type="number"
              step="0.01"
              autoFocus
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none"
              value={valor || ''}
              onChange={(e) => setValor(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Observações
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none"
              placeholder="Ex.: aceito desde que inclua armários e estacionamento extra"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Confirmar contraproposta
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// Editor
// =====================================================================

interface ImovelLite { id: string; codigo?: string | null; titulo?: string | null }
interface LeadLite { id: string; nome?: string | null; status?: string | null }
interface VisitaLite {
  id: string
  cliente_id?: string | null
  lead_id?: string | null
  imovel_id?: string | null
  cliente_nome?: string | null
  cliente_telefone?: string | null
  cliente_email?: string | null
  data_hora?: string | null
}

export const PropostaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [p, setP] = useState<Partial<Proposta>>({ status: 'feita' })
  const [imoveis, setImoveis] = useState<ImovelLite[]>([])
  const [leads, setLeads] = useState<LeadLite[]>([])
  const [visitas, setVisitas] = useState<VisitaLite[]>([])
  const [origemOpen, setOrigemOpen] = useState(false)

  // Carrega imóveis
  useEffect(() => {
    supabase
      .from('imoveis')
      .select('id, codigo, titulo')
      .order('codigo')
      .then(({ data }) => setImoveis((data || []) as ImovelLite[]))
  }, [])

  // Carrega leads e visitas (pra origem)
  useEffect(() => {
    supabase
      .from('leads')
      .select('id, nome, status')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setLeads((data || []) as LeadLite[]))
    supabase
      .from('visitas')
      .select('id, cliente_id, lead_id, imovel_id, cliente_nome, cliente_telefone, cliente_email, data_hora')
      .order('data_hora', { ascending: false })
      .limit(200)
      .then(({ data }) => setVisitas((data || []) as VisitaLite[]))
  }, [])

  // Carrega proposta existente
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.from('propostas').select('*').eq('id', id).single()
      if (error || !data) { toast.error('Proposta não encontrada'); navigate('/painel/propostas'); return }
      setP(data as any)
      setLoading(false)
    })()
  }, [id, isNew, navigate])

  // Pré-popula a partir da querystring (vindo de uma visita)
  useEffect(() => {
    if (!isNew) return
    const visitaId = searchParams.get('visita_id')
    const imovelIdQS = searchParams.get('imovel_id')
    const clienteIdQS = searchParams.get('cliente_id')

    if (!visitaId && !imovelIdQS && !clienteIdQS) return

    ;(async () => {
      const updates: Partial<Proposta> = {}
      if (imovelIdQS) updates.imovel_id = imovelIdQS

      if (visitaId) {
        const { data: v } = await supabase
          .from('visitas')
          .select('id, cliente_id, lead_id, imovel_id, cliente_nome, cliente_telefone, cliente_email')
          .eq('id', visitaId)
          .single()
        if (v) {
          updates.visita_id = v.id
          if (v.lead_id) updates.lead_id = v.lead_id
          if (!updates.imovel_id && v.imovel_id) updates.imovel_id = v.imovel_id
          if (v.cliente_id) updates.cliente_id = v.cliente_id
          if (v.cliente_nome) updates.comprador_nome = v.cliente_nome
          if (v.cliente_telefone) updates.comprador_telefone = v.cliente_telefone
          if (v.cliente_email) updates.comprador_email = v.cliente_email
        }
      }

      if (clienteIdQS && !updates.cliente_id) {
        const { data: c } = await supabase.from('clientes').select('*').eq('id', clienteIdQS).single()
        if (c) {
          updates.cliente_id = c.id
          updates.comprador_nome = c.nome || ''
          updates.comprador_cpf_cnpj = c.cpf_cnpj || null
          updates.comprador_email = c.email || null
          updates.comprador_telefone = c.telefone || c.whatsapp || null
        }
      }

      if (Object.keys(updates).length > 0) {
        setP((prev) => ({ ...prev, ...updates }))
        setOrigemOpen(true)
      }
    })()
  }, [isNew, searchParams])

  function set<K extends keyof Proposta>(k: K, v: any) {
    setP((prev) => ({ ...prev, [k]: v }))
  }

  function aplicarCliente(c: Cliente | null) {
    if (!c) {
      setP((prev) => ({ ...prev, cliente_id: null }))
      return
    }
    setP((prev) => ({
      ...prev,
      cliente_id: c.id,
      comprador_nome: c.nome || prev.comprador_nome || '',
      comprador_cpf_cnpj: c.cpf_cnpj || prev.comprador_cpf_cnpj || null,
      comprador_email: c.email || prev.comprador_email || null,
      comprador_telefone: c.telefone || c.whatsapp || prev.comprador_telefone || null,
    }))
  }

  async function gerarPdf() {
    if (!p.imovel_id) { toast.error('Selecione o imóvel antes de gerar o PDF'); return }
    if (!p.comprador_nome) { toast.error('Informe o comprador antes de gerar o PDF'); return }
    if (!p.valor || p.valor <= 0) { toast.error('Informe o valor antes de gerar o PDF'); return }
    try {
      const { data: im } = await supabase
        .from('imoveis')
        .select('codigo, titulo, endereco, numero, complemento, cidade, estado, cep, matricula, cartorio, bairros(nome)')
        .eq('id', p.imovel_id)
        .single()
      const imovel = (im || {}) as any
      const bairro_nome = imovel.bairros?.nome || null
      const compradorEndereco = (p as any).cliente_id ? (await supabase.from('clientes').select('endereco, cidade, estado').eq('id', (p as any).cliente_id).maybeSingle()).data : null
      printProposta({
        numero: p.numero || 'P-XXXX/XXXXXX',
        created_at: p.created_at,
        imovel: {
          codigo: imovel.codigo,
          titulo: imovel.titulo,
          endereco: imovel.endereco,
          numero: imovel.numero,
          complemento: imovel.complemento,
          bairro_nome,
          cidade: imovel.cidade,
          estado: imovel.estado,
          cep: imovel.cep,
          matricula: imovel.matricula,
          cartorio: imovel.cartorio,
        },
        comprador: {
          nome: p.comprador_nome,
          cpf_cnpj: p.comprador_cpf_cnpj,
          email: p.comprador_email,
          telefone: p.comprador_telefone,
          endereco: compradorEndereco?.endereco,
          cidade: compradorEndereco?.cidade,
          estado: compradorEndereco?.estado,
        },
        valor: p.valor || 0,
        forma_pagamento: p.forma_pagamento,
        condicoes: p.condicoes,
        prazo_resposta: p.prazo_resposta,
        observacoes: p.observacoes,
        contraproposta_valor: p.contraproposta_valor,
        contraproposta_obs: p.contraproposta_obs,
      })
    } catch (e: any) {
      toast.error('Erro ao gerar PDF: ' + (e.message || ''))
    }
  }

  async function save() {
    if (!p.imovel_id) { toast.error('Selecione o imóvel'); return }
    if (!p.comprador_nome || !p.comprador_nome.trim()) { toast.error('Informe o comprador'); return }
    if (!p.valor || p.valor <= 0) { toast.error('Informe o valor da proposta'); return }

    // Sanitiza '' → null em FKs/uuids
    const sanitize = (obj: any) => {
      const out: any = {}
      for (const [k, v] of Object.entries(obj)) out[k] = v === '' ? null : v
      return out
    }

    setSaving(true)
    try {
      if (isNew) {
        const { data: numData } = await supabase.rpc('proximo_numero_proposta')
        const numero = (numData as string) || `P-${new Date().getFullYear()}/000001`
        const payload = sanitize({
          ...p,
          numero,
          criado_por: profile?.id,
          corretor_id: (p as any).corretor_id || profile?.id,
        })
        const { data, error } = await supabase.from('propostas').insert(payload).select().single()
        if (error) throw error
        toast.success('Proposta criada · ' + numero)
        navigate(`/painel/propostas/${data.id}`, { replace: true })
      } else {
        const { error } = await supabase.from('propostas').update(sanitize(p)).eq('id', id)
        if (error) throw error
        toast.success('Proposta salva')
      }
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/propostas" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isNew ? 'Nova Proposta' : `Proposta ${p.numero || '—'}`}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {p.status && (
                <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PROPOSTA_STATUS_COR[p.status]}`}>
                  {PROPOSTA_STATUS_LABEL[p.status]}
                </span>
              )}
              {isNew ? 'Preencha os dados da oferta do comprador.' : 'Edite, acompanhe e converta em venda quando aceita.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={gerarPdf}
              title="Abrir versão para impressão / salvar como PDF"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              <Download size={15} />
              Gerar PDF
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Imóvel */}
      <Section icon={<Building2 size={16} />} title="Imóvel">
        <div>
          <label className={labelCls}>Imóvel</label>
          <select className={inputCls} value={p.imovel_id || ''} onChange={(e) => set('imovel_id', e.target.value)}>
            <option value="">Selecione um imóvel...</option>
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* Comprador */}
      <Section icon={<User size={16} />} title="Comprador">
        <div className="mb-3">
          <label className={labelCls}>Buscar cliente do banco mestre</label>
          <BuscarCliente
            value={p.cliente_id ? { id: p.cliente_id, nome: p.comprador_nome || '', cpf_cnpj: p.comprador_cpf_cnpj || null } : null}
            onSelect={aplicarCliente}
            papel="comprador"
            tipoSugerido="pf"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome do comprador</label>
            <input className={inputCls} value={p.comprador_nome || ''} onChange={(e) => set('comprador_nome', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>CPF/CNPJ</label>
            <input className={inputCls} value={p.comprador_cpf_cnpj || ''} onChange={(e) => set('comprador_cpf_cnpj', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input className={inputCls} value={p.comprador_telefone || ''} onChange={(e) => set('comprador_telefone', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>E-mail</label>
            <input type="email" className={inputCls} value={p.comprador_email || ''} onChange={(e) => set('comprador_email', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Origem (recolhível) */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setOrigemOpen((s) => !s)}
          className="flex w-full items-center justify-between p-6"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
            <span className="text-moradda-blue-500"><Activity size={16} /></span>
            Origem (lead/visita)
            {(p.lead_id || p.visita_id) && (
              <span className="ml-2 inline-flex rounded-full bg-moradda-blue-50 px-2 py-0.5 text-[10px] font-medium text-moradda-blue-700 dark:bg-moradda-blue-900/30 dark:text-moradda-blue-300">
                vinculado
              </span>
            )}
          </h2>
          {origemOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>
        {origemOpen && (
          <div className="border-t border-gray-100 px-6 pb-6 pt-4 dark:border-gray-700">
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Vínculos pra rastreabilidade do funil. Pré-populados quando a proposta é criada a partir de uma visita.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Lead de origem</label>
                <select className={inputCls} value={p.lead_id || ''} onChange={(e) => set('lead_id', e.target.value || null)}>
                  <option value="">—</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.nome || '(sem nome)'}{l.status ? ` · ${l.status}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Visita relacionada</label>
                <select className={inputCls} value={p.visita_id || ''} onChange={(e) => set('visita_id', e.target.value || null)}>
                  <option value="">—</option>
                  {visitas.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.cliente_nome || '(sem nome)'}
                      {v.data_hora ? ` · ${new Date(v.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proposta */}
      <Section icon={<DollarSign size={16} />} title="Proposta">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Valor proposto (R$)</label>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={p.valor || ''}
              onChange={(e) => set('valor', Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Prazo pra resposta</label>
            <input type="date" className={inputCls} value={p.prazo_resposta || ''} onChange={(e) => set('prazo_resposta', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Forma de pagamento</label>
            <input
              className={inputCls}
              placeholder="Ex.: 30% à vista + financiamento Caixa"
              value={p.forma_pagamento || ''}
              onChange={(e) => set('forma_pagamento', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Condições</label>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Móveis inclusos, prazo de entrega, etc."
              value={p.condicoes || ''}
              onChange={(e) => set('condicoes', e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Status & Resposta */}
      <Section icon={<Activity size={16} />} title="Status & Resposta">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Status</label>
            <select
              className={inputCls}
              value={p.status || 'feita'}
              onChange={(e) => set('status', e.target.value as PropostaStatus)}
            >
              {Object.entries(PROPOSTA_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {p.status === 'contraproposta' && (
            <>
              <div>
                <label className={labelCls}>Valor da contraproposta (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputCls}
                  value={p.contraproposta_valor || ''}
                  onChange={(e) => set('contraproposta_valor', Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Observações da contraproposta</label>
                <textarea
                  rows={3}
                  className={inputCls}
                  value={p.contraproposta_obs || ''}
                  onChange={(e) => set('contraproposta_obs', e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </Section>

      {/* Observações */}
      <Section icon={<FileText size={16} />} title="Observações">
        <textarea
          rows={4}
          className={inputCls}
          placeholder="Notas internas, contexto adicional, riscos..."
          value={p.observacoes || ''}
          onChange={(e) => set('observacoes', e.target.value)}
        />
      </Section>
    </div>
  )
}

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
      <span className="text-moradda-blue-500">{icon}</span>
      {title}
    </h2>
    {children}
  </div>
)
