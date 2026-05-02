import { useEffect, useState } from 'react'
import { Loader2, Download, BarChart3, TrendingUp, Users, FileSignature, Trophy, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Stats {
  imoveis_total: number
  imoveis_publicados: number
  imoveis_vendidos: number
  imoveis_alugados: number
  contratos_ativos: number
  contratos_inadimplentes: number
  vendas_total: number
  vendas_concluidas: number
  vendas_volume: number
  vendas_volume_concluidas: number
  leads_total: number
  leads_convertidos: number
  taxa_conversao: number
  proprietarios_total: number
  receita_taxa_adm_mes: number
  receita_taxa_adm_ano: number
  visitas_realizadas_mes: number
  visitas_agendadas: number
}

const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function RelatoriosPage() {
  const [s, setS] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const ini = new Date(); ini.setDate(1); ini.setHours(0,0,0,0)
      const iniAno = new Date(new Date().getFullYear(), 0, 1)

      const [
        imt, imp, imv, ima,
        ca, ci,
        vt, vc, vall,
        lt, lc,
        pt,
        repMes, repAno,
        vrm, vag,
      ] = await Promise.all([
        supabase.from('imoveis').select('id', { count: 'exact', head: true }),
        supabase.from('imoveis').select('id', { count: 'exact', head: true }).eq('status', 'publicado'),
        supabase.from('imoveis').select('id', { count: 'exact', head: true }).eq('status', 'vendido'),
        supabase.from('imoveis').select('id', { count: 'exact', head: true }).eq('status', 'alugado'),
        supabase.from('contratos_locacao').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('contratos_locacao').select('id', { count: 'exact', head: true }).eq('status', 'inadimplente'),
        supabase.from('vendas').select('id', { count: 'exact', head: true }),
        supabase.from('vendas').select('id', { count: 'exact', head: true }).eq('status', 'concluida'),
        supabase.from('vendas').select('valor_venda, status'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'convertido'),
        supabase.from('proprietarios').select('id', { count: 'exact', head: true }),
        supabase.from('contratos_repasses').select('taxa_admin').eq('status', 'concluido').gte('data_repasse', ini.toISOString()),
        supabase.from('contratos_repasses').select('taxa_admin').eq('status', 'concluido').gte('data_repasse', iniAno.toISOString()),
        supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('status', 'realizada').gte('data_hora', ini.toISOString()),
        supabase.from('visitas').select('id', { count: 'exact', head: true }).in('status', ['agendada', 'confirmada']),
      ])

      const volumeAll = (vall.data || []).reduce((s, v: any) => s + Number(v.valor_venda || 0), 0)
      const volumeConcl = (vall.data || []).filter((v: any) => v.status === 'concluida').reduce((s, v: any) => s + Number(v.valor_venda || 0), 0)
      const taxaConv = (lt.count && lt.count > 0) ? ((lc.count || 0) / lt.count * 100) : 0
      const recMes = (repMes.data || []).reduce((s, r: any) => s + Number(r.taxa_admin || 0), 0)
      const recAno = (repAno.data || []).reduce((s, r: any) => s + Number(r.taxa_admin || 0), 0)

      setS({
        imoveis_total: imt.count || 0, imoveis_publicados: imp.count || 0, imoveis_vendidos: imv.count || 0, imoveis_alugados: ima.count || 0,
        contratos_ativos: ca.count || 0, contratos_inadimplentes: ci.count || 0,
        vendas_total: vt.count || 0, vendas_concluidas: vc.count || 0, vendas_volume: volumeAll, vendas_volume_concluidas: volumeConcl,
        leads_total: lt.count || 0, leads_convertidos: lc.count || 0, taxa_conversao: taxaConv,
        proprietarios_total: pt.count || 0,
        receita_taxa_adm_mes: recMes, receita_taxa_adm_ano: recAno,
        visitas_realizadas_mes: vrm.count || 0, visitas_agendadas: vag.count || 0,
      })
      setLoading(false)
    })()
  }, [])

  async function exportar(tipo: string) {
    setExporting(tipo)
    try {
      if (tipo === 'imoveis') {
        const { data } = await supabase.from('imoveis').select('codigo, titulo, tipo, finalidade, preco, status, cidade, estado').order('codigo')
        exportCsv('imoveis.csv', ['Codigo','Titulo','Tipo','Finalidade','Preco','Status','Cidade','UF'],
          (data || []).map((r: any) => [r.codigo, r.titulo, r.tipo, r.finalidade, r.preco, r.status, r.cidade, r.estado]))
      } else if (tipo === 'contratos') {
        const { data } = await supabase.from('contratos_locacao').select('numero, status, valor_aluguel, data_inicio, data_fim').order('numero')
        exportCsv('contratos_locacao.csv', ['Numero','Status','Valor','Inicio','Fim'],
          (data || []).map((r: any) => [r.numero, r.status, r.valor_aluguel, r.data_inicio, r.data_fim]))
      } else if (tipo === 'vendas') {
        const { data } = await supabase.from('vendas').select('numero, status, comprador_nome, valor_venda, data_assinatura').order('numero')
        exportCsv('vendas.csv', ['Numero','Status','Comprador','Valor','Assinatura'],
          (data || []).map((r: any) => [r.numero, r.status, r.comprador_nome, r.valor_venda, r.data_assinatura]))
      } else if (tipo === 'leads') {
        const { data } = await supabase.from('leads').select('nome, email, telefone, status, tipo, origem, created_at').order('created_at', { ascending: false })
        exportCsv('leads.csv', ['Nome','Email','Telefone','Status','Tipo','Origem','Data'],
          (data || []).map((r: any) => [r.nome, r.email, r.telefone, r.status, r.tipo, r.origem, r.created_at]))
      } else if (tipo === 'repasses') {
        const { data } = await supabase.from('contratos_repasses').select('data_referencia, valor_bruto, taxa_admin, valor_repasse, status, modo, proprietarios(nome)').order('data_referencia', { ascending: false })
        exportCsv('repasses.csv', ['Data','Bruto','Taxa Adm','Liquido','Status','Modo','Proprietario'],
          (data || []).map((r: any) => [r.data_referencia, r.valor_bruto, r.taxa_admin, r.valor_repasse, r.status, r.modo, r.proprietarios?.nome || '']))
      }
    } finally { setExporting(null) }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
  if (!s) return null

  const Card = ({ icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moradda-blue-50 text-moradda-blue-600 dark:bg-moradda-blue-900/30">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Relatórios & Analytics</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Visão consolidada do desempenho da Moradda</p>

      {/* Imóveis */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Imóveis</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card icon={<BarChart3 size={20} />} label="Total" value={String(s.imoveis_total)} />
        <Card icon={<BarChart3 size={20} />} label="Publicados" value={String(s.imoveis_publicados)} />
        <Card icon={<Trophy size={20} />} label="Vendidos" value={String(s.imoveis_vendidos)} />
        <Card icon={<FileSignature size={20} />} label="Alugados" value={String(s.imoveis_alugados)} />
      </div>

      {/* Comercial */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Comercial</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card icon={<Users size={20} />} label="Leads total" value={String(s.leads_total)} />
        <Card icon={<TrendingUp size={20} />} label="Convertidos" value={`${s.leads_convertidos}`} sub={`${s.taxa_conversao.toFixed(1)}% conversão`} />
        <Card icon={<Trophy size={20} />} label="Vendas concluídas" value={String(s.vendas_concluidas)} sub={`de ${s.vendas_total} total`} />
        <Card icon={<TrendingUp size={20} />} label="Volume concluído" value={fmt(s.vendas_volume_concluidas)} />
      </div>

      {/* Locação */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Locação</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card icon={<FileSignature size={20} />} label="Contratos ativos" value={String(s.contratos_ativos)} />
        <Card icon={<FileSignature size={20} />} label="Inadimplentes" value={String(s.contratos_inadimplentes)} />
        <Card icon={<Wallet size={20} />} label="Receita taxa adm (mês)" value={fmt(s.receita_taxa_adm_mes)} />
        <Card icon={<Wallet size={20} />} label="Receita taxa adm (ano)" value={fmt(s.receita_taxa_adm_ano)} />
      </div>

      {/* Operação */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Operação</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card icon={<BarChart3 size={20} />} label="Visitas realizadas (mês)" value={String(s.visitas_realizadas_mes)} />
        <Card icon={<BarChart3 size={20} />} label="Visitas agendadas" value={String(s.visitas_agendadas)} />
        <Card icon={<Users size={20} />} label="Proprietários" value={String(s.proprietarios_total)} />
      </div>

      {/* Exportações */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">📥 Exportar dados (CSV)</h2>
        <div className="flex flex-wrap gap-2">
          {['imoveis', 'contratos', 'vendas', 'leads', 'repasses'].map((t) => (
            <button key={t} onClick={() => exportar(t)} disabled={exporting === t}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
              {exporting === t ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
