import { useEffect, useRef, useState } from 'react'
import { Compass } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  height?: string
}

async function waitForPannellum(maxMs = 6000): Promise<PannellumGlobal | null> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (window.pannellum) return window.pannellum
    await new Promise((r) => setTimeout(r, 120))
  }
  return null
}

export default function Tour360Viewer({ imovelId, height = '520px' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<PannellumViewer | null>(null)
  const [cenas, setCenas] = useState<Cena[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('imoveis_tour_cenas')
        .select('*')
        .eq('imovel_id', imovelId)
        .order('ordem')
      if (cancelled) return
      const list = (data as Cena[]) || []
      setCenas(list)
      if (list.length > 0) {
        const inicial = list.find((c) => c.is_inicial) || list[0]
        setCurrentSceneId(inicial.id)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [imovelId])

  useEffect(() => {
    if (loading || cenas.length === 0 || !containerRef.current) return
    let cancelled = false
    ;(async () => {
      const pann = await waitForPannellum()
      if (!pann || cancelled || !containerRef.current) return

      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }

      const inicial = cenas.find((c) => c.is_inicial) || cenas[0]
      const scenesConfig: Record<string, PannellumScene> = {}
      for (const cena of cenas) {
        scenesConfig[cena.id] = {
          title: cena.nome,
          type: 'equirectangular',
          panorama: cena.panorama_url,
          hotSpots: (cena.hotspots || []).map((h) => ({
            pitch: h.pitch,
            yaw: h.yaw,
            type: h.type,
            text: h.text || '',
            sceneId: h.type === 'scene' ? h.target_cena_id : undefined,
          })),
        }
      }

      const v = pann.viewer(containerRef.current, {
        default: {
          firstScene: inicial.id,
          sceneFadeDuration: 800,
          autoLoad: true,
          showControls: true,
        },
        scenes: scenesConfig,
      })
      viewerRef.current = v

      // Sync state quando o usuário navega via hotspot — assim a miniatura ativa
      // sempre reflete a cena visível.
      v.on('scenechange', (...args: unknown[]) => {
        const sceneId = args[0]
        if (typeof sceneId === 'string') setCurrentSceneId(sceneId)
      })
    })()
    return () => {
      cancelled = true
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [loading, cenas])

  function handleThumbClick(sceneId: string) {
    if (!viewerRef.current) return
    if (sceneId === currentSceneId) return
    viewerRef.current.loadScene(sceneId)
    setCurrentSceneId(sceneId)
  }

  if (loading || cenas.length === 0) {
    // Render nada se não houver cenas — site não exibe seção vazia
    return null
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Compass className="h-5 w-5 text-moradda-blue-600" />
        <h2 className="font-heading text-xl font-semibold text-moradda-blue-800">
          Tour Virtual 360°
        </h2>
        <span className="ml-auto rounded-full bg-moradda-gold-100 px-3 py-1 text-xs font-medium text-moradda-gold-700">
          {cenas.length} ambiente{cenas.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mb-4 font-body text-sm text-gray-600">
        Arraste para olhar em volta.
        {cenas.length > 1
          ? ' Use as miniaturas abaixo ou clique nos pontos brilhantes para trocar de ambiente.'
          : ''}
      </p>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl bg-black"
        style={{ height, width: '100%' }}
      />

      {/* Barra de miniaturas — aparece só quando ha 2+ cenas */}
      {cenas.length > 1 && (
        <div className="mt-3 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
          {cenas.map((c) => {
            const ativa = currentSceneId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleThumbClick(c.id)}
                title={c.nome}
                className={`group relative shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  ativa
                    ? 'border-moradda-gold-500 ring-2 ring-moradda-gold-500/30'
                    : 'border-gray-200 hover:border-moradda-blue-400'
                }`}
              >
                <img
                  src={c.panorama_url}
                  alt={c.nome}
                  loading="lazy"
                  className="h-16 w-28 object-cover sm:h-20 sm:w-36"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pt-3 pb-1">
                  <span className="block truncate text-left text-[11px] font-medium text-white">
                    {c.nome}
                  </span>
                </div>
                {ativa && (
                  <span className="absolute right-1 top-1 rounded-full bg-moradda-gold-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Aqui
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
