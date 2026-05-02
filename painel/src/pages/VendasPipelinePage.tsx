import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fmtMoeda } from '@/lib/contratos'
import type { VendaStatus } from '@/lib/vendas'
import { VENDA_STATUS_LABEL, VENDA_STATUS_COR } from '@/lib/vendas'

interface Venda {
  id: string
  numero: string
  status: VendaStatus
  valor_venda: number
  comprador_nome: string
  imoveis?: { codigo?: string; titulo?: string } | null
}

const COLS: VendaStatus[] = [
  'em_negociacao', 'proposta_aceita', 'documentacao',
  'aguardando_financiamento', 'aguardando_assinatura', 'aguardando_escritura', 'concluida',
]

const VendasPipelinePage = () => {
  const [rows, setRows] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [drag, setDrag] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('vendas').select('id, numero, status, valor_venda, comprador_nome, imoveis(codigo, titulo)').neq('status', 'cancelada').order('created_at', { ascending: false })
    setRows((data || []) as Venda[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function moveTo(id: string, novo: VendaStatus) {
    const atual = rows.find((r) => r.id === id)
    if (!atual || atual.status === novo) return
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: novo } : r))
    const { error } = await supabase.from('vendas').update({ status: novo }).eq('id', id)
    if (error) {
      toast.error('Erro: ' + error.message)
      load()
    } else {
      toast.success('Movido')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/vendas" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pipeline de Vendas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Arraste cards entre colunas pra mudar o status</p>
          </div>
        </div>
        <Link to="/painel/vendas/novo" className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} /> Nova Venda
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {COLS.map((col) => {
              const items = rows.filter((r) => r.status === col)
              const total = items.reduce((s, v) => s + Number(v.valor_venda), 0)
              return (
                <div key={col}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (drag) { moveTo(drag, col); setDrag(null) } }}
                  className="w-72 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${VENDA_STATUS_COR[col]}`}>
                    {VENDA_STATUS_LABEL[col]} · {items.length}
                  </div>
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{fmtMoeda(total)}</p>
                  <div className="space-y-2">
                    {items.map((r) => (
                      <div
                        key={r.id}
                        draggable
                        onDragStart={() => setDrag(r.id)}
                        onDragEnd={() => setDrag(null)}
                        className={`cursor-move rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition dark:border-gray-700 dark:bg-gray-800 ${drag === r.id ? 'opacity-50' : ''}`}
                      >
                        <Link to={`/painel/vendas/${r.id}`} className="block">
                          <p className="font-mono text-xs text-moradda-blue-600">{r.numero}</p>
                          <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{r.imoveis?.codigo || '—'}</p>
                          <p className="text-xs text-gray-500">{r.imoveis?.titulo || ''}</p>
                          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{r.comprador_nome}</p>
                          <p className="mt-2 text-sm font-bold text-green-700 dark:text-green-400">{fmtMoeda(r.valor_venda)}</p>
                        </Link>
                      </div>
                    ))}
                    {items.length === 0 && <p className="py-4 text-center text-xs text-gray-400">Vazio</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default VendasPipelinePage
