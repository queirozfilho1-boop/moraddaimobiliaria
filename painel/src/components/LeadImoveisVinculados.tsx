import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Plus, Search, X, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fmtMoeda } from '@/lib/contratos'

type Papel = 'interesse' | 'captacao'

interface Vinculo {
  id: string
  imovel_id: string
  papel: Papel
  observacao: string | null
  imovel: {
    id: string
    codigo: string
    titulo: string
    preco: number | null
    tipo: string | null
    finalidade: string | null
    status: string | null
    foto_url: string | null
  } | null
}

interface ImovelOpcao {
  id: string
  codigo: string
  titulo: string
  preco: number | null
  status: string
}

interface Props {
  leadId: string
  leadNome: string
  leadTipo: 'comprar' | 'vender' | 'alugar_imovel' | 'alugar_meu_imovel'
  onCaptarNovo?: () => void
}

const isCaptador = (t: string) => t === 'vender' || t === 'alugar_meu_imovel'

export default function LeadImoveisVinculados({ leadId, leadTipo, leadNome, onCaptarNovo }: Props) {
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [busca, setBusca] = useState('')
  const [opcoes, setOpcoes] = useState<ImovelOpcao[]>([])
  const [buscando, setBuscando] = useState(false)

  const papelDefault: Papel = isCaptador(leadTipo) ? 'captacao' : 'interesse'

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads_imoveis')
      .select(`
        id, imovel_id, papel, observacao,
        imovel:imoveis (
          id, codigo, titulo, preco, tipo, finalidade, status,
          imoveis_fotos (url_thumb, url, ordem, principal)
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const mapped = data.map((v: any) => {
        const fotos = (v.imovel?.imoveis_fotos as any[]) || []
        const principal = fotos.find((f) => f.principal) || fotos.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))[0]
        return {
          ...v,
          imovel: v.imovel ? {
            ...v.imovel,
            foto_url: principal?.url_thumb || principal?.url || null,
          } : null,
        }
      })
      setVinculos(mapped as Vinculo[])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [leadId])

  async function buscar(q: string) {
    setBusca(q)
    if (q.trim().length < 2) {
      setOpcoes([])
      return
    }
    setBuscando(true)
    const { data } = await supabase
      .from('imoveis')
      .select('id, codigo, titulo, preco, status')
      .or(`codigo.ilike.%${q}%,titulo.ilike.%${q}%`)
      .neq('status', 'inativo')
      .order('created_at', { ascending: false })
      .limit(20)
    const ids = vinculos.map(v => v.imovel_id)
    setOpcoes((data || []).filter(o => !ids.includes(o.id)))
    setBuscando(false)
  }

  async function vincular(imovelId: string) {
    const { error } = await supabase.from('leads_imoveis').insert({
      lead_id: leadId,
      imovel_id: imovelId,
      papel: papelDefault,
    })
    if (error) { toast.error('Erro ao vincular: ' + error.message); return }
    toast.success('Imóvel vinculado!')
    setShowModal(false)
    setBusca('')
    setOpcoes([])
    load()
  }

  async function desvincular(vinculoId: string) {
    if (!confirm('Remover vínculo?')) return
    const { error } = await supabase.from('leads_imoveis').delete().eq('id', vinculoId)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Vínculo removido')
    load()
  }

  const titulo = isCaptador(leadTipo) ? 'Imóveis em captação' : 'Imóveis de interesse'
  const subtitulo = isCaptador(leadTipo)
    ? `Imóveis pertencentes a ${leadNome}`
    : `Imóveis que ${leadNome} tem interesse`

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900/40 dark:bg-cyan-900/10">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300">{titulo}</p>
          <p className="text-[10px] text-cyan-600 dark:text-cyan-400">{subtitulo}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-50 dark:bg-gray-800 dark:text-cyan-300 dark:ring-cyan-800"
          >
            <Plus size={12} /> Vincular
          </button>
          {isCaptador(leadTipo) && onCaptarNovo && (
            <button
              onClick={onCaptarNovo}
              className="inline-flex items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-xs font-medium text-white hover:bg-cyan-700"
            >
              <Building2 size={12} /> Captar novo
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-2 text-center"><Loader2 size={14} className="inline animate-spin text-cyan-500" /></div>
      ) : vinculos.length === 0 ? (
        <p className="py-2 text-center text-xs italic text-cyan-600/70 dark:text-cyan-400/70">
          {isCaptador(leadTipo)
            ? 'Nenhum imóvel captado ainda. Clique em "Captar novo" pra cadastrar.'
            : 'Nenhum imóvel vinculado. Clique em "Vincular" pra adicionar.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {vinculos.map((v) => (
            <div key={v.id} className="group relative flex gap-2 rounded-md bg-white p-2 ring-1 ring-cyan-100 dark:bg-gray-800 dark:ring-cyan-900/40">
              {v.imovel?.foto_url ? (
                <img src={v.imovel.foto_url} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700"><Home size={20} className="text-gray-400" /></div>
              )}
              <div className="min-w-0 flex-1">
                <Link to={`/painel/imoveis/${v.imovel_id}`} className="text-xs font-semibold text-gray-800 hover:text-cyan-600 dark:text-gray-100 line-clamp-1">
                  {v.imovel?.codigo} · {v.imovel?.titulo}
                </Link>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {v.imovel?.preco ? fmtMoeda(v.imovel.preco) : '—'} · {v.imovel?.status}
                </p>
                <span className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                  v.papel === 'captacao'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {v.papel === 'captacao' ? 'Captação' : 'Interesse'}
                </span>
              </div>
              <button
                onClick={() => desvincular(v.id)}
                className="absolute right-1 top-1 rounded p-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                title="Remover vínculo"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de busca */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Vincular imóvel ao lead</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                autoFocus
                value={busca}
                onChange={(e) => buscar(e.target.value)}
                placeholder="Buscar por código (MRD-00001) ou título..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            {buscando ? (
              <div className="py-8 text-center"><Loader2 size={20} className="inline animate-spin text-cyan-500" /></div>
            ) : opcoes.length === 0 && busca.length >= 2 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhum imóvel encontrado</p>
            ) : opcoes.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-1.5">
                {opcoes.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => vincular(o.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-cyan-400 hover:bg-cyan-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-cyan-600"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{o.codigo} · {o.titulo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{o.preco ? fmtMoeda(o.preco) : '—'} · {o.status}</p>
                    </div>
                    <Plus size={14} className="text-cyan-500" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Digite ao menos 2 caracteres pra buscar</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
