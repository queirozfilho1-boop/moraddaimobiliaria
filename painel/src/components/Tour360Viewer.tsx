import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
  /** Renderiza apenas a primeira cena, sem navegação. Para preview rápido. */
  singleScene?: boolean
}

async function waitForPannellum(maxMs = 5000): Promise<PannellumGlobal | null> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (window.pannellum) return window.pannellum
    await new Promise((r) => setTimeout(r, 100))
  }
  return null
}

export default function Tour360Viewer({ imovelId, height = '500px', singleScene = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<PannellumViewer | null>(null)
  const [cenas, setCenas] = useState<Cena[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('imoveis_tour_cenas')
        .select('*')
        .eq('imovel_id', imovelId)
        .order('ordem')
      if (cancelled) return
      if (error) {
        setErro(error.message)
        setLoading(false)
        return
      }
      setCenas((data as Cena[]) || [])
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
      if (!pann || cancelled || !containerRef.current) {
        setErro('Pannellum não carregou')
        return
      }

      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }

      const inicial = cenas.find((c) => c.is_inicial) || cenas[0]
      const cenasParaUsar = singleScene ? [inicial] : cenas

      const scenesConfig: Record<string, PannellumScene> = {}
      for (const cena of cenasParaUsar) {
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

      viewerRef.current = pann.viewer(containerRef.current, {
        default: {
          firstScene: inicial.id,
          sceneFadeDuration: 800,
          autoLoad: true,
          showControls: true,
        },
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
  }, [loading, cenas, singleScene])

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (erro) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        style={{ height }}
      >
        {erro}
      </div>
    )
  }

  if (cenas.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        style={{ height }}
      >
        Nenhuma cena de tour 360° cadastrada para este imóvel.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-gray-700"
      style={{ height, width: '100%' }}
    />
  )
}
