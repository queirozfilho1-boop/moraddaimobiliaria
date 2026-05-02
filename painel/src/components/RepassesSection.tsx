import { useEffect, useState } from 'react'
import { Wallet, RefreshCw, Loader2, CheckCircle2, Clock, AlertCircle, Send, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fmtData, fmtMoeda } from '@/lib/contratos'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

interface Repasse {
  id: string
  cobranca_id: string | null
  proprietario_id: string
  valor_bruto: number
  taxa_admin: number
  outros_descontos: number
  valor_repasse: number
  modo: 'split' | 'transfer' | 'manual'
  status: 'pendente' | 'processando' | 'concluido' | 'falhou'
  asaas_transfer_id: string | null
  data_referencia: string
  data_repasse: string | null
  proprietarios?: { nome: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  processando: 'Processando',
  concluido: 'Concluído',
  falhou: 'Falhou',
}
const STATUS_COR: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  processando: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  concluido: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  falhou: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const RepassesSection = ({ contratoId }: { contratoId: string }) => {
  const [repasses, setRepasses] = useState<Repasse[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('contratos_repasses')
      .select(`*, proprietarios(nome)`)
      .eq('contrato_id', contratoId)
      .order('data_referencia', { ascending: false })
    setRepasses((data || []) as Repasse[])
    setLoading(false)
  }
  useEffect(() => { load() }, [contratoId])

  async function executarRepasse(r: Repasse) {
    setActing(r.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/asaas-execute-repasse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ repasse_id: r.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success('Repasse enviado · ID ' + (data.transfer_id || ''))
      load()
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setActing(null) }
  }

  const totalRepassado = repasses.filter((r) => r.status === 'concluido').reduce((s, r) => s + Number(r.valor_repasse), 0)
  const pendente = repasses.filter((r) => r.status === 'pendente').reduce((s, r) => s + Number(r.valor_repasse), 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
          <Wallet size={16} className="text-moradda-blue-500" />
          Repasses ao Proprietário
        </h2>
        <button onClick={load} className="text-xs text-gray-500 hover:text-moradda-blue-600 inline-flex items-center gap-1">
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>

      {/* Resumo */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-xs text-green-700 dark:text-green-400">Repassado</p>
          <p className="text-lg font-bold text-green-800 dark:text-green-300">{fmtMoeda(totalRepassado)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
          <p className="text-xs text-amber-700 dark:text-amber-400">Pendente</p>
          <p className="text-lg font-bold text-amber-800 dark:text-amber-300">{fmtMoeda(pendente)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-moradda-blue-500" /></div>
      ) : repasses.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Nenhum repasse gerado ainda. Repasses são criados automaticamente quando o inquilino paga uma cobrança.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Referência</th>
                <th className="px-3 py-2 text-left font-medium">Proprietário</th>
                <th className="px-3 py-2 text-right font-medium">Bruto</th>
                <th className="px-3 py-2 text-right font-medium">Taxa adm</th>
                <th className="px-3 py-2 text-right font-medium">Repasse</th>
                <th className="px-3 py-2 text-left font-medium">Modo</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {repasses.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{fmtData(r.data_referencia)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{r.proprietarios?.nome || '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmtMoeda(r.valor_bruto)}</td>
                  <td className="px-3 py-2 text-right text-amber-700">- {fmtMoeda(r.taxa_admin)}</td>
                  <td className="px-3 py-2 text-right font-medium text-green-700 dark:text-green-400">{fmtMoeda(r.valor_repasse)}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{r.modo}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[r.status]}`}>
                      {r.status === 'concluido' && <CheckCircle2 size={10} />}
                      {r.status === 'pendente' && <Clock size={10} />}
                      {r.status === 'falhou' && <AlertCircle size={10} />}
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.status === 'pendente' && r.modo === 'transfer' && (
                      <button onClick={() => executarRepasse(r)} disabled={acting === r.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-moradda-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
                        {acting === r.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        Executar
                      </button>
                    )}
                    {r.asaas_transfer_id && (
                      <a href={`https://www.asaas.com/transfers/${r.asaas_transfer_id}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-moradda-blue-600 hover:underline">
                        Asaas <ExternalLink size={10} />
                      </a>
                    )}
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

export default RepassesSection
