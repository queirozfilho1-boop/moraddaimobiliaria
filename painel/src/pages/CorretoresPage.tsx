import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Briefcase, Trophy, Users, Home, DollarSign,
  TrendingUp, Phone, Mail, Award, Target, Calendar,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fmtMoeda } from '@/lib/contratos'

interface CorretorPerf {
  id: string
  nome: string
  email: string
  telefone: string | null
  whatsapp: string | null
  creci: string | null
  avatar_url: string | null
  ativo: boolean
  imoveis_ativos: number
  vendas_mes: number
  vendas_ano: number
  valor_vendido_mes: number
  valor_vendido_ano: number
  comissao_recebida_mes: number
  comissao_recebida_ano: number
  comissao_pendente: number
  leads_ativos: number
  leads_convertidos_mes: number
  leads_total_mes: number
  ticket_medio: number
}

type Periodo = 'mes' | 'ano'

export default function CorretoresPage() {
  const [corretores, setCorretores] = useState<CorretorPerf[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>('mes')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const { data: usuarios, error } = await supabase
        .from('users_profiles')
        .select('id, nome, email, telefone, whatsapp, creci, avatar_url, ativo, is_corretor')
        .eq('is_corretor', true)
        .order('nome')

      if (error) throw error

      const apenasCorretores = usuarios || []

      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)
      const inicioMesIso = inicioMes.toISOString()

      const inicioAno = new Date()
      inicioAno.setMonth(0, 1)
      inicioAno.setHours(0, 0, 0, 0)
      const inicioAnoIso = inicioAno.toISOString()

      const performance = await Promise.all(
        apenasCorretores.map(async (u: any) => {
          const uid = u.id

          const [
            { data: imoveisAtivos },
            { data: vendasMes },
            { data: vendasAno },
            { data: comissoesMes },
            { data: comissoesAno },
            { data: comissoesPendentes },
            { data: leadsAtivos },
            { data: leadsMes },
          ] = await Promise.all([
            supabase
              .from('imoveis')
              .select('id', { count: 'exact', head: false })
              .eq('corretor_id', uid)
              .eq('status', 'publicado'),
            supabase
              .from('vendas')
              .select('id, valor_venda, status, created_at')
              .eq('corretor_id', uid)
              .eq('status', 'concluida')
              .gte('created_at', inicioMesIso),
            supabase
              .from('vendas')
              .select('id, valor_venda, status, created_at')
              .eq('corretor_id', uid)
              .eq('status', 'concluida')
              .gte('created_at', inicioAnoIso),
            supabase
              .from('comissoes')
              .select('valor')
              .eq('beneficiario_id', uid)
              .eq('status', 'paga')
              .gte('created_at', inicioMesIso),
            supabase
              .from('comissoes')
              .select('valor')
              .eq('beneficiario_id', uid)
              .eq('status', 'paga')
              .gte('created_at', inicioAnoIso),
            supabase
              .from('comissoes')
              .select('valor')
              .eq('beneficiario_id', uid)
              .in('status', ['pendente', 'parcial']),
            supabase
              .from('leads')
              .select('id', { count: 'exact', head: false })
              .eq('corretor_id', uid)
              .in('status', ['novo', 'em_atendimento']),
            supabase
              .from('leads')
              .select('id, status, created_at')
              .eq('corretor_id', uid)
              .gte('created_at', inicioMesIso),
          ])

          const valorVendidoMes = (vendasMes || []).reduce((s: number, v: any) => s + Number(v.valor_venda || 0), 0)
          const valorVendidoAno = (vendasAno || []).reduce((s: number, v: any) => s + Number(v.valor_venda || 0), 0)
          const comissaoRecMes = (comissoesMes || []).reduce((s: number, c: any) => s + Number(c.valor || 0), 0)
          const comissaoRecAno = (comissoesAno || []).reduce((s: number, c: any) => s + Number(c.valor || 0), 0)
          const comissaoPend = (comissoesPendentes || []).reduce((s: number, c: any) => s + Number(c.valor || 0), 0)
          const totalVendasAno = (vendasAno || []).length
          const leadsConvMes = (leadsMes || []).filter((l: any) => l.status === 'convertido').length
          const ticketMedio = totalVendasAno > 0 ? valorVendidoAno / totalVendasAno : 0

          return {
            id: uid,
            nome: u.nome,
            email: u.email,
            telefone: u.telefone,
            whatsapp: u.whatsapp,
            creci: u.creci,
            avatar_url: u.avatar_url,
            ativo: u.ativo,
            imoveis_ativos: (imoveisAtivos || []).length,
            vendas_mes: (vendasMes || []).length,
            vendas_ano: totalVendasAno,
            valor_vendido_mes: valorVendidoMes,
            valor_vendido_ano: valorVendidoAno,
            comissao_recebida_mes: comissaoRecMes,
            comissao_recebida_ano: comissaoRecAno,
            comissao_pendente: comissaoPend,
            leads_ativos: (leadsAtivos || []).length,
            leads_convertidos_mes: leadsConvMes,
            leads_total_mes: (leadsMes || []).length,
            ticket_medio: ticketMedio,
          }
        })
      )

      performance.sort((a, b) =>
        periodo === 'mes' ? b.valor_vendido_mes - a.valor_vendido_mes : b.valor_vendido_ano - a.valor_vendido_ano
      )

      setCorretores(performance)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-moradda-blue-500" />
      </div>
    )
  }

  const totalVendido = corretores.reduce((s, c) => s + (periodo === 'mes' ? c.valor_vendido_mes : c.valor_vendido_ano), 0)
  const totalImoveis = corretores.reduce((s, c) => s + c.imoveis_ativos, 0)
  const totalLeads = corretores.reduce((s, c) => s + c.leads_ativos, 0)
  const totalComissaoPaga = corretores.reduce((s, c) => s + (periodo === 'mes' ? c.comissao_recebida_mes : c.comissao_recebida_ano), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-moradda-gold-100 text-moradda-gold-600 dark:bg-moradda-gold-900/40 dark:text-moradda-gold-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Performance dos Corretores</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe a produtividade da equipe — gestão de logins em <Link to="/painel/acessos" className="text-moradda-blue-500 hover:underline">Acessos</Link></p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${periodo === 'mes'
              ? 'bg-white text-moradda-blue-600 shadow-sm dark:bg-gray-700 dark:text-moradda-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <Calendar size={14} className="inline mr-1" /> Mês atual
          </button>
          <button
            onClick={() => setPeriodo('ano')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${periodo === 'ano'
              ? 'bg-white text-moradda-blue-600 shadow-sm dark:bg-gray-700 dark:text-moradda-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <Calendar size={14} className="inline mr-1" /> Ano
          </button>
        </div>
      </div>

      {/* KPIs gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<Trophy />} label="Total Vendido" value={fmtMoeda(totalVendido)} color="emerald" />
        <KPICard icon={<DollarSign />} label="Comissões Pagas" value={fmtMoeda(totalComissaoPaga)} color="amber" />
        <KPICard icon={<Home />} label="Imóveis Ativos" value={String(totalImoveis)} color="blue" />
        <KPICard icon={<Users />} label="Leads Ativos" value={String(totalLeads)} color="purple" />
      </div>

      {/* Lista corretores */}
      {corretores.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <Briefcase size={40} className="mx-auto text-gray-400" />
          <p className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">Nenhum corretor cadastrado</p>
          <p className="text-sm text-gray-500">
            Cadastre corretores em <Link to="/painel/acessos" className="text-moradda-blue-500 hover:underline">Acessos</Link>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {corretores.map((c, idx) => (
            <CorretorCard key={c.id} c={c} periodo={periodo} rank={idx + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

const KPICard = ({ icon, label, value, color }: any) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  )
}

const CorretorCard = ({ c, periodo, rank }: { c: CorretorPerf; periodo: Periodo; rank: number }) => {
  const vendas = periodo === 'mes' ? c.vendas_mes : c.vendas_ano
  const valorVendido = periodo === 'mes' ? c.valor_vendido_mes : c.valor_vendido_ano
  const comissao = periodo === 'mes' ? c.comissao_recebida_mes : c.comissao_recebida_ano
  const taxa = c.leads_total_mes > 0 ? (c.leads_convertidos_mes / c.leads_total_mes) * 100 : 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-moradda-blue-50 to-moradda-gold-50 dark:from-moradda-blue-900/20 dark:to-moradda-gold-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          {rank <= 3 && (
            <div className={`absolute flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              rank === 1 ? 'bg-amber-400 text-amber-900' :
              rank === 2 ? 'bg-gray-300 text-gray-700' :
              'bg-orange-300 text-orange-900'
            }`} style={{ marginLeft: -8, marginTop: -8 }}>
              <Award size={14} />
            </div>
          )}
          <div className="h-12 w-12 shrink-0 rounded-full bg-moradda-blue-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.nome} className="h-full w-full object-cover" />
            ) : (
              c.nome.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{c.nome}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {c.creci && <span className="inline-flex items-center gap-1"><Award size={11}/>CRECI {c.creci}</span>}
              {!c.ativo && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Inativo</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              {c.telefone && <span className="inline-flex items-center gap-1"><Phone size={11}/>{c.telefone}</span>}
              {c.email && <span className="inline-flex items-center gap-1 truncate"><Mail size={11}/>{c.email}</span>}
            </div>
          </div>
          {rank <= 3 && (
            <div className="text-2xl">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Stat icon={<Trophy size={14} />} label="Vendas" value={String(vendas)} accent="emerald" />
        <Stat icon={<DollarSign size={14} />} label="Vendido" value={fmtMoeda(valorVendido)} accent="emerald" />
        <Stat icon={<TrendingUp size={14} />} label="Comissão paga" value={fmtMoeda(comissao)} accent="amber" />
        <Stat icon={<DollarSign size={14} />} label="Pendente" value={fmtMoeda(c.comissao_pendente)} accent="rose" />
        <Stat icon={<Home size={14} />} label="Imóveis ativos" value={String(c.imoveis_ativos)} accent="blue" />
        <Stat icon={<Users size={14} />} label="Leads ativos" value={String(c.leads_ativos)} accent="purple" />
        <Stat icon={<Target size={14} />} label="Conversão (mês)" value={taxa.toFixed(0) + '%'} accent="indigo" />
        <Stat icon={<DollarSign size={14} />} label="Ticket médio" value={fmtMoeda(c.ticket_medio)} accent="gray" />
      </div>
    </div>
  )
}

const Stat = ({ icon, label, value, accent }: any) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    gray: 'text-gray-600 dark:text-gray-400',
  }
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-2.5">
      <div className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider ${colorMap[accent]}`}>
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{value}</p>
    </div>
  )
}
