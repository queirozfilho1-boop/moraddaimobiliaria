import { useEffect, useState } from 'react'
import { CreditCard, Loader2, Plus, RefreshCw, Zap, Hand, X, ExternalLink, CheckCircle2, AlertCircle, Clock, Copy, MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fmtMoeda, fmtData, type ContratoCobranca, type ContratoDespesa, DESPESA_TIPO_LABEL } from '@/lib/contratos'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

type CobrancaModo = 'desativada' | 'manual' | 'automatica'

interface Props {
  contratoId: string
  cobrancaModo: CobrancaModo
  asaasSubscriptionId?: string | null
  valorTotal: number
  diaVencimento: number
  numeroContrato?: string | null
  locatarioTelefone?: string | null
  onChangeModo: (m: CobrancaModo) => void
  onSubscriptionCreated: (id: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  pendente: 'Pendente',
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  paga: 'Paga',
  pago: 'Pago',
  OVERDUE: 'Vencido',
  REFUNDED: 'Estornado',
  RECEIVED_IN_CASH: 'Pago em dinheiro',
  AWAITING_RISK_ANALYSIS: 'Em análise',
  cancelada: 'Cancelada',
}
const STATUS_COR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  RECEIVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  paga: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pago: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  cancelada: 'bg-gray-200 text-gray-600',
}

