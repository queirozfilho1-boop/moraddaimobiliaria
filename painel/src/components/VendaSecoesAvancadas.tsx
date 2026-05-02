// 3 seções pra colar na VendaEditorPage:
// - DocumentosSection (checklist + upload)
// - FinanciamentoSection (banco, valor, status, parcelas)
// - ItbiCartorioSection (calculadora + acompanhamento)

import { useEffect, useState } from 'react'
import { FileText, Upload, Trash2, Loader2, CheckCircle2, AlertCircle, Building2, Calculator, ExternalLink, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fmtMoeda, fmtData } from '@/lib/contratos'

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
      <span className="text-moradda-blue-500">{icon}</span> {title}
    </h2>
    {children}
  </div>
)

// ─────────────────────────────────────────────────────────────────
// DocumentosSection
// ─────────────────────────────────────────────────────────────────
const TIPOS_DOC = [
  { v: 'matricula', l: 'Matrícula atualizada' },
  { v: 'iptu', l: 'IPTU quitado' },
  { v: 'cnd_imovel', l: 'Certidão Negativa do Imóvel' },
  { v: 'cnd_iptu', l: 'CND IPTU' },
  { v: 'condominio', l: 'Declaração de não-débito do condomínio' },
  { v: 'cnd_civil', l: 'Certidão Cível Pessoal (vendedor)' },
  { v: 'cnd_federal', l: 'Certidão Justiça Federal (vendedor)' },
  { v: 'cnd_trabalhista', l: 'Certidão Trabalhista (vendedor)' },
  { v: 'cnd_receita', l: 'Certidão Receita Federal (vendedor)' },
  { v: 'rg_cpf_vendedor', l: 'RG/CPF Vendedor' },
  { v: 'rg_cpf_comprador', l: 'RG/CPF Comprador' },
  { v: 'comprovante_renda', l: 'Comprovante de renda Comprador' },
  { v: 'compr_residencia', l: 'Comprovante residência Comprador' },
  { v: 'aprovacao_credito', l: 'Aprovação de crédito (financiamento)' },
  { v: 'guia_itbi', l: 'Guia ITBI emitida' },
  { v: 'comprovante_itbi', l: 'Comprovante pagamento ITBI' },
  { v: 'escritura', l: 'Escritura Pública' },
  { v: 'matricula_pos', l: 'Matrícula com averbação pós-registro' },
]

interface Doc {
  id: string; tipo: string; nome_arquivo?: string | null; url?: string | null
  emitido_em?: string | null; validade?: string | null; ok: boolean; observacoes?: string | null
}

