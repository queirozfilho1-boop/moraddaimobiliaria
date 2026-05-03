import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Home, Search, Loader2, Calendar, AlertTriangle, CheckCircle2, DollarSign, TrendingUp,
  Wallet, FileText, MessageCircle, Plus, Download, MoreHorizontal, X,
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { fmtData, fmtMoeda } from '@/lib/contratos'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'

async function callEdge(path: string, body: any) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return { res, json: await res.json().catch(() => ({})) }
}

interface CobrancaSimples {
  id: string
  valor: number
  valor_total: number | null
  vencimento: string
  status: string
  pago_em: string | null
  asaas_invoice_url: string | null
  referencia_mes: string | null
}

interface LocacaoRow {
  id: string
  numero: string
  tipo: string
  status: string
  data_inicio: string | null
  data_fim: string | null
  valor_aluguel: number
  valor_condominio: number | null
  valor_iptu: number | null
  taxa_admin_pct: number | null
  taxa_admin_minima: number | null
  dia_vencimento: number | null
  cobranca_modo: string | null
  imovel_titulo: string | null
  imovel_codigo: string | null
  locatario_nome: string | null
  locatario_telefone: string | null
  locador_nome: string | null
  cobrancas: CobrancaSimples[]
  cobrancas_pendentes: number
  cobrancas_pagas: number
  cobrancas_vencidas: number
  total_recebido_mes: number
  proximo_vencimento: string | null
  proxima_cobranca_pendente: CobrancaSimples | null
  a_repassar: number
}

const TIPO_LOCACAO_LABEL: Record<string, string> = {
  locacao_residencial: 'Residencial',
  locacao_comercial: 'Comercial',
  temporada: 'Temporada',
}

const mesAtualStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function LocacoesPage() {
  const [rows, setRows] = useState<LocacaoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [mesCompetencia, setMesCompetencia] = useState<string>(mesAtualStr())
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [showGerarModal, setShowGerarModal] = useState<LocacaoRow | null>(null)
  const [showPagaModal, setShowPagaModal] = useState<{ row: LocacaoRow; cob: CobrancaSimples } | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contratos_locacao')
      .select(`
        id, numero, tipo, status, data_inicio, data_fim, valor_aluguel,
        valor_condominio, valor_iptu, taxa_admin_pct, taxa_admin_minima, dia_vencimento, cobranca_modo,
        imoveis(codigo, titulo),
        contratos_partes(nome, papel, telefone),
        contratos_cobrancas(id, valor, valor_total, vencimento, status, pago_em, asaas_invoice_url, referencia_mes),
        contratos_repasses(id, cobranca_id)
      `)
      .in('tipo', ['locacao_residencial', 'locacao_comercial', 'temporada'])
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar locações: ' + error.message)
      setLoading(false)
      return
    }

    const hoje = new Date()
    const hojeIso = hoje.toISOString().slice(0, 10)
    const [anoFiltro, mesFiltro] = mesCompetencia.split('-')
    const inicioMes = `${anoFiltro}-${mesFiltro}-01`
    const fimMesDate = new Date(Number(anoFiltro), Number(mesFiltro), 0)
    const fimMes = `${anoFiltro}-${mesFiltro}-${String(fimMesDate.getDate()).padStart(2, '0')}`

    const inadimplentesParaUpdate: string[] = []

    const mapped: LocacaoRow[] = (data || []).map((r: any) => {
      const partes = (r.contratos_partes || []) as Array<{ papel: string; nome: string; telefone?: string }>
      const cobrancas = (r.contratos_cobrancas || []) as CobrancaSimples[]
      const repassesIds = new Set((r.contratos_repasses || []).map((rp: any) => rp.cobranca_id).filter(Boolean))
      const locatario = partes.find((p) => p.papel === 'locatario' || p.papel === 'hospede')
      const locador = partes.find((p) => p.papel === 'locador')
      const pagas = cobrancas.filter((c) => c.status === 'paga' || c.status === 'pago' || c.status === 'RECEIVED' || c.status === 'CONFIRMED')
      const pendentes = cobrancas.filter((c) => (c.status === 'pendente' || c.status === 'PENDING') && c.vencimento >= hojeIso)
      const vencidas = cobrancas.filter((c) => (c.status === 'pendente' || c.status === 'PENDING' || c.status === 'OVERDUE') && c.vencimento < hojeIso)
      const recebidoMes = pagas
        .filter((c) => c.pago_em && c.pago_em >= inicioMes && c.pago_em <= fimMes)
        .reduce((s, c) => s + Number(c.valor_total ?? c.valor ?? 0), 0)
      const todasPendentesOrdenadas = [...pendentes, ...vencidas].sort((a, b) => a.vencimento.localeCompare(b.vencimento))
      const proxVenc = todasPendentesOrdenadas[0]?.vencimento || null
      const proxCob = todasPendentesOrdenadas[0] || null

      // A repassar = cobranças pagas sem repasse vinculado
      const taxaPct = Number(r.taxa_admin_pct || 10) / 100
      const taxaMin = Number(r.taxa_admin_minima || 0)
      const aRepassar = pagas
        .filter((c) => !repassesIds.has(c.id))
        .reduce((s, c) => {
          const valBruto = Number(c.valor_total ?? c.valor ?? 0)
          const taxa = Math.max(Number(r.valor_aluguel || 0) * taxaPct, taxaMin)
          return s + Math.max(0, valBruto - taxa)
        }, 0)

      // Auto-marcar inadimplente
      if (r.status === 'ativo' && vencidas.some((c) => {
        const v = new Date(c.vencimento)
        const diff = (hoje.getTime() - v.getTime()) / (1000 * 60 * 60 * 24)
        return diff > 1
      })) {
        inadimplentesParaUpdate.push(r.id)
      }

      return {
        id: r.id,
        numero: r.numero,
        tipo: r.tipo,
        status: r.status,
        data_inicio: r.data_inicio,
        data_fim: r.data_fim,
        valor_aluguel: Number(r.valor_aluguel || 0),
        valor_condominio: r.valor_condominio ? Number(r.valor_condominio) : null,
        valor_iptu: r.valor_iptu ? Number(r.valor_iptu) : null,
        taxa_admin_pct: r.taxa_admin_pct ? Number(r.taxa_admin_pct) : null,
        taxa_admin_minima: r.taxa_admin_minima ? Number(r.taxa_admin_minima) : null,
        dia_vencimento: r.dia_vencimento,
        cobranca_modo: r.cobranca_modo,
        imovel_codigo: r.imoveis?.codigo || null,
        imovel_titulo: r.imoveis?.titulo || null,
        locatario_nome: locatario?.nome || null,
        locatario_telefone: locatario?.telefone || null,
        locador_nome: locador?.nome || null,
        cobrancas,
        cobrancas_pendentes: pendentes.length,
        cobrancas_pagas: pagas.length,
        cobrancas_vencidas: vencidas.length,
        total_recebido_mes: recebidoMes,
        proximo_vencimento: proxVenc,
        proxima_cobranca_pendente: proxCob,
        a_repassar: aRepassar,
      }
    })

    setRows(mapped)
    setLoading(false)

    // Auto-update inadimplentes (background)
    if (inadimplentesParaUpdate.length > 0) {
      supabase
        .from('contratos_locacao')
        .update({ status: 'inadimplente' })
        .in('id', inadimplentesParaUpdate)
        .eq('status', 'ativo')
        .then(({ error: errUpd }) => {
          if (!errUpd) {
            setRows((prev) => prev.map((r) => inadimplentesParaUpdate.includes(r.id) ? { ...r, status: 'inadimplente' } : r))
          }
        })
    }
  }

  useEffect(() => { load() }, [mesCompetencia])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const blob = `${r.numero} ${r.imovel_codigo || ''} ${r.imovel_titulo || ''} ${r.locatario_nome || ''}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [rows, search, statusFilter])

  const stats = useMemo(() => {
    const ativos = rows.filter((r) => r.status === 'ativo' || r.status === 'inadimplente').length
    const inadimplentes = rows.filter((r) => r.cobrancas_vencidas > 0).length
    const recebidoMes = rows.reduce((s, r) => s + r.total_recebido_mes, 0)
    const aluguelMensalTotal = rows.filter((r) => r.status === 'ativo' || r.status === 'inadimplente').reduce((s, r) => s + r.valor_aluguel, 0)
    const aRepassar = rows.reduce((s, r) => s + r.a_repassar, 0)
    return { ativos, inadimplentes, recebidoMes, aluguelMensalTotal, aRepassar }
  }, [rows])

  function exportarExcel() {
    const sheetData = filtered.map((r) => ({
      'Contrato': r.numero,
      'Tipo': TIPO_LOCACAO_LABEL[r.tipo] || r.tipo,
      'Status': r.status,
      'Imóvel': r.imovel_codigo || '',
      'Título': r.imovel_titulo || '',
      'Locador': r.locador_nome || '',
      'Locatário': r.locatario_nome || '',
      'Aluguel': r.valor_aluguel,
      'Condomínio': r.valor_condominio || 0,
      'IPTU': r.valor_iptu || 0,
      'Taxa adm %': r.taxa_admin_pct || 0,
      'Dia venc.': r.dia_vencimento || '',
      'Modo cobrança': r.cobranca_modo || '',
      'Próx. venc.': r.proximo_vencimento || '',
      'Recebido no mês': r.total_recebido_mes,
      'A repassar': r.a_repassar,
      'Cobranças pagas': r.cobrancas_pagas,
      'Cobranças pendentes': r.cobrancas_pendentes,
      'Cobranças vencidas': r.cobrancas_vencidas,
    }))
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Locações')
    XLSX.writeFile(wb, `locacoes-${mesCompetencia}.xlsx`)
    toast.success('Excel exportado')
  }

  function abrirWhatsAppCobranca(r: LocacaoRow) {
    const c = r.proxima_cobranca_pendente
    if (!c || !c.asaas_invoice_url) { toast.error('Sem cobrança pendente com link Asaas'); return }
    const tel = (r.locatario_telefone || '').replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá ${r.locatario_nome || ''}! Segue o link para pagamento do aluguel ` +
      `(vencimento ${fmtData(c.vencimento)}, valor ${fmtMoeda(Number(c.valor_total ?? c.valor))}):\n\n${c.asaas_invoice_url}\n\nMoradda Imobiliária`
    )
    window.open(`https://wa.me/${tel ? '55' + tel : ''}?text=${msg}`, '_blank')
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Locações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestão de aluguéis ativos: cobranças, repasses e vencimentos.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <Download size={14} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <KPI icon={<Home />} label="Locações ativas" value={String(stats.ativos)} color="blue" />
        <KPI icon={<DollarSign />} label="Aluguel total/mês" value={fmtMoeda(stats.aluguelMensalTotal)} color="emerald" />
        <KPI icon={<TrendingUp />} label="Recebido no mês" value={fmtMoeda(stats.recebidoMes)} color="green" />
        <KPI icon={<Wallet />} label="A repassar" value={fmtMoeda(stats.aRepassar)} color="amber" />
        <KPI icon={<AlertTriangle />} label="Inadimplentes" value={String(stats.inadimplentes)} color="red" />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, imóvel ou locatário..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="aguardando_assinatura">Aguardando assinatura</option>
          <option value="ativo">Ativo</option>
          <option value="inadimplente">Inadimplente</option>
          <option value="encerrado">Encerrado</option>
        </select>
        <input
          type="month"
          value={mesCompetencia}
          onChange={(e) => setMesCompetencia(e.target.value)}
          title="Mês de competência"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <Home size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">
            {rows.length === 0 ? 'Nenhuma locação' : 'Nenhuma locação encontrada'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {rows.length === 0 ? 'Crie um contrato de locação em Contratos.' : 'Ajuste os filtros pra encontrar.'}
          </p>
        </div>
      ) : (
        <div className="overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Contrato</th>
                <th className="px-4 py-3 text-left font-medium">Imóvel</th>
                <th className="px-4 py-3 text-left font-medium">Locatário</th>
                <th className="px-4 py-3 text-right font-medium">Aluguel</th>
                <th className="px-4 py-3 text-right font-medium">A repassar</th>
                <th className="px-4 py-3 text-center font-medium">Próx. vencimento</th>
                <th className="px-4 py-3 text-center font-medium">Cobranças</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => {
                const inadimplente = r.cobrancas_vencidas > 0 || r.status === 'inadimplente'
                return (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3">
                      <Link to={`/painel/contratos/${r.id}`} className="font-mono text-xs font-medium text-moradda-blue-600 hover:text-moradda-blue-800 dark:text-moradda-blue-300">
                        {r.numero}
                      </Link>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{TIPO_LOCACAO_LABEL[r.tipo] || r.tipo}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <p className="font-medium">{r.imovel_codigo || '—'}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{r.imovel_titulo || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.locatario_nome || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">{fmtMoeda(r.valor_aluguel)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'ativo' || r.status === 'inadimplente' ? (
                        <span className={`text-xs font-medium ${r.a_repassar > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                          {fmtMoeda(r.a_repassar)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {r.proximo_vencimento ? (
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <Calendar size={12} />
                          {fmtData(r.proximo_vencimento)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-xs">
                        {r.cobrancas_vencidas > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300" title={`${r.cobrancas_vencidas} vencidas`}>
                            <AlertTriangle size={10} />
                            {r.cobrancas_vencidas}
                          </span>
                        )}
                        {r.cobrancas_pagas > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300" title={`${r.cobrancas_pagas} pagas`}>
                            <CheckCircle2 size={10} />
                            {r.cobrancas_pagas}
                          </span>
                        )}
                        {r.cobrancas_pendentes > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" title={`${r.cobrancas_pendentes} pendentes`}>
                            <Calendar size={10} />
                            {r.cobrancas_pendentes}
                          </span>
                        )}
                        {r.cobrancas_pagas + r.cobrancas_pendentes + r.cobrancas_vencidas === 0 && (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        (r.status === 'ativo' && !inadimplente) ? 'bg-green-100 text-green-700' :
                        inadimplente ? 'bg-red-100 text-red-700' :
                        r.status === 'rascunho' ? 'bg-gray-100 text-gray-700' :
                        r.status === 'aguardando_assinatura' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {inadimplente ? 'Inadimplente' :
                         r.status === 'ativo' ? 'Ativo' :
                         r.status === 'rascunho' ? 'Rascunho' :
                         r.status === 'aguardando_assinatura' ? 'Aguardando' :
                         r.status === 'encerrado' ? 'Encerrado' : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-flex items-center gap-1">
                        <button
                          onClick={() => setShowGerarModal(r)}
                          className="rounded p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          title="Gerar cobrança do mês"
                        >
                          <DollarSign size={14} />
                        </button>
                        {r.proxima_cobranca_pendente && (
                          <>
                            <button
                              onClick={() => setShowPagaModal({ row: r, cob: r.proxima_cobranca_pendente! })}
                              className="rounded p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Marcar próxima cobrança como paga"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => abrirWhatsAppCobranca(r)}
                              className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              title="WhatsApp cobrança"
                            >
                              <MessageCircle size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Mais ações"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {actionMenu === r.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-700">
                            <Link
                              to={`/painel/contratos/${r.id}`}
                              onClick={() => setActionMenu(null)}
                              className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                              <FileText className="mr-1 inline" size={12} /> Ver/editar contrato
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal: Gerar cobrança */}
      {showGerarModal && (
        <ModalGerarCobranca
          row={showGerarModal}
          mesCompetencia={mesCompetencia}
          onClose={() => setShowGerarModal(null)}
          onSuccess={() => { setShowGerarModal(null); load() }}
        />
      )}

      {/* Modal: Marcar paga */}
      {showPagaModal && (
        <ModalMarcarPaga
          row={showPagaModal.row}
          cob={showPagaModal.cob}
          onClose={() => setShowPagaModal(null)}
          onSuccess={() => { setShowPagaModal(null); load() }}
        />
      )}
    </div>
  )
}

const KPI = ({ icon, label, value, color }: any) => {
  const cls: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cls[color]}`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  )
}

// =============================
// Modal: Gerar cobrança do mês
// =============================
function ModalGerarCobranca({ row, mesCompetencia, onClose, onSuccess }: { row: LocacaoRow; mesCompetencia: string; onClose: () => void; onSuccess: () => void }) {
  const [acting, setActing] = useState(false)
  const [extras, setExtras] = useState(0)
  const [descExtras, setDescExtras] = useState('')
  const [abat, setAbat] = useState(0)
  const [descAbat, setDescAbat] = useState('')
  const [despesasIds, setDespesasIds] = useState<string[]>([])
  const [despesasElegiveis, setDespesasElegiveis] = useState<any[]>([])
  const [vencimento, setVencimento] = useState(() => {
    const [ano, mes] = mesCompetencia.split('-')
    const dia = String(row.dia_vencimento || 5).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  })

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('contratos_despesas')
        .select('*')
        .eq('contrato_id', row.id)
        .eq('abater_em', 'aluguel')
        .is('cobranca_id', null)
        .in('status', ['aprovada', 'executada'])
      setDespesasElegiveis(data || [])
    })()
  }, [row.id])

  const valorBase = row.valor_aluguel + (row.valor_condominio || 0) + (row.valor_iptu || 0)
  const despesasSel = despesasElegiveis.filter((d) => despesasIds.includes(d.id))
  const extrasDespesas = despesasSel.filter((d) => d.quem_paga === 'locatario').reduce((s, d) => s + Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor), 0)
  const abatDespesas = despesasSel.filter((d) => d.quem_paga === 'locador').reduce((s, d) => s + Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor), 0)
  const totalPreview = Math.max(0, valorBase + (Number(extras) || 0) + extrasDespesas - (Number(abat) || 0) - abatDespesas)

  async function gerar() {
    setActing(true)
    try {
      const { res, json } = await callEdge('cobranca-gerar-uma', {
        contrato_id: row.id,
        vencimento,
        valor_extras: extras,
        descricao_extras: descExtras || undefined,
        valor_abatimento: abat,
        descricao_abatimento: descAbat || undefined,
        despesas_ids: despesasIds,
      })
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      toast.success(`Cobrança gerada · ${fmtMoeda(json.valor_total)}`)
      onSuccess()
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !acting && onClose()}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Gerar cobrança · {row.numero}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{row.imovel_codigo} · {row.locatario_nome}</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Vencimento</label>
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Extras (R$)</label>
              <input type="number" step="0.01" value={extras || ''} onChange={(e) => setExtras(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Descrição extras</label>
              <input type="text" value={descExtras} onChange={(e) => setDescExtras(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Abatimento (R$)</label>
              <input type="number" step="0.01" value={abat || ''} onChange={(e) => setAbat(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Descrição abatimento</label>
              <input type="text" value={descAbat} onChange={(e) => setDescAbat(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
            </div>
          </div>

          {despesasElegiveis.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Despesas elegíveis ({despesasElegiveis.length})
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {despesasElegiveis.map((d) => {
                  const checked = despesasIds.includes(d.id)
                  const v = Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor)
                  return (
                    <label key={d.id} className="flex items-start gap-2 border-b border-gray-100 p-2 last:border-b-0 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setDespesasIds([...despesasIds, d.id])
                          else setDespesasIds(despesasIds.filter((id) => id !== d.id))
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 text-xs">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{d.descricao}</div>
                        <div className="text-gray-500">
                          {d.quem_paga === 'locatario' ? '+' : '−'}{fmtMoeda(v)}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/30">
            <div className="flex justify-between"><span>Aluguel + encargos</span><span className="font-medium">{fmtMoeda(valorBase)}</span></div>
            {(Number(extras) > 0 || extrasDespesas > 0) && (
              <div className="flex justify-between text-blue-700"><span>Extras</span><span>+ {fmtMoeda(Number(extras || 0) + extrasDespesas)}</span></div>
            )}
            {(Number(abat) > 0 || abatDespesas > 0) && (
              <div className="flex justify-between text-purple-700"><span>Abatimento</span><span>− {fmtMoeda(Number(abat || 0) + abatDespesas)}</span></div>
            )}
            <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span className="text-moradda-blue-700">{fmtMoeda(totalPreview)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} disabled={acting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={gerar} disabled={acting} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
            {acting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Gerar
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================
// Modal: Marcar paga
// =============================
function ModalMarcarPaga({ row, cob, onClose, onSuccess }: { row: LocacaoRow; cob: CobrancaSimples; onClose: () => void; onSuccess: () => void }) {
  const [acting, setActing] = useState(false)
  const [pagoEm, setPagoEm] = useState(new Date().toISOString().slice(0, 10))
  const [valorPago, setValorPago] = useState(Number(cob.valor_total ?? cob.valor))

  async function confirmar() {
    setActing(true)
    try {
      const { error } = await supabase
        .from('contratos_cobrancas')
        .update({
          status: 'paga',
          pago_em: pagoEm,
          valor_pago: valorPago,
        })
        .eq('id', cob.id)
      if (error) throw error
      // Re-ativa contrato se estava inadimplente
      if (row.status === 'inadimplente') {
        await supabase.from('contratos_locacao').update({ status: 'ativo' }).eq('id', row.id)
      }
      toast.success('Cobrança marcada como paga')
      onSuccess()
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !acting && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">Marcar como paga</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {row.numero} · vence {fmtData(cob.vencimento)} · {fmtMoeda(Number(cob.valor_total ?? cob.valor))}
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Data de pagamento</label>
            <input type="date" value={pagoEm} onChange={(e) => setPagoEm(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Valor pago (R$)</label>
            <input type="number" step="0.01" value={valorPago || ''} onChange={(e) => setValorPago(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} disabled={acting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={confirmar} disabled={acting} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {acting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
