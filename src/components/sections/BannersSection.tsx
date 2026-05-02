import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Banner {
  id: string
  titulo: string | null
  subtitulo: string | null
  imagem_url: string
  link: string | null
  ordem: number
}

export default function BannersSection() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('banners')
        .select('id, titulo, subtitulo, imagem_url, link, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      setBanners((data || []) as Banner[])
    }
    load()
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 6000)
    return () => clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) return null

  const b = banners[idx]
  const Wrap: any = b.link ? 'a' : 'div'
  const wrapProps = b.link
    ? { href: b.link, target: b.link.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' }
    : {}

  return (
    <section className="relative w-full overflow-hidden bg-moradda-blue-900">
      <div className="relative h-[260px] sm:h-[320px] md:h-[400px] w-full">
        {banners.map((banner, i) => (
          <Wrap
            key={banner.id}
            {...(i === idx ? wrapProps : {})}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${b.link && i === idx ? 'cursor-pointer' : ''}`}
          >
            <img
              src={banner.imagem_url}
              alt={banner.titulo || 'Banner'}
              className="h-full w-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {(banner.titulo || banner.subtitulo) && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
                  <div className="max-w-2xl">
                    {banner.titulo && (
                      <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-3">
                        {banner.titulo}
                      </h2>
                    )}
                    {banner.subtitulo && (
                      <p className="text-moradda-gold-300 font-body text-sm sm:text-base md:text-lg">
                        {banner.subtitulo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Wrap>
        ))}

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + banners.length) % banners.length)}
              aria-label="Banner anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % banners.length)}
              aria-label="Próximo banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Ir para banner ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-moradda-gold-400' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
