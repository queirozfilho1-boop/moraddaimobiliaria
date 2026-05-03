import { useEffect, useRef, useState } from 'react'
import { Camera, Upload, Trash2, Loader2, GripVertical, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/compressImage'

interface Foto {
  id: string
  url: string
  legenda?: string | null
  ordem: number
  comodo?: string | null
}

interface Props {
  vistoriaId: string
}

export default function VistoriaFotosSection({ vistoriaId }: Props) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 })
  const [preview, setPreview] = useState<Foto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function load() {
    const { data } = await supabase
      .from('vistorias_fotos')
      .select('*')
      .eq('vistoria_id', vistoriaId)
      .order('ordem')
    setFotos((data || []) as Foto[])
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [vistoriaId])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setProgresso({ atual: 0, total: files.length })
    const startOrdem = fotos.length

    let inseridas = 0
    let economiaTotal = 0
    let originalTotal = 0

    for (let i = 0; i < files.length; i++) {
      const original = files[i]
      originalTotal += original.size
      try {
        const comprimido = await compressImage(original, { maxDimension: 1600, quality: 0.85, mimeType: 'image/webp' })
        economiaTotal += (original.size - comprimido.size)
        const ext = comprimido.name.split('.').pop() || 'webp'
        const path = `${vistoriaId}/${Date.now()}_${i}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('vistorias')
          .upload(path, comprimido, { upsert: false, contentType: comprimido.type })

        // Fallback: se bucket "vistorias" não existir, usa "imoveis"
        let storagePath = path
        let bucket = 'vistorias'
        if (upErr) {
          const fallback = `vistorias/${vistoriaId}/${Date.now()}_${i}.${ext}`
          const { error: upErr2 } = await supabase.storage
            .from('imoveis')
            .upload(fallback, comprimido, { upsert: false, contentType: comprimido.type })
          if (upErr2) {
            toast.error(`Foto ${i + 1}: ${upErr2.message}`)
            continue
          }
          storagePath = fallback
          bucket = 'imoveis'
        }
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath)
        const { error: insErr } = await supabase.from('vistorias_fotos').insert({
          vistoria_id: vistoriaId,
          url: pub.publicUrl,
          ordem: startOrdem + i,
        })
        if (insErr) { toast.error(`Foto ${i + 1}: ${insErr.message}`); continue }
        inseridas++
      } catch (e: any) {
        toast.error(`Foto ${i + 1}: ${e.message || 'erro'}`)
      }
      setProgresso({ atual: i + 1, total: files.length })
    }

    setUploading(false)
    if (inseridas > 0) {
      const economiaMb = (economiaTotal / 1024 / 1024).toFixed(2)
      const originalMb = (originalTotal / 1024 / 1024).toFixed(2)
      toast.success(`${inseridas} foto(s) enviadas · economizou ${economiaMb}MB de ${originalMb}MB original`)
      load()
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  async function removerFoto(id: string) {
    if (!confirm('Remover esta foto?')) return
    const { error } = await supabase.from('vistorias_fotos').delete().eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Foto removida')
    load()
  }

  async function atualizarLegenda(id: string, legenda: string) {
    await supabase.from('vistorias_fotos').update({ legenda: legenda || null }).eq('id', id)
    setFotos((prev) => prev.map((f) => f.id === id ? { ...f, legenda } : f))
  }

  async function moverFoto(idx: number, dir: -1 | 1) {
    const j = idx + dir
    if (j < 0 || j >= fotos.length) return
    const novo = [...fotos]
    ;[novo[idx], novo[j]] = [novo[j], novo[idx]]
    setFotos(novo)
    await Promise.all(novo.map((f, i) =>
      supabase.from('vistorias_fotos').update({ ordem: i }).eq('id', f.id),
    ))
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <Loader2 size={20} className="animate-spin text-moradda-blue-500" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Camera size={16} className="text-moradda-blue-500" />
          Fotos da Vistoria
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {fotos.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              {progresso.atual}/{progresso.total}
            </>
          ) : (
            <>
              <Upload size={13} />
              Adicionar fotos
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      <div className="p-4">
        {fotos.length === 0 ? (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/30 dark:hover:bg-gray-700/50"
          >
            <Camera size={32} className="mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Nenhuma foto adicionada</p>
            <p className="text-xs text-gray-400">Clique para adicionar (compressão automática WebP)</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {fotos.map((f, idx) => (
              <div key={f.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/30">
                <div
                  onClick={() => setPreview(f)}
                  className="aspect-square cursor-pointer bg-cover bg-center"
                  style={{ backgroundImage: `url(${f.url})` }}
                />
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Legenda..."
                    defaultValue={f.legenda || ''}
                    onBlur={(e) => atualizarLegenda(f.id, e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  />
                </div>
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moverFoto(idx, -1)}
                    disabled={idx === 0}
                    title="Mover pra esquerda"
                    className="rounded bg-black/50 p-1 text-white hover:bg-black/70 disabled:opacity-30"
                  >
                    <GripVertical size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerFoto(f.id)}
                    title="Remover"
                    className="rounded bg-red-500/90 p-1 text-white hover:bg-red-600"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          >
            <X size={18} />
          </button>
          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img src={preview.url} alt={preview.legenda || ''} className="max-h-[85vh] max-w-full rounded-lg" />
            {preview.legenda && (
              <p className="mt-2 text-center text-sm text-white">{preview.legenda}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
