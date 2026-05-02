import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Save, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface Banner {
  id: string; titulo: string; subtitulo?: string | null; imagem_url?: string | null
  link?: string | null; ativo: boolean; ordem: number
}

export default function BannersPage() {
  const [rows, setRows] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<Banner | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('ordem')
    setRows((data || []) as Banner[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleAtivo(b: Banner) {
    await supabase.from('banners').update({ ativo: !b.ativo }).eq('id', b.id)
    load()
  }

  async function remover(b: Banner) {
    if (!confirm(`Remover banner "${b.titulo}"?`)) return
    await supabase.from('banners').delete().eq('id', b.id)
    toast.success('Removido')
    load()
  }

  async function moverOrdem(b: Banner, dir: 'up' | 'down') {
    const idx = rows.findIndex((r) => r.id === b.id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= rows.length) return
    const other = rows[swap]
    await supabase.from('banners').update({ ordem: other.ordem }).eq('id', b.id)
    await supabase.from('banners').update({ ordem: b.ordem }).eq('id', other.id)
    load()
  }

  async function uploadImagem(file: File): Promise<string | null> {
    const path = `banners/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('imoveis').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro upload: ' + error.message); return null }
    const { data } = supabase.storage.from('imoveis').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Banners do Site</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Banners exibidos na página inicial · controle de ativo/ordem</p>
        </div>
        <button onClick={() => setShowModal({ id: '', titulo: '', subtitulo: '', imagem_url: '', link: '', ativo: true, ordem: rows.length + 1 })} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} /> Novo Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <ImageIcon size={40} className="mx-auto text-gray-400" />
          <p className="mt-4 text-base font-semibold text-gray-700">Sem banners</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b, i) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moverOrdem(b, 'up')} disabled={i === 0} className="text-gray-400 hover:text-moradda-blue-600 disabled:opacity-30">▲</button>
                <button onClick={() => moverOrdem(b, 'down')} disabled={i === rows.length - 1} className="text-gray-400 hover:text-moradda-blue-600 disabled:opacity-30">▼</button>
              </div>
              {b.imagem_url ? (
                <img src={b.imagem_url} alt="" className="h-16 w-28 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-28 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><ImageIcon size={20} className="text-gray-400" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100">{b.titulo}</p>
                {b.subtitulo && <p className="text-xs text-gray-500">{b.subtitulo}</p>}
                {b.link && <p className="text-xs text-blue-600 truncate">{b.link}</p>}
              </div>
              <button onClick={() => toggleAtivo(b)} className={`rounded-lg p-2 ${b.ativo ? 'text-green-600' : 'text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-700`}>
                {b.ativo ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={() => setShowModal(b)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">Editar</button>
              <button onClick={() => remover(b)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BannerModal banner={showModal} onClose={() => setShowModal(null)} onSaved={() => { setShowModal(null); load() }} uploadImagem={uploadImagem} />
      )}
    </div>
  )
}

const BannerModal = ({ banner, onClose, onSaved, uploadImagem }: any) => {
  const [b, setB] = useState<Banner>(banner)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!b.titulo) { toast.error('Título obrigatório'); return }
    setSaving(true)
    let err
    if (b.id) {
      err = (await supabase.from('banners').update({ titulo: b.titulo, subtitulo: b.subtitulo, imagem_url: b.imagem_url, link: b.link, ativo: b.ativo, ordem: b.ordem }).eq('id', b.id)).error
    } else {
      err = (await supabase.from('banners').insert({ titulo: b.titulo, subtitulo: b.subtitulo, imagem_url: b.imagem_url, link: b.link, ativo: b.ativo, ordem: b.ordem })).error
    }
    setSaving(false)
    if (err) { toast.error('Erro: ' + err.message); return }
    toast.success('Salvo')
    onSaved()
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">{b.id ? 'Editar' : 'Novo'} Banner</h2>
        <div className="space-y-3">
          <div><label className="text-xs uppercase mb-1 block">Título</label><input className={inputCls} value={b.titulo} onChange={(e) => setB({ ...b, titulo: e.target.value })} /></div>
          <div><label className="text-xs uppercase mb-1 block">Subtítulo</label><input className={inputCls} value={b.subtitulo || ''} onChange={(e) => setB({ ...b, subtitulo: e.target.value })} /></div>
          <div>
            <label className="text-xs uppercase mb-1 block">Imagem</label>
            {b.imagem_url && <img src={b.imagem_url} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />}
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">
              <Upload size={12} /> {b.imagem_url ? 'Trocar imagem' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return
                const url = await uploadImagem(f); if (url) setB({ ...b, imagem_url: url })
              }} />
            </label>
          </div>
          <div><label className="text-xs uppercase mb-1 block">Link (opcional)</label><input className={inputCls} placeholder="/imoveis ou https://..." value={b.link || ''} onChange={(e) => setB({ ...b, link: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.ativo} onChange={(e) => setB({ ...b, ativo: e.target.checked })} /> Ativo</label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancelar</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-moradda-blue-600 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
