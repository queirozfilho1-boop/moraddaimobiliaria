import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Save, Loader2, Search, Pencil, Home, DollarSign,
  Calendar, Users, FileText, Download, Trophy, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { fmtMoeda, fmtData } from '@/lib/contratos'
import type { VendaStatus } from '@/lib/vendas'
import {
  VENDA_STATUS_LABEL, VENDA_STATUS_COR,
  calcularComissaoVenda,
} from '@/lib/vendas'
import { downloadPdfContratoFromMd } from '@/lib/contratoPdfRender'
import { mergeTemplate } from '@/lib/contratoMerge'

interface Venda {
  id: string; numero: string; status: VendaStatus
  imovel_id: string; valor_venda: number; valor_sinal: number
  data_proposta?: string | null; data_assinatura?: string | null
  comissao_total_pct: number; comissao_lider_pct: number
  corretor_id?: string | null; captador_id?: string | null; lider_id?: string | null
  comprador_nome: string; comprador_cpf_cnpj?: string | null
  comprador_email?: string | null; comprador_telefone?: string | null
  comprador_endereco?: string | null
  valor_financiado?: number | null; banco_financiamento?: string | null
  parcelas_qtd?: number | null; valor_itbi?: number | null
  data_escritura?: string | null; data_registro?: string | null
  modelo_id?: string | null
  observacoes?: string | null
  created_at: string
  imoveis?: { codigo?: string; titulo?: string } | null
}