export const DocumentosSection = ({ vendaId }: { vendaId: string }) => {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [novoTipo, setNovoTipo] = useState('matricula')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('vendas_documentos').select('*').eq('venda_id', vendaId).order('tipo')
    setDocs((data || []) as Doc[]); setLoading(false)
  }
  useEffect(() => { load() }, [vendaId])

  async function add() {
    if (docs.find((d) => d.tipo === novoTipo)) { toast.error('Já existe esse tipo'); return }
    await supabase.from('vendas_documentos').insert({ venda_id: vendaId, tipo: novoTipo, ok: false })
    load()
  }

  async function toggleOk(d: Doc) {
    await supabase.from('vendas_documentos').update({ ok: !d.ok }).eq('id', d.id)
    load()
  }

  async function remover(d: Doc) {
    if (!confirm('Remover este documento?')) return
    await supabase.from('vendas_documentos').delete().eq('id', d.id); load()
  }

  async function uploadFile(d: Doc, file: File) {
    const path = `vendas/${vendaId}/${d.id}_${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('imoveis').upload(path, file, { upsert: true })
    if (upErr) { toast.error('Upload erro: ' + upErr.message); return }
    const { data: pub } = supabase.storage.from('imoveis').getPublicUrl(path)
    await supabase.from('vendas_documentos').update({
      nome_arquivo: file.name, url: pub.publicUrl, ok: true,
    }).eq('id', d.id)
    toast.success('Upload OK'); load()
  }

  const totalOk = docs.filter((d) => d.ok).length
  const pct = docs.length > 0 ? Math.round((totalOk / docs.length) * 100) : 0

  return (
    <Section title="Documentação" icon={<FileText size={16} />}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {totalOk} de {docs.length} documentos OK · <strong className={pct === 100 ? 'text-green-700' : 'text-amber-700'}>{pct}%</strong>
        </p>
        <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-moradda-blue-500" /></div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
              <button onClick={() => toggleOk(d)} className={`flex h-7 w-7 items-center justify-center rounded-full transition ${d.ok ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 dark:bg-gray-600'}`}>
                {d.ok ? <CheckCircle2 size={16} /> : <Clock size={14} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {TIPOS_DOC.find((t) => t.v === d.tipo)?.l || d.tipo}
                </p>
                {d.nome_arquivo && (
                  <a href={d.url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-moradda-blue-600 hover:underline inline-flex items-center gap-1">
                    {d.nome_arquivo} <ExternalLink size={10} />
                  </a>
                )}
                {d.validade && <p className="text-xs text-gray-500">Validade: {fmtData(d.validade)}</p>}
              </div>
              <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <Upload size={12} className="inline mr-1" /> {d.url ? 'Trocar' : 'Upload'}
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(d, e.target.files[0])} />
              </label>
              <button onClick={() => remover(d)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          {TIPOS_DOC.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
        <button onClick={add} className="rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          Adicionar
        </button>
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────
// FinanciamentoSection
// ─────────────────────────────────────────────────────────────────
const FIN_STATUS: Record<string, { l: string; cor: string }> = {
  nao_aplicavel: { l: 'Não aplicável (à vista)', cor: 'bg-gray-100 text-gray-700' },
  em_analise: { l: 'Em análise', cor: 'bg-amber-100 text-amber-700' },
  aprovado: { l: 'Aprovado', cor: 'bg-green-100 text-green-700' },
  recusado: { l: 'Recusado', cor: 'bg-red-100 text-red-700' },
  liberado: { l: 'Liberado (recurso disponível)', cor: 'bg-blue-100 text-blue-700' },
}

export const FinanciamentoSection = ({ venda, onChange }: { venda: any; onChange: (patch: any) => void }) => {
  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  return (
    <Section title="Financiamento" icon={<Building2 size={16} />}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={venda.financiamento_status || 'nao_aplicavel'} onChange={(e) => onChange({ financiamento_status: e.target.value })}>
            {Object.entries(FIN_STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>Banco</label><input className={inputCls} value={venda.banco_financiamento || ''} onChange={(e) => onChange({ banco_financiamento: e.target.value })} /></div>
        <div><label className={labelCls}>Valor financiado</label><input type="number" step="0.01" className={inputCls} value={venda.valor_financiado || ''} onChange={(e) => onChange({ valor_financiado: Number(e.target.value) })} /></div>
        <div><label className={labelCls}>Parcelas</label><input type="number" className={inputCls} value={venda.parcelas_qtd || ''} onChange={(e) => onChange({ parcelas_qtd: Number(e.target.value) })} /></div>
        <div><label className={labelCls}>Data análise</label><input type="date" className={inputCls} value={venda.data_analise_credito || ''} onChange={(e) => onChange({ data_analise_credito: e.target.value })} /></div>
        <div><label className={labelCls}>Data aprovação</label><input type="date" className={inputCls} value={venda.data_aprovacao_credito || ''} onChange={(e) => onChange({ data_aprovacao_credito: e.target.value })} /></div>
      </div>

      {venda.financiamento_status && venda.financiamento_status !== 'nao_aplicavel' && (
        <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${FIN_STATUS[venda.financiamento_status]?.cor || ''}`}>
          {venda.financiamento_status === 'aprovado' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {FIN_STATUS[venda.financiamento_status]?.l}
        </div>
      )}
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────
// ItbiCartorioSection — calculadora + acompanhamento
// ─────────────────────────────────────────────────────────────────
export const ItbiCartorioSection = ({ venda, onChange }: { venda: any; onChange: (patch: any) => void }) => {
  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  const aliquotaItbi = 2 // % padrão (cada município pode variar — Resende-RJ ~2%)
  const itbiCalculado = venda.valor_venda ? (Number(venda.valor_venda) * aliquotaItbi / 100) : 0

  return (
    <Section title="ITBI & Cartório" icon={<Calculator size={16} />}>
      <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          ITBI estimado a {aliquotaItbi}% sobre {fmtMoeda(venda.valor_venda || 0)}:
        </p>
        <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{fmtMoeda(itbiCalculado)}</p>
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          (Valor estimativo · alíquota varia por município. Consulte a guia oficial.)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className={labelCls}>Valor ITBI (oficial)</label><input type="number" step="0.01" className={inputCls} value={venda.valor_itbi || ''} onChange={(e) => onChange({ valor_itbi: Number(e.target.value) })} placeholder={String(itbiCalculado.toFixed(2))} /></div>
        <div>
          <label className={labelCls}>Pago por</label>
          <select className={inputCls} value={venda.itbi_pago_por || 'comprador'} onChange={(e) => onChange({ itbi_pago_por: e.target.value })}>
            <option value="comprador">Comprador</option>
            <option value="vendedor">Vendedor</option>
            <option value="dividido">Dividido</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!venda.itbi_pago} onChange={(e) => onChange({ itbi_pago: e.target.checked })} />
            ITBI pago
          </label>
        </div>

        <div className="sm:col-span-2"><label className={labelCls}>Cartório de Registro</label><input className={inputCls} value={venda.cartorio || ''} onChange={(e) => onChange({ cartorio: e.target.value })} placeholder="Ex: 1º Ofício de Registro de Imóveis de Resende" /></div>
        <div><label className={labelCls}>Nº Escritura</label><input className={inputCls} value={venda.numero_escritura || ''} onChange={(e) => onChange({ numero_escritura: e.target.value })} /></div>
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────
// ProbabilidadeSection
// ─────────────────────────────────────────────────────────────────
export const ProbabilidadeSection = ({ venda, onChange }: { venda: any; onChange: (patch: any) => void }) => {
  const valor = Number(venda.probabilidade_pct ?? 50)
  const cor = valor >= 75 ? 'green' : valor >= 50 ? 'amber' : 'red'
  const corClass = cor === 'green' ? 'text-green-700 dark:text-green-400' : cor === 'amber' ? 'text-amber-700' : 'text-red-700'

  return (
    <Section title="Probabilidade de Fechamento" icon={<Calculator size={16} />}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={100} step={5} value={valor} onChange={(e) => onChange({ probabilidade_pct: Number(e.target.value) })} className="flex-1" />
          <span className={`min-w-[60px] text-right text-2xl font-bold ${corClass}`}>{valor}%</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Forecast: <strong className={corClass}>{fmtMoeda(Number(venda.valor_venda || 0) * valor / 100)}</strong> ponderado
        </p>
      </div>
    </Section>
  )
}