const CobrancasSection = ({ contratoId, cobrancaModo, asaasSubscriptionId, valorTotal, diaVencimento, numeroContrato, locatarioTelefone, onChangeModo, onSubscriptionCreated }: Props) => {
  const [cobrancas, setCobrancas] = useState<ContratoCobranca[]>([])
  const [despesasElegiveis, setDespesasElegiveis] = useState<ContratoDespesa[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualVenc, setManualVenc] = useState('')
  const [manualExtras, setManualExtras] = useState(0)
  const [manualDescExtras, setManualDescExtras] = useState('')
  const [manualAbat, setManualAbat] = useState(0)
  const [manualDescAbat, setManualDescAbat] = useState('')
  const [manualDespesasIds, setManualDespesasIds] = useState<string[]>([])

  useEffect(() => {
    if (showManualModal && !manualVenc) {
      const hoje = new Date()
      const next = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento || 5)
      if (next <= hoje) next.setMonth(next.getMonth() + 1)
      setManualVenc(next.toISOString().split('T')[0])
    }
  }, [showManualModal, diaVencimento, manualVenc])

  async function load() {
    if (!contratoId) return
    setLoading(true)
    const [{ data: cobs }, { data: desp }] = await Promise.all([
      supabase.from('contratos_cobrancas').select('*').eq('contrato_id', contratoId).order('vencimento', { ascending: false }),
      supabase.from('contratos_despesas').select('*').eq('contrato_id', contratoId).eq('abater_em', 'aluguel').is('cobranca_id', null).in('status', ['aprovada', 'executada']),
    ])
    setCobrancas((cobs || []) as ContratoCobranca[])
    setDespesasElegiveis((desp || []) as ContratoDespesa[])
    setLoading(false)
  }

  useEffect(() => { load() }, [contratoId])

  async function callFn(slug: string, body: any) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${SUPA_FN}/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
    return json
  }

  async function ativarRecorrencia() {
    setActing('sub')
    try {
      const r = await callFn('asaas-create-subscription', { contrato_id: contratoId })
      toast.success(`Cobrança recorrente ativada · ${fmtMoeda(r.valor)}/mês`)
      onSubscriptionCreated(r.subscription_id)
      load()
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setActing(null) }
  }

  async function gerarManual() {
    if (!manualVenc) { toast.error('Defina o vencimento'); return }
    setActing('manual')
    try {
      const r = await callFn('cobranca-gerar-uma', {
        contrato_id: contratoId,
        vencimento: manualVenc,
        valor_extras: manualExtras || 0,
        descricao_extras: manualDescExtras || undefined,
        valor_abatimento: manualAbat || 0,
        descricao_abatimento: manualDescAbat || undefined,
        despesas_ids: manualDespesasIds,
      })
      toast.success(`Cobrança gerada · ${fmtMoeda(r.valor_total)}`)
      setShowManualModal(false)
      setManualExtras(0); setManualAbat(0); setManualDescExtras(''); setManualDescAbat(''); setManualDespesasIds([])
      load()
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setActing(null) }
  }

  async function cancelar(c: ContratoCobranca) {
    if (!confirm('Cancelar essa cobrança no Asaas?')) return
    setActing(c.id)
    try {
      await callFn('cobranca-cancelar', { cobranca_id: c.id })
      toast.success('Cobrança cancelada')
      load()
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setActing(null) }
  }

  function copiarLink(url: string) {
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copiado'),
      () => toast.error('Não foi possível copiar')
    )
  }

  function abrirWhatsApp(c: ContratoCobranca) {
    if (!c.asaas_invoice_url) { toast.error('Cobrança sem link Asaas'); return }
    const tel = (locatarioTelefone || '').replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá! Segue o link para pagamento do aluguel ${c.referencia_mes ? `· ${c.referencia_mes} ` : ''}` +
      `(vencimento ${fmtData(c.vencimento)}, valor ${fmtMoeda(Number(c.valor_total ?? c.valor))}):\n\n${c.asaas_invoice_url}\n\nMoradda Imobiliária`
    )
    window.open(`https://wa.me/${tel ? '55' + tel : ''}?text=${msg}`, '_blank')
    // Marca whatsapp_enviado_em
    supabase.from('contratos_cobrancas').update({ whatsapp_enviado_em: new Date().toISOString() }).eq('id', c.id)
  }

  const ModoBtn = ({ m, label, icon }: { m: CobrancaModo; label: string; icon: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => onChangeModo(m)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${
        cobrancaModo === m
          ? 'border-moradda-blue-500 bg-moradda-blue-50 text-moradda-blue-700 dark:bg-moradda-blue-900/20 dark:text-moradda-blue-300'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  // Calcula preview de total no modal manual
  const despesasSelecionadas = despesasElegiveis.filter((d) => manualDespesasIds.includes(d.id))
  const extrasFromDespesas = despesasSelecionadas.filter((d) => d.quem_paga === 'locatario').reduce((s, d) => s + Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor), 0)
  const abatFromDespesas = despesasSelecionadas.filter((d) => d.quem_paga === 'locador').reduce((s, d) => s + Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor), 0)
  const totalPreview = Math.max(0, valorTotal + (Number(manualExtras) || 0) + extrasFromDespesas - (Number(manualAbat) || 0) - abatFromDespesas)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
        <CreditCard size={16} className="text-moradda-blue-500" />
        Cobranças
      </h2>

      {/* Modo */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Modo de cobrança</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ModoBtn m="desativada" label="Desativada" icon={<X size={16} />} />
          <ModoBtn m="manual" label="Manual" icon={<Hand size={16} />} />
          <ModoBtn m="automatica" label="Automática" icon={<Zap size={16} />} />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {cobrancaModo === 'desativada' && '— Sem cobrança automática nem manual.'}
          {cobrancaModo === 'manual' && '— Você gera cada cobrança individualmente quando quiser.'}
          {cobrancaModo === 'automatica' && '— Sistema gera cobrança no Asaas todo mês, considerando despesas aprovadas.'}
        </p>
      </div>

      {/* Ações */}
      {cobrancaModo === 'automatica' && (
        <div className="mb-5">
          {asaasSubscriptionId ? (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/40 dark:bg-green-900/20">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle2 size={15} /> Recorrência ativa
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 font-mono">{asaasSubscriptionId}</p>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400">Asaas gera mensal</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={ativarRecorrencia}
                disabled={acting === 'sub'}
                className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50"
              >
                {acting === 'sub' ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                Ativar recorrência Asaas
              </button>
              <button
                onClick={() => setShowManualModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-moradda-blue-300 bg-white px-4 py-2 text-sm font-medium text-moradda-blue-700 hover:bg-moradda-blue-50"
              >
                <Plus size={15} /> Gerar cobrança avulsa
              </button>
            </div>
          )}
        </div>
      )}

      {cobrancaModo === 'manual' && (
        <div className="mb-5">
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50"
          >
            <Plus size={15} />
            Gerar nova cobrança
          </button>
        </div>
      )}

      {/* Lista */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
          Histórico ({cobrancas.length})
        </h3>
        <button onClick={load} className="text-xs text-gray-500 hover:text-moradda-blue-600 inline-flex items-center gap-1">
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-moradda-blue-500" /></div>
      ) : cobrancas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Nenhuma cobrança gerada ainda.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Vencimento</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-left font-medium">Detalhes</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Pago em</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cobrancas.map((c) => {
                const total = Number(c.valor_total ?? c.valor) + Number(c.valor_extras || 0) - Number(c.valor_abatimento || 0)
                return (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                    <div>{fmtData(c.vencimento)}</div>
                    {c.referencia_mes && <div className="text-[10px] text-gray-500">{c.referencia_mes}</div>}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                    {fmtMoeda(c.valor_pago || c.valor_total || total)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Number(c.valor_extras || 0) > 0 && (
                        <span title={c.descricao_extras || ''} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          +{fmtMoeda(Number(c.valor_extras))}
                        </span>
                      )}
                      {Number(c.valor_abatimento || 0) > 0 && (
                        <span title={c.descricao_abatimento || ''} className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                          −{fmtMoeda(Number(c.valor_abatimento))}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[c.status] || 'bg-gray-100 text-gray-700'}`}>
                      {c.status === 'OVERDUE' && <AlertCircle size={10} />}
                      {(c.status === 'RECEIVED' || c.status === 'CONFIRMED' || c.status === 'paga' || c.status === 'pago') && <CheckCircle2 size={10} />}
                      {(c.status === 'PENDING' || c.status === 'pendente') && <Clock size={10} />}
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {c.pago_em ? fmtData(c.pago_em) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.asaas_invoice_url && (
                        <>
                          <a
                            href={c.asaas_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-moradda-blue-600 hover:underline"
                            title="Ver fatura"
                          >
                            <ExternalLink size={11} />
                          </a>
                          <button
                            onClick={() => copiarLink(c.asaas_invoice_url!)}
                            className="text-gray-400 hover:text-moradda-blue-600"
                            title="Copiar link"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            onClick={() => abrirWhatsApp(c)}
                            className="text-green-500 hover:text-green-700"
                            title="Enviar por WhatsApp"
                          >
                            <MessageCircle size={12} />
                          </button>
                        </>
                      )}
                      {(c.status === 'PENDING' || c.status === 'pendente' || c.status === 'OVERDUE') && (
                        <button
                          onClick={() => cancelar(c)}
                          disabled={acting === c.id}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                          title="Cancelar cobrança"
                        >
                          {acting === c.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => acting !== 'manual' && setShowManualModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
              Gerar cobrança {numeroContrato ? `· ${numeroContrato}` : ''}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Vencimento</label>
                <input type="date" value={manualVenc}
                  onChange={(e) => setManualVenc(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Extras (R$)</label>
                  <input type="number" step="0.01" value={manualExtras || ''}
                    onChange={(e) => setManualExtras(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Descrição extras</label>
                  <input type="text" value={manualDescExtras}
                    onChange={(e) => setManualDescExtras(e.target.value)}
                    placeholder="Ex: água, taxa de junho"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Abatimento (R$)</label>
                  <input type="number" step="0.01" value={manualAbat || ''}
                    onChange={(e) => setManualAbat(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Descrição abatimento</label>
                  <input type="text" value={manualDescAbat}
                    onChange={(e) => setManualDescAbat(e.target.value)}
                    placeholder="Ex: reembolso reparo"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>

              {/* Despesas elegíveis */}
              {despesasElegiveis.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Despesas pendentes elegíveis ({despesasElegiveis.length})
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    {despesasElegiveis.map((d) => {
                      const checked = manualDespesasIds.includes(d.id)
                      const v = Number(d.saldo_pendente && Number(d.saldo_pendente) > 0 ? d.saldo_pendente : d.valor)
                      return (
                        <label key={d.id} className="flex items-start gap-2 border-b border-gray-100 p-2 last:border-b-0 dark:border-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) setManualDespesasIds([...manualDespesasIds, d.id])
                              else setManualDespesasIds(manualDespesasIds.filter((id) => id !== d.id))
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 text-xs">
                            <div className="font-medium text-gray-800 dark:text-gray-200">{d.descricao}</div>
                            <div className="text-gray-500">
                              {DESPESA_TIPO_LABEL[d.tipo]} · {d.quem_paga === 'locatario' ? '+' : '−'}{fmtMoeda(v)}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Preview total */}
              <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/30">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aluguel + encargos</span>
                  <span className="font-medium">{fmtMoeda(valorTotal)}</span>
                </div>
                {(Number(manualExtras) > 0 || extrasFromDespesas > 0) && (
                  <div className="flex justify-between text-blue-700">
                    <span>Extras</span>
                    <span>+ {fmtMoeda(Number(manualExtras || 0) + extrasFromDespesas)}</span>
                  </div>
                )}
                {(Number(manualAbat) > 0 || abatFromDespesas > 0) && (
                  <div className="flex justify-between text-purple-700">
                    <span>Abatimento</span>
                    <span>− {fmtMoeda(Number(manualAbat || 0) + abatFromDespesas)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                  <span>Total</span>
                  <span className="text-moradda-blue-700">{fmtMoeda(totalPreview)}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowManualModal(false)} disabled={acting === 'manual'} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancelar
              </button>
              <button onClick={gerarManual} disabled={acting === 'manual'} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
                {acting === 'manual' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Gerar cobrança
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CobrancasSection