export const VendasListPage = () => {
  const [rows, setRows] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('vendas')
      .select('*, imoveis(codigo, titulo)')
      .order('created_at', { ascending: false })
    setRows((data || []) as Venda[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return `${r.numero} ${r.comprador_nome} ${r.imoveis?.codigo || ''}`.toLowerCase().includes(s)
    }
    return true
  }), [rows, search, statusFilter])

  const totalVendido = filtered.filter((v) => v.status === 'concluida').reduce((s, v) => s + Number(v.valor_venda), 0)
  const totalNegociacao = filtered.filter((v) => v.status === 'em_negociacao').reduce((s, v) => s + Number(v.valor_venda), 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vendas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pipeline de vendas + contratos de compra e venda</p>
        </div>
        <Link to="/painel/vendas/novo" className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} /> Nova Venda
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/40 dark:bg-green-900/20">
          <p className="text-xs uppercase tracking-wider text-green-700 dark:text-green-400">Concluídas (volume)</p>
          <p className="text-xl font-bold text-green-800 dark:text-green-300">{fmtMoeda(totalVendido)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-900/20">
          <p className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">Em negociação</p>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{fmtMoeda(totalNegociacao)}</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800/40 dark:bg-purple-900/20">
          <p className="text-xs uppercase tracking-wider text-purple-700 dark:text-purple-400">Total registros</p>
          <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{filtered.length}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <option value="">Todos os status</option>
          {Object.entries(VENDA_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <Trophy size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700">Nenhuma venda registrada</h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Imóvel</th>
                <th className="px-4 py-3 text-left">Comprador</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-mono text-xs text-moradda-blue-700">{r.numero}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <p className="font-medium">{r.imoveis?.codigo}</p>
                    <p className="text-xs text-gray-500">{r.imoveis?.titulo || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.comprador_nome}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">{fmtMoeda(r.valor_venda)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${VENDA_STATUS_COR[r.status]}`}>
                      {VENDA_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/painel/vendas/${r.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:hover:bg-gray-700">
                      <Pencil size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export const VendaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [v, setV] = useState<Partial<Venda>>({
    status: 'em_negociacao',
    valor_venda: 0, valor_sinal: 0, valor_financiado: 0, parcelas_qtd: 0,
    comissao_total_pct: 5, comissao_lider_pct: 0.5,
    data_proposta: new Date().toISOString().split('T')[0],
  })
  const [imoveis, setImoveis] = useState<{ id: string; codigo?: string; titulo?: string }[]>([])
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    ;(async () => {
      const [{ data: imv }, { data: cor }] = await Promise.all([
        supabase.from('imoveis').select('id, codigo, titulo').order('codigo'),
        supabase.from('users_profiles').select('id, nome').order('nome'),
      ])
      setImoveis((imv || []) as any)
      setCorretores((cor || []) as any)
    })()
  }, [])

  useEffect(() => {
    if (isNew) return
    ;(async () => {
      const { data } = await supabase.from('vendas').select('*, imoveis(id, codigo, titulo)').eq('id', id).single()
      if (data) setV(data)
      setLoading(false)
    })()
  }, [id, isNew])

  const set = (k: keyof Venda, val: any) => setV({ ...v, [k]: val })

  // Cálculo comissão tempo real
  const comissoes = useMemo(() => {
    if (!v.valor_venda || !v.corretor_id) return []
    return calcularComissaoVenda({
      valor_venda: Number(v.valor_venda),
      comissao_total_pct: Number(v.comissao_total_pct || 5),
      comissao_lider_pct: Number(v.comissao_lider_pct || 0),
      captador_id: v.captador_id || null,
      vendedor_id: v.corretor_id,
      lider_id: v.lider_id || null,
    })
  }, [v.valor_venda, v.comissao_total_pct, v.comissao_lider_pct, v.captador_id, v.corretor_id, v.lider_id])
  const comissaoTotal = comissoes.reduce((s, c) => s + c.valor, 0)

  const nomeOf = (uid?: string | null) => uid ? (corretores.find((c) => c.id === uid)?.nome || '') : ''

  async function save() {
    if (!v.imovel_id) { toast.error('Selecione o imóvel'); return }
    if (!v.comprador_nome) { toast.error('Nome do comprador'); return }
    if (!v.valor_venda || v.valor_venda <= 0) { toast.error('Valor da venda'); return }
    if (!v.corretor_id) { toast.error('Selecione o corretor responsável'); return }
    setSaving(true)
    try {
      let vid = id !== 'novo' ? id : undefined
      if (!vid) {
        const { data: numData } = await supabase.rpc('proximo_numero_venda')
        const numero = (numData as string) || `V-${new Date().getFullYear()}/000001`
        const { data, error } = await supabase.from('vendas').insert({
          ...v, numero, criado_por: profile?.id,
        }).select().single()
        if (error) throw error
        vid = data.id
      } else {
        const { error } = await supabase.from('vendas').update(v).eq('id', vid)
        if (error) throw error
      }

      // Salva comissões (delete + insert)
      if (vid) {
        await supabase.from('comissoes').delete().eq('venda_id', vid)
        if (comissoes.length > 0) {
          await supabase.from('comissoes').insert(comissoes.map((c) => ({
            venda_id: vid,
            beneficiario_id: c.beneficiario_id,
            papel: c.papel,
            base_calculo: c.base_calculo,
            percentual: c.percentual,
            valor: c.valor,
            descricao: c.descricao,
            status: 'pendente',
            data_referencia: v.data_assinatura || new Date().toISOString().split('T')[0],
          })))
        }
      }

      toast.success(isNew ? 'Venda criada' : 'Venda salva')
      if (isNew && vid) navigate(`/painel/vendas/${vid}`, { replace: true })
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setSaving(false) }
  }

  async function gerarPdf() {
    if (!v.imovel_id) { toast.error('Selecione o imóvel'); return }
    // Buscar modelo Compra e Venda
    const { data: modelo } = await supabase.from('contratos_modelos')
      .select('conteudo').eq('tipo', 'compra_venda').eq('ativo', true).limit(1).maybeSingle()
    if (!modelo?.conteudo) { toast.error('Cadastre o modelo Compra e Venda em Modelos Contrato (Carregar padrão)'); return }
    const imovel = imoveis.find((i) => i.id === v.imovel_id) || { id: v.imovel_id! }
    // Buscar dados completos do imóvel
    const { data: imovelFull } = await supabase.from('imoveis').select('*, bairros(nome)').eq('id', v.imovel_id).single()
    const merged = mergeTemplate(modelo.conteudo, {
      contrato: {} as any,
      partes: [
        { papel: 'locador', nome: nomeOf(v.captador_id) || 'Vendedor', cpf_cnpj: '', endereco: '' } as any,
      ],
      imovel: { ...imovel, ...imovelFull, bairro_nome: (imovelFull as any)?.bairros?.nome } as any,
    })
    // Substituir placeholders venda.* manualmente
    const finalText = merged
      .replace(/\{\{venda\.numero\}\}/g, v.numero || '')
      .replace(/\{\{venda\.valor_venda_fmt\}\}/g, Number(v.valor_venda).toFixed(2))
      .replace(/\{\{venda\.valor_venda_extenso\}\}/g, fmtMoeda(v.valor_venda))
      .replace(/\{\{venda\.valor_sinal_fmt\}\}/g, Number(v.valor_sinal || 0).toFixed(2))
      .replace(/\{\{venda\.valor_saldo_fmt\}\}/g, ((Number(v.valor_venda) - Number(v.valor_sinal || 0))).toFixed(2))
      .replace(/\{\{venda\.forma_sinal\}\}/g, 'PIX/Transferência')
      .replace(/\{\{venda\.forma_saldo\}\}/g, v.banco_financiamento ? `Financiamento via ${v.banco_financiamento}` : 'À vista')
      .replace(/\{\{venda\.banco_financiamento\}\}/g, v.banco_financiamento || '—')
      .replace(/\{\{venda\.valor_financiado_fmt\}\}/g, Number(v.valor_financiado || 0).toFixed(2))
      .replace(/\{\{venda\.parcelas_qtd\}\}/g, String(v.parcelas_qtd || 0))
      .replace(/\{\{venda\.data_imissao\}\}/g, fmtData(v.data_assinatura))
      .replace(/\{\{venda\.data_assinatura\}\}/g, fmtData(v.data_assinatura))
      .replace(/\{\{venda\.comissao_total_pct\}\}/g, String(v.comissao_total_pct))
      .replace(/\{\{venda\.comissao_total_valor_fmt\}\}/g, ((Number(v.valor_venda) * Number(v.comissao_total_pct) / 100).toFixed(2)))
      .replace(/\{\{venda\.comissao_pago_por\}\}/g, 'VENDEDOR')
      .replace(/\{\{venda\.condicao_comissao\}\}/g, 'no fechamento da venda mediante quitação total')
      .replace(/\{\{comprador\.nome\}\}/g, v.comprador_nome || '')
      .replace(/\{\{comprador\.cpf_cnpj\}\}/g, v.comprador_cpf_cnpj || '')
      .replace(/\{\{comprador\.email\}\}/g, v.comprador_email || '')
      .replace(/\{\{comprador\.telefone\}\}/g, v.comprador_telefone || '')
      .replace(/\{\{comprador\.endereco_completo\}\}/g, v.comprador_endereco || '')
      .replace(/\{\{comprador\.[a-z_]+\}\}/g, '')
      .replace(/\{\{vendedor\.[a-z_]+\}\}/g, '')
      .replace(/\{\{imovel\.matricula\}\}/g, '—')
    await downloadPdfContratoFromMd(finalText, v.numero)
    toast.success('PDF gerado')
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/vendas" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isNew ? 'Nova Venda' : `Venda ${v.numero}`}</h1>
            {v.status && <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${VENDA_STATUS_COR[v.status]}`}>{VENDA_STATUS_LABEL[v.status]}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <button onClick={gerarPdf} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
              <Download size={15} /> Gerar PDF
            </button>
          )}
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
          </button>
        </div>
      </div>

      <S title="Identificação" icon={<Home size={16} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Imóvel</label>
            <select className={inputCls} value={v.imovel_id || ''} onChange={(e) => set('imovel_id', e.target.value)}>
              <option value="">Selecione...</option>
              {imoveis.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={v.status} onChange={(e) => set('status', e.target.value)}>
              {Object.entries(VENDA_STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
      </S>

      <S title="Comprador" icon={<Users size={16} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={labelCls}>Nome</label><input className={inputCls} value={v.comprador_nome || ''} onChange={(e) => set('comprador_nome', e.target.value)} /></div>
          <div><label className={labelCls}>CPF/CNPJ</label><input className={inputCls} value={v.comprador_cpf_cnpj || ''} onChange={(e) => set('comprador_cpf_cnpj', e.target.value)} /></div>
          <div><label className={labelCls}>E-mail</label><input className={inputCls} value={v.comprador_email || ''} onChange={(e) => set('comprador_email', e.target.value)} /></div>
          <div><label className={labelCls}>Telefone</label><input className={inputCls} value={v.comprador_telefone || ''} onChange={(e) => set('comprador_telefone', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Endereço</label><input className={inputCls} value={v.comprador_endereco || ''} onChange={(e) => set('comprador_endereco', e.target.value)} /></div>
        </div>
      </S>

      <S title="Valores" icon={<DollarSign size={16} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className={labelCls}>Valor da venda</label><input type="number" step="0.01" className={inputCls} value={v.valor_venda || ''} onChange={(e) => set('valor_venda', Number(e.target.value))} /></div>
          <div><label className={labelCls}>Sinal/entrada</label><input type="number" step="0.01" className={inputCls} value={v.valor_sinal || ''} onChange={(e) => set('valor_sinal', Number(e.target.value))} /></div>
          <div><label className={labelCls}>Valor financiado</label><input type="number" step="0.01" className={inputCls} value={v.valor_financiado || ''} onChange={(e) => set('valor_financiado', Number(e.target.value))} /></div>
          <div><label className={labelCls}>Banco financiamento</label><input className={inputCls} value={v.banco_financiamento || ''} onChange={(e) => set('banco_financiamento', e.target.value)} /></div>
          <div><label className={labelCls}>Parcelas</label><input type="number" className={inputCls} value={v.parcelas_qtd || ''} onChange={(e) => set('parcelas_qtd', Number(e.target.value))} /></div>
          <div><label className={labelCls}>Valor ITBI</label><input type="number" step="0.01" className={inputCls} value={v.valor_itbi || ''} onChange={(e) => set('valor_itbi', Number(e.target.value))} /></div>
        </div>
      </S>

      <S title="Datas" icon={<Calendar size={16} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className={labelCls}>Proposta</label><input type="date" className={inputCls} value={v.data_proposta || ''} onChange={(e) => set('data_proposta', e.target.value)} /></div>
          <div><label className={labelCls}>Assinatura</label><input type="date" className={inputCls} value={v.data_assinatura || ''} onChange={(e) => set('data_assinatura', e.target.value)} /></div>
          <div><label className={labelCls}>Escritura</label><input type="date" className={inputCls} value={v.data_escritura || ''} onChange={(e) => set('data_escritura', e.target.value)} /></div>
          <div><label className={labelCls}>Registro</label><input type="date" className={inputCls} value={v.data_registro || ''} onChange={(e) => set('data_registro', e.target.value)} /></div>
        </div>
      </S>

      <S title="Comissão & Equipe" icon={<TrendingUp size={16} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Captador</label>
            <select className={inputCls} value={v.captador_id || ''} onChange={(e) => set('captador_id', e.target.value || null)}>
              <option value="">— sem captador externo —</option>
              {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Corretor responsável (vendedor)</label>
            <select className={inputCls} value={v.corretor_id || ''} onChange={(e) => set('corretor_id', e.target.value)}>
              <option value="">Selecione...</option>
              {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Líder do corretor</label>
            <select className={inputCls} value={v.lider_id || ''} onChange={(e) => set('lider_id', e.target.value || null)}>
              <option value="">— sem líder —</option>
              {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>% comissão total</label>
            <input type="number" step="0.01" className={inputCls} value={v.comissao_total_pct || ''} onChange={(e) => set('comissao_total_pct', Number(e.target.value))} />
            <p className="mt-1 text-xs text-gray-500">5% residencial, 6% comercial, 4% lançamento</p>
          </div>
          <div>
            <label className={labelCls}>% override líder</label>
            <input type="number" step="0.01" className={inputCls} value={v.comissao_lider_pct || ''} onChange={(e) => set('comissao_lider_pct', Number(e.target.value))} />
          </div>
        </div>

        {/* Preview cálculo */}
        {comissoes.length > 0 && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Cálculo de comissão · total {fmtMoeda(comissaoTotal)}
            </p>
            <div className="space-y-1.5">
              {comissoes.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium capitalize">{c.papel}</span>
                    {c.beneficiario_id && <span className="ml-2 text-gray-500">→ {nomeOf(c.beneficiario_id)}</span>}
                    <span className="ml-2 text-xs text-gray-400">({c.descricao})</span>
                  </div>
                  <span className="font-mono font-semibold text-moradda-blue-700 dark:text-moradda-blue-300">{fmtMoeda(c.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </S>

      <S title="Observações" icon={<FileText size={16} />}>
        <textarea rows={3} className={inputCls} value={v.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} />
      </S>
    </div>
  )
}

const S = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
      <span className="text-moradda-blue-500">{icon}</span> {title}
    </h2>
    {children}
  </div>
)
