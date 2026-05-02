import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus, Save, Trash2, Camera, ClipboardCheck, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Item {
  id?: string; comodo: string; item: string; estado: string; observacoes: string; fotos?: string[]
}

interface Vistoria {
  id?: string
  contrato_id: string
  imovel_id: string
  tipo: 'entrada' | 'saida'
  realizada_em?: string
  estado_geral?: string
  observacoes?: string
  finalizada?: boolean
}

const COMODOS = ['Sala', 'Cozinha', 'Quarto 1', 'Quarto 2', 'Banheiro', 'Área de Serviço', 'Externa', 'Outros']
const ESTADOS = [
  { v: 'otimo', l: 'Ótimo', cor: 'bg-green-100 text-green-700' },
  { v: 'bom', l: 'Bom', cor: 'bg-blue-100 text-blue-700' },
  { v: 'regular', l: 'Regular', cor: 'bg-amber-100 text-amber-700' },
  { v: 'ruim', l: 'Ruim', cor: 'bg-orange-100 text-orange-700' },
  { v: 'avariado', l: 'Avariado', cor: 'bg-red-100 text-red-700' },
]

const ITEMS_PADRAO = ['Pintura', 'Piso', 'Janelas/Vidros', 'Portas', 'Tomadas/Interruptores', 'Iluminação', 'Hidráulica', 'Mobiliário fixo', 'Limpeza geral']

