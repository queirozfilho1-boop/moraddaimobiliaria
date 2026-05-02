import { useEffect, useState } from 'react'
import { CreditCard, Loader2, Plus, RefreshCw, Zap, Hand, X, ExternalLink, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fmtMoeda, fmtData } from '@/lib/contratos'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

type CobrancaModo = 'desativada' | 'manual' | 'automatica'

interface Cobranca {
  id: string
  asaas_payment_id: string | null
  asaas_invoice_url: string | null
  asaas_bank_slip_url: string | null
  valor: number
  vencimento: string
  status: string
  pago_em: string | null
  valor_pago: number | null
  created_at: string
}

interface Props {
  contratoId: string
  cobrancaModo: CobrancaModo
  asaasSubscriptionId?: string | null
  valorTotal: number
  diaVencimento: number
  onChangeModo: (m: CobrancaModo) => void
  onSubscriptionCreated: (id: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  OVERDUE: 'Vencido',
  REFUNDED: 'Estornado',
  RECEIVED_IN_CASH: 'Pago em dinheiro',
  AWAITING_RISK_ANALYSIS: 'Em análise',
}
const STATUS_COR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  RECEIVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

const CobrancasSection = ({ contratoId, cobrancaModo, asaasSubscriptionId, valorTotal, diaVencimento, onChangeModo, onSubscriptionCreated }: Props) => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualValor, setManualValor] = useState(valorTotal)
  const [manualVenc, setManualVenc] = useState('')

  useEffect(() => { setManualValor(valorTotal) }, [valorTotal])
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
    const { data } = await supabase
      .from('contratos_cobrancas')
      .select('*')
      .eq('contrato_id', contratoId)
      .order('vencimento', { ascending: false })
    setCobrancas((data || []) as Cobranca[])
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
    setActing(true)
    try {
      const r = await callFn('asaas-create-subscription', { contrato_id: contratoId })
      toast.success(`Cobrança recorrente ativada · ${fmtMoeda(r.valor)}/mês`)
      onSubscriptionCreated(r.subscription_id)
      load()
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setActing(false) }
  }

  async function gerarManual() {
    if (!manualValor || manualValor <= 0) { toast.error('Defina um valor'); return }
    if (!manualVenc) { toast.error('Defina o vencimento'); return }
    setActing(true)
    try {
      const r = await callFn('asaas-create-payment', {
        contrato_id: contratoId,
        valor: manualValor,
        vencimento: manualVenc,
      })
      toast.success(`Cobrança gerada · ${fmtMoeda(r.valor)}`)
      setShowManualModal(false)
      load()
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setActing(false) }
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
          {cobrancaModo === 'manual' && '— Você gera cada cobrança individualmente, no Asaas, quando quiser.'}
          {cobrancaModo === 'automatica' && '— Asaas gera boleto + PIX todo mês automaticamente, no dia ' + diaVencimento + '.'}
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
            <button
              onClick={ativarRecorrencia}
              disabled={acting}
              className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50"
            >
              {acting ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              Ativar cobrança recorrente
            </button>
          )}
        </div>
      )}

      {cobrancaModo === 'manual' && (
        <div className="mb-5">
          <button
            onClick={() => setShowManualModal(true)}
            disabled={acting}
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
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Pago em</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cobrancas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{fmtData(c.vencimento)}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                    {fmtMoeda(c.valor_pago || c.valor)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[c.status] || 'bg-gray-100 text-gray-700'}`}>
                      {c.status === 'OVERDUE' && <AlertCircle size={10} />}
                      {(c.status === 'RECEIVED' || c.status === 'CONFIRMED') && <CheckCircle2 size={10} />}
                      {c.status === 'PENDING' && <Clock size={10} />}
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {c.pago_em ? fmtData(c.pago_em) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {c.asaas_invoice_url && (
                      <a href={c.asaas_invoice_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-moradda-blue-600 hover:underline">
                        Ver fatura <ExternalLink size={11} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowManualModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Gerar cobrança manual</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Valor</label>
                <input type="number" step="0.01" value={manualValor || ''}
                  onChange={(e) => setManualValor(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Vencimento</label>
                <input type="date" value={manualVenc}
                  onChange={(e) => setManualVenc(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowManualModal(false)} disabled={acting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancelar
              </button>
              <button onClick={gerarManual} disabled={acting} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
                {acting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
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
