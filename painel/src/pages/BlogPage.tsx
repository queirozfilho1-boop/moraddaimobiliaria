import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Save, Eye, EyeOff, FileText, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Post {
  id: string; titulo: string; slug?: string | null; conteudo?: string | null
  resumo?: string | null; imagem_capa?: string | null; categoria?: string | null
  publicado: boolean; autor_id?: string | null
  created_at: string
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function BlogPage() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<Post | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setRows((data || []) as Post[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function togglePublicado(p: Post) {
    await supabase.from('blog_posts').update({ publicado: !p.publicado }).eq('id', p.id)
    load()
  }

  async function remover(p: Post) {
    if (!confirm(`Remover post "${p.titulo}"?`)) return
    await supabase.from('blog_posts').delete().eq('id', p.id)
    load()
  }

  async function uploadCapa(file: File): Promise<string | null> {
    const path = `blog/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('imoveis').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro: ' + error.message); return null }
    const { data } = supabase.storage.from('imoveis').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Blog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Posts publicados em moraddaimobiliaria.com.br/blog</p>
        </div>
        <button onClick={() => setShowModal({ id: '', titulo: '', publicado: false, created_at: '' })} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} /> Novo Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <FileText size={40} className="mx-auto text-gray-400" />
          <p className="mt-4 text-base font-semibold text-gray-700">Nenhum post</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start gap-3">
                {p.imagem_capa ? (
                  <img src={p.imagem_capa} alt="" className="h-20 w-32 rounded-lg object-cover" />
                ) : (
                  <div className="h-20 w-32 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><FileText size={20} className="text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">{p.titulo}</h3>
                    {p.publicado ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Publicado</span>
                                   : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Rascunho</span>}
                    {p.categoria && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{p.categoria}</span>}
                  </div>
                  {p.resumo && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.resumo}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => togglePublicado(p)} className={`rounded-lg p-2 ${p.publicado ? 'text-green-600' : 'text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-700`}>
                    {p.publicado ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => setShowModal(p)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">Editar</button>
                  <button onClick={() => remover(p)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PostModal post={showModal} autorId={profile?.id} onClose={() => setShowModal(null)} onSaved={() => { setShowModal(null); load() }} uploadCapa={uploadCapa} />
      )}
    </div>
  )
}

const PostModal = ({ post, autorId, onClose, onSaved, uploadCapa }: any) => {
  const [p, setP] = useState<Post>(post)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!p.titulo) { toast.error('Título obrigatório'); return }
    setSaving(true)
    const slug = p.slug || slugify(p.titulo)
    const data = { titulo: p.titulo, slug, conteudo: p.conteudo, resumo: p.resumo, imagem_capa: p.imagem_capa, categoria: p.categoria, publicado: p.publicado, autor_id: autorId }
    const { error } = p.id
      ? await supabase.from('blog_posts').update(data).eq('id', p.id)
      : await supabase.from('blog_posts').insert(data)
    setSaving(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Salvo')
    onSaved()
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">{p.id ? 'Editar' : 'Novo'} Post</h2>
        <div className="space-y-3">
          <div><label className="text-xs uppercase mb-1 block">Título</label><input className={inputCls} value={p.titulo} onChange={(e) => setP({ ...p, titulo: e.target.value })} /></div>
          <div><label className="text-xs uppercase mb-1 block">Slug (auto se vazio)</label><input className={inputCls} value={p.slug || ''} onChange={(e) => setP({ ...p, slug: e.target.value })} placeholder={slugify(p.titulo || '')} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs uppercase mb-1 block">Categoria</label><input className={inputCls} value={p.categoria || ''} onChange={(e) => setP({ ...p, categoria: e.target.value })} placeholder="Mercado, Dicas, etc." /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.publicado} onChange={(e) => setP({ ...p, publicado: e.target.checked })} /> Publicado</label></div>
          </div>
          <div>
            <label className="text-xs uppercase mb-1 block">Imagem capa</label>
            {p.imagem_capa && <img src={p.imagem_capa} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />}
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">
              <Upload size={12} /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return
                const url = await uploadCapa(f); if (url) setP({ ...p, imagem_capa: url })
              }} />
            </label>
          </div>
          <div><label className="text-xs uppercase mb-1 block">Resumo</label><textarea rows={2} className={inputCls} value={p.resumo || ''} onChange={(e) => setP({ ...p, resumo: e.target.value })} /></div>
          <div><label className="text-xs uppercase mb-1 block">Conteúdo (Markdown)</label><textarea rows={10} className={inputCls + ' font-mono text-xs'} value={p.conteudo || ''} onChange={(e) => setP({ ...p, conteudo: e.target.value })} /></div>
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