export const VistoriaListPage = () => {
  const [vistorias, setVistorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('vistorias').select('*, contratos_locacao(numero, imoveis(codigo, titulo))').order('realizada_em', { ascending: false }).then(({ data }) => {
      setVistorias(data || []); setLoading(false)
    })
  }, [])
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vistorias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Entrada e saída · checklist por cômodo + fotos</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : vistorias.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <ClipboardCheck size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700">Nenhuma vistoria</h3>
          <p className="text-sm text-gray-500 mt-1">Acesse um contrato → "Nova Vistoria" pra começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vistorias.map((v) => (
            <Link key={v.id} to={`/painel/vistorias/${v.id}`} className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium">{v.contratos_locacao?.numero} · {v.contratos_locacao?.imoveis?.codigo}</p>
                  <p className="text-xs text-gray-500">Vistoria de {v.tipo} · {v.realizada_em ? new Date(v.realizada_em).toLocaleDateString('pt-BR') : '—'}</p>
                </div>
                {v.finalizada && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Finalizada</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export const VistoriaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(!isNew)
  const [v, setV] = useState<Vistoria>({ contrato_id: '', imovel_id: '', tipo: 'entrada' })
  const [itens, setItens] = useState<Item[]>([])
  const [contratos, setContratos] = useState<any[]>([])

  useEffect(() => {
    supabase.from('contratos_locacao').select('id, numero, imovel_id, imoveis(codigo, titulo)').eq('status', 'ativo').then(({ data }) => setContratos(data || []))
    if (isNew) return
    Promise.all([
      supabase.from('vistorias').select('*').eq('id', id).single(),
      supabase.from('vistorias_itens').select('*').eq('vistoria_id', id).order('ordem'),
    ]).then(([vist, its]) => {
      if (vist.data) setV(vist.data as Vistoria)
      setItens((its.data || []) as Item[])
      setLoading(false)
    })
  }, [id, isNew])

  function adicionarPadrao() {
    const novos: Item[] = []
    for (const c of COMODOS.slice(0, 3)) {
      for (const it of ITEMS_PADRAO) {
        novos.push({ comodo: c, item: it, estado: 'bom', observacoes: '' })
      }
    }
    setItens(novos)
  }

  async function uploadFoto(idx: number, file: File) {
    const path = `vistorias/${v.id || 'temp'}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('imoveis').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro upload: ' + error.message); return }
    const { data: pub } = supabase.storage.from('imoveis').getPublicUrl(path)
    setItens((p) => p.map((it, i) => i === idx ? { ...it, fotos: [...(it.fotos || []), pub.publicUrl] } : it))
  }

  async function save(finalizar = false) {
    if (!v.contrato_id) { toast.error('Selecione o contrato'); return }
    let vid = v.id
    if (!vid) {
      const { data, error } = await supabase.from('vistorias').insert({
        contrato_id: v.contrato_id, imovel_id: v.imovel_id, tipo: v.tipo,
        estado_geral: v.estado_geral, observacoes: v.observacoes,
        finalizada: finalizar, responsavel_id: profile?.id,
      }).select().single()
      if (error) { toast.error('Erro: ' + error.message); return }
      vid = data.id
      setV({ ...v, id: vid })
    } else {
      await supabase.from('vistorias').update({
        estado_geral: v.estado_geral, observacoes: v.observacoes, finalizada: finalizar,
      }).eq('id', vid)
    }
    if (vid) {
      await supabase.from('vistorias_itens').delete().eq('vistoria_id', vid)
      if (itens.length > 0) {
        await supabase.from('vistorias_itens').insert(itens.map((it, idx) => ({
          vistoria_id: vid, comodo: it.comodo, item: it.item,
          estado: it.estado, observacoes: it.observacoes, fotos: it.fotos || null, ordem: idx,
        })))
      }
    }
    toast.success(finalizar ? 'Vistoria finalizada' : 'Salvo')
    if (isNew) navigate(`/painel/vistorias/${vid}`, { replace: true })
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" /></div>

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/vistorias" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold">Vistoria de {v.tipo === 'entrada' ? 'Entrada' : 'Saída'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save(false)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm">
            <Save size={15} /> Salvar
          </button>
          <button onClick={() => save(true)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">
            <ClipboardCheck size={15} /> Finalizar
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs uppercase text-gray-600 mb-1 block">Contrato</label>
            <select className={inputCls} value={v.contrato_id} onChange={(e) => {
              const c = contratos.find((x) => x.id === e.target.value)
              setV({ ...v, contrato_id: e.target.value, imovel_id: c?.imovel_id || '' })
            }}>
              <option value="">Selecione...</option>
              {contratos.map((c) => <option key={c.id} value={c.id}>{c.numero} · {c.imoveis?.codigo}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-gray-600 mb-1 block">Tipo</label>
            <select className={inputCls} value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value as any })}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-gray-600 mb-1 block">Estado geral</label>
            <select className={inputCls} value={v.estado_geral || ''} onChange={(e) => setV({ ...v, estado_geral: e.target.value })}>
              <option value="">—</option>
              {ESTADOS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs uppercase text-gray-600 mb-1 block">Observações gerais</label>
            <textarea rows={2} className={inputCls} value={v.observacoes || ''} onChange={(e) => setV({ ...v, observacoes: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">Checklist por Cômodo</h2>
          <div className="flex gap-2">
            {itens.length === 0 && (
              <button onClick={adicionarPadrao} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100">
                <Plus size={12} /> Carregar padrão
              </button>
            )}
            <button onClick={() => setItens([...itens, { comodo: 'Sala', item: '', estado: 'bom', observacoes: '' }])} className="inline-flex items-center gap-1 rounded-lg bg-moradda-blue-500 px-3 py-1.5 text-xs text-white">
              <Plus size={12} /> Item
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {itens.map((it, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-start">
                <select className={`sm:col-span-2 ${inputCls}`} value={it.comodo} onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, comodo: e.target.value } : x))}>
                  {COMODOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className={`sm:col-span-3 ${inputCls}`} placeholder="Item" value={it.item} onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, item: e.target.value } : x))} />
                <select className={`sm:col-span-2 ${inputCls}`} value={it.estado} onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, estado: e.target.value } : x))}>
                  {ESTADOS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
                <input className={`sm:col-span-3 ${inputCls}`} placeholder="Observações" value={it.observacoes} onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, observacoes: e.target.value } : x))} />
                <div className="sm:col-span-2 flex items-center gap-1">
                  <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs hover:bg-gray-50">
                    <Upload size={11} className="inline" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                      Array.from(e.target.files || []).forEach((f) => uploadFoto(idx, f))
                    }} />
                  </label>
                  {it.fotos && it.fotos.length > 0 && <span className="text-xs text-blue-600"><Camera size={11} className="inline" /> {it.fotos.length}</span>}
                  <button onClick={() => setItens(itens.filter((_, i) => i !== idx))} className="rounded-lg p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
              {it.fotos && it.fotos.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {it.fotos.map((url, i) => (
                    <img key={i} src={url} alt="" className="h-20 w-20 rounded object-cover" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
