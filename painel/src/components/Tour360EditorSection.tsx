import { useEffect, useRef, useState } from 'react'
import { Upload, Loader2, Trash2, Star, ArrowUp, ArrowDown, Crosshair, Save, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/compressImage'

interface CenaHotspot {
  id: string
  type: 'scene' | 'info'
  pitch: number
  yaw: number
  text?: string
  target_cena_id?: string
}

interface Cena {
  id: string
  imovel_id: string
  ordem: number
  nome: string
  panorama_url: string
  hotspots: CenaHotspot[]
  is_inicial: boolean
}

interface Props {
  imovelId: string
}

const BUCKET = 'imoveis-tour-360'

async function waitForPannellum(maxMs = 5000): Promise<PannellumGlobal | null> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (window.pannellum) return window.pannellum
    await new Promise((r) => setTimeout(r, 100))
  }
  return null
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export default function Tour360EditorSection({ imovelId }: Props) {
  const [cenas, setCenas] = useState<Cena[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [cenaSelecionada, setCenaSelecionada] = useState<string | null>(null)
  const [salvandoHotspots, setSalvandoHotspots] = useState(false)

  const inputFileRef = useRef<HTMLInputElement>(null)
  const viewerContainerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<PannellumViewer | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('imoveis_tour_cenas')
      .select('*')
      .eq('imovel_id', imovelId)
      .order('ordem')
    if (error) {
      toast.error('Erro carregando cenas: ' + error.message)
      setLoading(false)
      return
    }
    const list = (data as Cena[]) || []
    setCenas(list)
    if (list.length && !cenaSelecionada) setCenaSelecionada(list[0].id)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imovelId])

  // Re-monta o viewer quando troca a cena selecionada ou os dados das cenas
  useEffect(() => {
    if (!cenaSelecionada || cenas.length === 0 || !viewerContainerRef.current) return
    let cancelled = false
    ;(async () => {
      const pann = await waitForPannellum()
      if (!pann || cancelled || !viewerContainerRef.current) return
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
      const cena = cenas.find((c) => c.id === cenaSelecionada)
      if (!cena) return
      const scenesConfig: Record<string, PannellumScene> = {}
      for (const c of cenas) {
        scenesConfig[c.id] = {
          title: c.nome,
          type: 'equirectangular',
          panorama: c.panorama_url,
          hotSpots: (c.hotspots || []).map((h) => ({
            pitch: h.pitch,
            yaw: h.yaw,
            type: h.type,
            text: h.text || '',
            sceneId: h.type === 'scene' ? h.target_cena_id : undefined,
          })),
        }
      }
      viewerRef.current = pann.viewer(viewerContainerRef.current, {
        default: { firstScene: cena.id, sceneFadeDuration: 500, autoLoad: true, showControls: true },
        scenes: scenesConfig,
      })
    })()
    return () => {
      cancelled = true
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [cenaSelecionada, cenas])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !imovelId) return
    setUploading(true)
    const startOrdem = cenas.length
    let inseridas = 0
    let economiaBytes = 0
    let originalBytes = 0

    for (let i = 0; i < files.length; i++) {
      const original = files[i]
      originalBytes += original.size
      try {
        // Comprime para WebP mantendo 4096px no maior lado (preserva ratio 2:1
        // do equirectangular). Quality 0.82 da boa qualidade visual com
        // economia tipica de 60-75% vs JPEG original.
        const comprimido = await compressImage(original, {
          maxDimension: 4096,
          quality: 0.82,
          mimeType: 'image/webp',
        })
        economiaBytes += original.size - comprimido.size

        const path = `${imovelId}/${Date.now()}_${i}.webp`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, comprimido, {
          upsert: false,
          contentType: 'image/webp',
        })
        if (upErr) {
          toast.error(`Cena ${i + 1}: ${upErr.message}`)
          continue
        }
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
        const nome = original.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').slice(0, 80)
        const { error: insErr } = await supabase.from('imoveis_tour_cenas').insert({
          imovel_id: imovelId,
          ordem: startOrdem + i,
          nome: nome || `Cena ${startOrdem + i + 1}`,
          panorama_url: pub.publicUrl,
          hotspots: [],
          is_inicial: startOrdem + i === 0 && cenas.length === 0,
        })
        if (insErr) {
          toast.error(`Cena ${i + 1}: ${insErr.message}`)
          continue
        }
        inseridas++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'erro'
        toast.error(`Cena ${i + 1}: ${msg}`)
      }
    }

    setUploading(false)
    if (inputFileRef.current) inputFileRef.current.value = ''
    if (inseridas > 0) {
      const origMb = (originalBytes / 1024 / 1024).toFixed(1)
      const econMb = (economiaBytes / 1024 / 1024).toFixed(1)
      toast.success(`${inseridas} cena(s) enviada(s) · ${origMb}MB original → economizou ${econMb}MB com WebP`)
      load()
    }
  }

  async function removerCena(id: string) {
    if (!confirm('Remover esta cena? As referências de hotspots serão limpas.')) return
    // Limpar hotspots que apontam pra essa cena em outras cenas
    const cenasAfetadas = cenas
      .filter((c) => c.id !== id && (c.hotspots || []).some((h) => h.target_cena_id === id))
      .map((c) => ({
        ...c,
        hotspots: c.hotspots.filter((h) => h.target_cena_id !== id),
      }))
    for (const c of cenasAfetadas) {
      await supabase.from('imoveis_tour_cenas').update({ hotspots: c.hotspots }).eq('id', c.id)
    }
    const { error } = await supabase.from('imoveis_tour_cenas').delete().eq('id', id)
    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }
    toast.success('Cena removida')
    if (cenaSelecionada === id) setCenaSelecionada(null)
    load()
  }

  async function definirInicial(id: string) {
    // remove flag das outras
    await supabase.from('imoveis_tour_cenas').update({ is_inicial: false }).eq('imovel_id', imovelId)
    const { error } = await supabase.from('imoveis_tour_cenas').update({ is_inicial: true }).eq('id', id)
    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }
    toast.success('Cena inicial atualizada')
    load()
  }

  async function moverCena(idx: number, dir: -1 | 1) {
    const j = idx + dir
    if (j < 0 || j >= cenas.length) return
    const reord = [...cenas]
    ;[reord[idx], reord[j]] = [reord[j], reord[idx]]
    setCenas(reord)
    await Promise.all(
      reord.map((c, i) => supabase.from('imoveis_tour_cenas').update({ ordem: i }).eq('id', c.id)),
    )
  }

  async function renomearCena(id: string, nome: string) {
    setCenas((prev) => prev.map((c) => (c.id === id ? { ...c, nome } : c)))
    await supabase.from('imoveis_tour_cenas').update({ nome }).eq('id', id)
  }

  // ───────── Hotspots ─────────
  const cenaAtual = cenas.find((c) => c.id === cenaSelecionada) || null

  function adicionarHotspot() {
    if (!cenaAtual || !viewerRef.current) return
    const pitch = Math.round(viewerRef.current.getPitch() * 10) / 10
    const yaw = Math.round(viewerRef.current.getYaw() * 10) / 10
    const novo: CenaHotspot = {
      id: uid(),
      type: 'scene',
      pitch,
      yaw,
      target_cena_id: cenas.find((c) => c.id !== cenaAtual.id)?.id,
      text: 'Ir',
    }
    setCenas((prev) =>
      prev.map((c) => (c.id === cenaAtual.id ? { ...c, hotspots: [...(c.hotspots || []), novo] } : c)),
    )
  }

  function atualizarHotspot(hsId: string, patch: Partial<CenaHotspot>) {
    if (!cenaAtual) return
    setCenas((prev) =>
      prev.map((c) =>
        c.id === cenaAtual.id
          ? { ...c, hotspots: c.hotspots.map((h) => (h.id === hsId ? { ...h, ...patch } : h)) }
          : c,
      ),
    )
  }

  function removerHotspot(hsId: string) {
    if (!cenaAtual) return
    setCenas((prev) =>
      prev.map((c) =>
        c.id === cenaAtual.id ? { ...c, hotspots: c.hotspots.filter((h) => h.id !== hsId) } : c,
      ),
    )
  }

  async function salvarHotspots() {
    if (!cenaAtual) return
    setSalvandoHotspots(true)
    const { error } = await supabase
      .from('imoveis_tour_cenas')
      .update({ hotspots: cenaAtual.hotspots })
      .eq('id', cenaAtual.id)
    setSalvandoHotspots(false)
    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }
    toast.success('Hotspots salvos · viewer recarregado')
  }

  if (!imovelId) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Salve o imóvel primeiro para habilitar o Tour 360°.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
          Envie fotos panorâmicas equirectangulares (modo &quot;Foto Esférica&quot; do celular). Cada
          foto vira uma cena. Tamanho máximo: 30MB. Formatos: JPG, PNG, WEBP.
        </p>
        <input
          ref={inputFileRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputFileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-md bg-moradda-blue-900 px-3 py-2 text-sm font-medium text-white hover:bg-moradda-blue-800 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Enviando...' : 'Adicionar panorâmicas'}
        </button>
      </div>

      {cenas.length === 0 && (
        <p className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Nenhuma cena cadastrada. Envie a primeira panorâmica acima.
        </p>
      )}

      {cenas.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Lista de cenas */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cenas ({cenas.length})
            </p>
            <ul className="space-y-1">
              {cenas.map((c, idx) => {
                const sel = cenaSelecionada === c.id
                return (
                  <li
                    key={c.id}
                    className={`rounded-md border p-2 ${
                      sel
                        ? 'border-moradda-gold-400 bg-moradda-gold-400/10'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCenaSelecionada(c.id)}
                      className="flex w-full items-center gap-2 text-left text-sm"
                    >
                      <img
                        src={c.panorama_url}
                        alt={c.nome}
                        className="h-10 w-16 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                          {c.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {c.is_inicial && '★ Inicial · '}
                          {(c.hotspots || []).length} hotspot(s)
                        </p>
                      </div>
                    </button>
                    {sel && (
                      <div className="mt-2 flex items-center gap-1">
                        <input
                          type="text"
                          value={c.nome}
                          onChange={(e) => renomearCena(c.id, e.target.value)}
                          className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => definirInicial(c.id)}
                        title="Definir como cena inicial"
                        disabled={c.is_inicial}
                        className="rounded p-1 text-yellow-500 hover:bg-yellow-50 disabled:opacity-30 dark:hover:bg-yellow-900/30"
                      >
                        <Star className="h-3.5 w-3.5" fill={c.is_inicial ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverCena(idx, -1)}
                        disabled={idx === 0}
                        title="Subir"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverCena(idx, 1)}
                        disabled={idx === cenas.length - 1}
                        title="Descer"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removerCena(c.id)}
                        title="Remover"
                        className="ml-auto rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Viewer + editor de hotspots */}
          <div className="space-y-3">
            <div
              ref={viewerContainerRef}
              className="overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-gray-700"
              style={{ height: '420px', width: '100%' }}
            />

            {cenaAtual && (
              <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Hotspots de &quot;{cenaAtual.nome}&quot;
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={adicionarHotspot}
                      className="inline-flex items-center gap-1 rounded-md bg-moradda-gold-400 px-2.5 py-1 text-xs font-medium text-moradda-blue-950 hover:bg-moradda-gold-500"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      Capturar posição atual
                    </button>
                    <button
                      type="button"
                      onClick={salvarHotspots}
                      disabled={salvandoHotspots}
                      className="inline-flex items-center gap-1 rounded-md bg-moradda-blue-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-moradda-blue-800 disabled:opacity-60"
                    >
                      {salvandoHotspots ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Salvar hotspots
                    </button>
                  </div>
                </div>

                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Gire o panorama acima até apontar para onde quer um link, depois clique em
                  &quot;Capturar posição atual&quot;. Em seguida escolha a cena de destino e clique
                  &quot;Salvar hotspots&quot; para o viewer recarregar com as mudanças.
                </p>

                {(cenaAtual.hotspots || []).length === 0 ? (
                  <p className="rounded bg-gray-50 p-2 text-center text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    Sem hotspots ainda.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {cenaAtual.hotspots.map((h) => (
                      <li
                        key={h.id}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-gray-700"
                      >
                        <select
                          value={h.type}
                          onChange={(e) =>
                            atualizarHotspot(h.id, { type: e.target.value as 'scene' | 'info' })
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="scene">Ir para cena</option>
                          <option value="info">Texto info</option>
                        </select>
                        {h.type === 'scene' ? (
                          <select
                            value={h.target_cena_id || ''}
                            onChange={(e) => atualizarHotspot(h.id, { target_cena_id: e.target.value })}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                          >
                            <option value="">— escolha o destino —</option>
                            {cenas
                              .filter((c) => c.id !== cenaAtual.id)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nome}
                                </option>
                              ))}
                          </select>
                        ) : null}
                        <input
                          type="text"
                          placeholder="Texto"
                          value={h.text || ''}
                          onChange={(e) => atualizarHotspot(h.id, { text: e.target.value })}
                          className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        />
                        <span className="text-[10px] text-gray-400">
                          p:{h.pitch.toFixed(1)} y:{h.yaw.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerHotspot(h.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <a
              href={`/painel/imoveis/${imovelId}#tour`}
              className="inline-flex items-center gap-1 text-xs text-moradda-blue-700 hover:underline dark:text-moradda-blue-300"
            >
              <Eye className="h-3.5 w-3.5" />
              Os visitantes verão o tour montado a partir destas cenas e da cena marcada como
              inicial.
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
