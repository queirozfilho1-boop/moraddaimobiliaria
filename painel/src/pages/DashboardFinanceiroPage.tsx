import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Users, AlertCircle, CheckCircle2, Clock, FileSignature, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fmtMoeda } from '@/lib/contratos'

interface Stats {
  contratos_ativos: number
  contratos_inadimplentes: number
  contratos_aguardando: number
  imoveis_alugados: number
  proprietarios_total: number
  receita_mes_taxa_adm: number
  receita_mes_total: number
  repasses_pendentes: number
  repasses_concluidos: number
  inadimplencia_total: number
  vendas_concluidas_mes: number
  vendas_em_negociacao: number
  forecast_vendas: number
}

const Card = ({ icon, label, value, color = 'blue', sub }: { icon: React.ReactNode; label: string; value: string; color?: string; sub?: string }) => {
  const colors: Record<string, string> = {
    blue:   'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-300',
    green:  'border-green-200 bg-green-50 text-green-800 dark:border-green-800/40 dark:bg-green-900/20 dark:text-green-300',
    amber:  'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300',
    red:    'border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300',
    purple: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800/40 dark:bg-purple-900/20 dark:text-purple-300',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 dark:bg-black/20">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

const DashboardFinanceiroPage = () => {
  const [s, setS] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const inicioMes = new Date()
      inicioMes.setDate(1); inicioMes.setHours(0,0,0,0)

      const [
        contAtivos, contInad, contAguard, props,
        cobrPagas, repPend, repConc, cobrOver,
        vendasMes, vendasNeg,
      ] = await Promise.all([
        supabase.from('contratos_locacao').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('contratos_locacao').select('id', { count: 'exact', head: true }).eq('status', 'inadimplente'),
        supabase.from('contratos_locacao').select('id', { count: 'exact', head: true }).eq('status', 'aguardando_assinatura'),
        supabase.from('proprietarios').select('id', { count: 'exact', head: true }),
        supabase.from('contratos_cobrancas').select('valor_pago,valor,pago_em').in('status', ['RECEIVED','CONFIRMED']).gte('pago_em', inicioMes.toISOString()),
        supabase.from('contratos_repasses').select('valor_repasse,taxa_admin').eq('status', 'pendente'),
        supabase.from('contratos_repasses').select('valor_repasse,taxa_admin').eq('status', 'concluido').gte('data_repasse', inicioMes.toISOString()),
        supabase.from('contratos_cobrancas').select('valor').eq('status', 'OVERDUE'),
        supabase.from('vendas').select('valor_venda,fechado_em').eq('status', 'concluida').gte('fechado_em', inicioMes.toISOString()),
        supabase.from('vendas').select('valor_venda,probabilidade_pct').not('status', 'in', '(concluida,cancelada)'),
      ])

      const receita_mes_total = (cobrPagas.data || []).reduce((s, c: any) => s + Number(c.valor_pago || c.valor || 0), 0)
      const taxaAdmRepConc = (repConc.data || []).reduce((s, r: any) => s + Number(r.taxa_admin || 0), 0)
      const repassesPendentesTotal = (repPend.data || []).reduce((s, r: any) => s + Number(r.valor_repasse || 0), 0)
      const repassesConclTotal = (repConc.data || []).reduce((s, r: any) => s + Number(r.valor_repasse || 0), 0)
      const inadTotal = (cobrOver.data || []).reduce((s, c: any) => s + Number(c.valor || 0), 0)
      const vendasConcluidasMes = (vendasMes.data || []).reduce((s, v: any) => s + Number(v.valor_venda || 0), 0)
      const vendasEmNeg = (vendasNeg.data || []).reduce((s, v: any) => s + Number(v.valor_venda || 0), 0)
      const forecastVendas = (vendasNeg.data || []).reduce((s, v: any) => s + (Number(v.valor_venda || 0) * Number(v.probabilidade_pct || 50) / 100), 0)

      setS({
        contratos_ativos: contAtivos.count || 0,
        contratos_inadimplentes: contInad.count || 0,
        contratos_aguardando: contAguard.count || 0,
        imoveis_alugados: contAtivos.count || 0,
        proprietarios_total: props.count || 0,
        receita_mes_taxa_adm: taxaAdmRepConc,
        receita_mes_total,
        repasses_pendentes: repassesPendentesTotal,
        repasses_concluidos: repassesConclTotal,
        inadimplencia_total: inadTotal,
        vendas_concluidas_mes: vendasConcluidasMes,
        vendas_em_negociacao: vendasEmNeg,
        forecast_vendas: forecastVendas,
      })
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
  if (!s) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Financeiro</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Visão geral do mês corrente · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Receita Moradda */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Receita Moradda (mês)</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card icon={<TrendingUp size={20} />} label="Taxa de adm. recebida" value={fmtMoeda(s.receita_mes_taxa_adm)} color="green" />
        <Card icon={<Wallet size={20} />} label="Total transitado" value={fmtMoeda(s.receita_mes_total)} color="blue" sub="Bruto pago pelos inquilinos" />
        <Card icon={<TrendingDown size={20} />} label="Inadimplência" value={fmtMoeda(s.inadimplencia_total)} color="red" />
      </div>

      {/* Vendas */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Vendas</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card icon={<TrendingUp size={20} />} label="Concluídas no mês" value={fmtMoeda(s.vendas_concluidas_mes)} color="green" />
        <Card icon={<Clock size={20} />} label="Em negociação" value={fmtMoeda(s.vendas_em_negociacao)} color="blue" />
        <Card icon={<TrendingUp size={20} />} label="Forecast (ponderado)" value={fmtMoeda(s.forecast_vendas)} color="purple" sub="Σ (valor × probabilidade)" />
      </div>

      {/* Operação */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Operação</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card icon={<CheckCircle2 size={20} />} label="Contratos ativos" value={String(s.contratos_ativos)} color="green" />
        <Card icon={<AlertCircle size={20} />} label="Inadimplentes" value={String(s.contratos_inadimplentes)} color="red" />
        <Card icon={<Clock size={20} />} label="Aguardando assinatura" value={String(s.contratos_aguardando)} color="amber" />
        <Card icon={<Users size={20} />} label="Proprietários" value={String(s.proprietarios_total)} color="purple" />
      </div>

      {/* Repasses */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Repasses</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card icon={<Clock size={20} />} label="Repasses pendentes" value={fmtMoeda(s.repasses_pendentes)} color="amber" sub="Aguardando processamento" />
        <Card icon={<CheckCircle2 size={20} />} label="Repassado no mês" value={fmtMoeda(s.repasses_concluidos)} color="green" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><FileSignature size={16} /> Próximos passos sugeridos</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {s.contratos_aguardando > 0 && <li>• {s.contratos_aguardando} contrato(s) aguardando assinatura — verifique se as partes receberam o e-mail do ZapSign.</li>}
          {s.contratos_inadimplentes > 0 && <li>• {s.contratos_inadimplentes} contrato(s) inadimplente(s) — a régua de inadimplência roda diariamente às 09h.</li>}
          {s.repasses_pendentes > 0 && <li>• Há {fmtMoeda(s.repasses_pendentes)} de repasses pendentes — execute na aba "Repasses" de cada contrato.</li>}
          {s.contratos_ativos === 0 && <li>• Nenhum contrato ativo. Comece criando proprietários e vinculando ao primeiro imóvel.</li>}
        </ul>
      </div>
    </div>
  )
}

export default DashboardFinanceiroPage
