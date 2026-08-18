import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'
import { supabase } from '@/lib/supabase'

interface BairroCard {
  id: string
  nome: string
  cidade: string
  foto: string | null
  imoveis: number
}

/**
 * "Explore os Melhores Bairros" — 100% guiado pelos dados: só aparecem bairros
 * com imóvel PUBLICADO, com contagem real e imagem real (foto cadastrada do
 * bairro ou a foto principal de um imóvel dele). Sem dados, a seção some.
 */
export default function BairrosSection() {
  const [bairros, setBairros] = useState<BairroCard[]>([])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('imoveis')
        .select('bairro_id, bairros(id, nome, cidade, foto_url), imoveis_fotos(url_watermark, principal, ordem)')
        .eq('status', 'publicado')
      if (!data) return
      const map = new Map<string, BairroCard>()
      for (const row of data as any[]) {
        const b = row.bairros
        if (!b) continue
        const fotos = (row.imoveis_fotos || []) as any[]
        const fotoImovel = fotos
          .sort((x, y) => (y.principal ? 1 : 0) - (x.principal ? 1 : 0) || (x.ordem ?? 0) - (y.ordem ?? 0))[0]?.url_watermark
        const atual = map.get(b.id)
        if (atual) {
          atual.imoveis++
          if (!atual.foto && fotoImovel) atual.foto = fotoImovel
        } else {
          map.set(b.id, { id: b.id, nome: b.nome, cidade: b.cidade || 'Resende', foto: b.foto_url || fotoImovel || null, imoveis: 1 })
        }
      }
      // Top 6 por quantidade de imóveis, apenas com foto disponível
      setBairros([...map.values()]
        .filter((b) => b.foto)
        .sort((a, b) => b.imoveis - a.imoveis || a.nome.localeCompare(b.nome, 'pt-BR'))
        .slice(0, 6))
    }
    fetch()
  }, [])

  if (bairros.length === 0) return null

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-moradda-blue-800 line-gold-center">
              Explore os Melhores Bairros
            </h2>
            <p className="text-gray-500 font-body mt-6 text-lg">
              Regiões com imóveis disponíveis agora
            </p>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bairros.map((bairro, index) => (
            <ScrollReveal key={bairro.id} delay={index * 100}>
              <Link
                to={`/imoveis?bairro=${bairro.id}`}
                className="group block relative h-52 rounded-2xl overflow-hidden"
              >
                {/* Foto real do bairro/imóvel */}
                <img
                  src={bairro.foto!}
                  alt={`Imóveis em ${bairro.nome}, ${bairro.cidade}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay para legibilidade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 transition-colors duration-300" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-moradda-gold-400" />
                    <h3 className="font-heading text-xl text-white">
                      {bairro.nome}
                    </h3>
                  </div>
                  <p className="text-white/80 text-sm font-body">
                    {bairro.cidade} · {bairro.imoveis} {bairro.imoveis === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}
                  </p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={600}>
          <div className="text-center mt-12">
            <Link
              to="/bairros"
              className="inline-flex items-center gap-2 text-moradda-blue-500 hover:text-moradda-blue-700 font-body font-semibold transition-colors duration-300"
            >
              Ver todos os bairros
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
