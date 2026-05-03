import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, X, Loader2, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface Vinculo {
  id: string
  lead_id: string
  papel: 'interesse' | 'captacao'
  lead: {
    id: string
    nome: string
    telefone: string
    email: string | null
    tipo: string
    status: string
    corretor_id: string | null
  } | null
}

const tipoLabel: Record<string, string> = {
  comprar: 'Comprar', vender: 'Vender',
  alugar_imovel: 'Inquilino', alugar_meu_imovel: 'Locador',
}

export default function ImovelLeadsRelacionados({ imovelId }: { imovelId: string }) {
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('leads_imoveis')
      .select(`
        id, lead_id, papel,
        lead:leads (id, nome, telefone, email, tipo, status, corretor_id)
      `)
      .eq('imovel_id', imovelId)
      .order('created_at', { ascending: false })
    const mapped = (data || []).map((row: any) => ({
      ...row,
      lead: Array.isArray(row.lead) ? row.lead[0] : row.lead,
    }))
    setVinculos(mapped as Vinculo[])
    setLoading(false)
  }

  useEffect(() => { load() }, [imovelId])

  async function desvincular(id: string) {
    if (!confirm('Remover vínculo?')) return
    const { error } = await supabase.from('leads_imoveis').delete().eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Removido')
    load()
  }

  const interessados = vinculos.filter(v => v.papel === 'interesse')
  const captacao = vinculos.filter(v => v.papel === 'captacao')

  if (loading) return <div className="py-3 text-center"><Loader2 size={16} className="inline animate-spin text-gray-400" /></div>
  if (vinculos.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center gap-2">
        <Users size={16} className="text-moradda-blue-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Leads relacionados ({vinculos.length})
        </h3>
      </div>

      {captacao.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            Captação · proprietário
          </p>
          <div className="space-y-1.5">
            {captacao.map(v => <LeadCard key={v.id} v={v} onRemove={desvincular} />)}
          </div>
        </div>
      )}

      {interessados.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Interesse · {interessados.length} {interessados.length === 1 ? 'pessoa' : 'pessoas'}
          </p>
          <div className="space-y-1.5">
            {interessados.map(v => <LeadCard key={v.id} v={v} onRemove={desvincular} />)}
          </div>
        </div>
      )}
    </div>
  )
}

const LeadCard = ({ v, onRemove }: { v: Vinculo; onRemove: (id: string) => void }) => (
  <div className="group flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40">
    <div className="min-w-0 flex-1">
      <Link to={`/painel/leads?lead=${v.lead_id}`} className="text-sm font-medium text-gray-800 hover:text-moradda-blue-500 dark:text-gray-100">
        {v.lead?.nome}
      </Link>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-500 dark:text-gray-400">
        {v.lead?.telefone && <span className="inline-flex items-center gap-0.5"><Phone size={9} /> {v.lead.telefone}</span>}
        {v.lead?.email && <span className="inline-flex items-center gap-0.5 truncate"><Mail size={9} /> {v.lead.email}</span>}
        {v.lead?.tipo && <span>· {tipoLabel[v.lead.tipo] || v.lead.tipo}</span>}
        {v.lead?.status && <span>· {v.lead.status}</span>}
      </div>
    </div>
    <button
      onClick={() => onRemove(v.id)}
      className="rounded p-1 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
      title="Remover vínculo"
    >
      <X size={12} />
    </button>
  </div>
)
