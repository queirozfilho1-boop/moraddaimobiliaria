import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, Loader2, Calendar, AlertTriangle, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fmtData, fmtMoeda } from '@/lib/contratos'

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
  dia_vencimento: number | null
  cobranca_modo: string | null
  imovel_titulo: string | null
  imovel_codigo: string | null
  locatario_nome: string | null
  locador_nome: string | null
  cobrancas_pendentes: number
  cobrancas_pagas: number
  cobrancas_vencidas: number
  total_recebido_mes: number
  proximo_vencimento: string | null
}

const TIPO_LOCACAO_LABEL: Record<string, string> = {
  locacao_residencial: 'Residencial',
  locacao_comercial: 'Comercial',
  temporada: 'Temporada',
}

export default function LocacoesPage() {
  const [rows, setRows] = useState<LocacaoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contratos_locacao')
      .select(`
        id, numero, tipo, status, data_inicio, data_fim, valor_aluguel,
        valor_condominio, valor_iptu, taxa_admin_pct, dia_vencimento, cobranca_modo,
        imoveis(codigo, titulo),
        contratos_partes(nome, papel),
        contratos_cobrancas(valor, status, vencimento, pago_em)
      `)
      .in('tipo', ['locacao_residencial', 'locacao_comercial', 'temporada'])
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar locações: ' + error.message)
      setLoading(false)
      return
    }

    const mapped: LocacaoRow[] = (data || []).map((r: any) => {
      const partes = (r.contratos_partes || []) as Array<{ papel: string; nome: string }>
      const cobrancas = (r.contratos_cobrancas || []) as Array<{ valor: number; status: string; vencimento: string; pago_em: string | null }>
      const locatario = partes.find((p) => p.papel === 'locatario' || p.papel === 'hospede')
      const locador = partes.find((p) => p.papel === 'locador')
      const hoje = new Date()
      const hojeIso = hoje.toISOString().slice(0, 10)
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
      const pagas = cobrancas.filter((c) => c.status === 'paga' || c.status === 'pago')
      const pendentes = cobrancas.filter((c) => c.status === 'pendente' && c.vencimento >= hojeIso)
      const vencidas = cobrancas.filter((c) => c.status === 'pendente' && c.vencimento < hojeIso)
      const recebidoMes = pagas
        .filter((c) => c.pago_em && c.pago_em >= inicioMes && c.pago_em <= fimMes)
        .reduce((s, c) => s + Number(c.valor || 0), 0)
      const proxVenc = pendentes.length
        ? pendentes.reduce((min, c) => (c.vencimento < min ? c.vencimento : min), pendentes[0].vencimento)
        : null

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
        dia_vencimento: r.dia_vencimento,
        cobranca_modo: r.cobranca_modo,
        imovel_codigo: r.imoveis?.codigo || null,
        imovel_titulo: r.imoveis?.titulo || null,
        locatario_nome: locatario?.nome || null,
        locador_nome: locador?.nome || null,
        cobrancas_pendentes: pendentes.length,
        cobrancas_pagas: pagas.length,
        cobrancas_vencidas: vencidas.length,
        total_recebido_mes: recebidoMes,
        proximo_vencimento: proxVenc,
      }
    })
    setRows(mapped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
    const ativos = rows.filter((r) => r.status === 'ativo').length
    const inadimplentes = rows.filter((r) => r.cobrancas_vencidas > 0).length
    const recebidoMes = rows.reduce((s, r) => s + r.total_recebido_mes, 0)
    const aluguelMensalTotal = rows.filter((r) => r.status === 'ativo').reduce((s, r) => s + r.valor_aluguel, 0)
    return { ativos, inadimplentes, recebidoMes, aluguelMensalTotal }
  }, [rows])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Locações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestão de aluguéis ativos: cobranças, repasses e vencimentos.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI icon={<Home />} label="Locações ativas" value={String(stats.ativos)} color="blue" />
        <KPI icon={<DollarSign />} label="Aluguel total/mês" value={fmtMoeda(stats.aluguelMensalTotal)} color="emerald" />
        <KPI icon={<TrendingUp />} label="Recebido este mês" value={fmtMoeda(stats.recebidoMes)} color="green" />
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
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Contrato</th>
                <th className="px-4 py-3 text-left font-medium">Imóvel</th>
                <th className="px-4 py-3 text-left font-medium">Locatário</th>
                <th className="px-4 py-3 text-right font-medium">Aluguel</th>
                <th className="px-4 py-3 text-center font-medium">Próx. vencimento</th>
                <th className="px-4 py-3 text-center font-medium">Cobranças</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => {
                const inadimplente = r.cobrancas_vencidas > 0
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
                        {inadimplente && (
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
                        r.status === 'ativo' && !inadimplente ? 'bg-green-100 text-green-700' :
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const KPI = ({ icon, label, value, color }: any) => {
  const cls: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
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
