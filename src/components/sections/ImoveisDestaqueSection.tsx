import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bed, Bath, Car, Maximize2, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'
import { supabase } from '@/lib/supabase'

interface ImovelDestaque {
  id: string
  codigo: string
  slug: string
  titulo: string
  tipo: string
  finalidade: string
  preco: number
  quartos: number
  suites: number
  banheiros: number
  vagas_garagem: number
  area_construida: number | null
  destaque: boolean
  bairros: { nome: string } | null
  users_profiles: { nome: string; creci: string | null } | null
  imoveis_fotos: { url_watermark: string; principal: boolean; ordem: number }[] | null
}

function formatPreco(preco: number, finalidade: string): string {
  const formatted = preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  })
  return finalidade === 'aluguel' ? `${formatted}/mês` : formatted
}

export default function ImoveisDestaqueSection() {
  const [imoveis, setImoveis] = useState<ImovelDestaque[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDestaques() {
      try {
        // First fetch featured properties
        const { data: destaques, error: errDestaques } = await supabase
          .from('imoveis')
          .select('id, codigo, slug, titulo, tipo, finalidade, preco, quartos, suites, banheiros, vagas_garagem, area_construida, destaque, bairros(nome), users_profiles!corretor_id(nome, creci, avatar_url), imoveis_fotos(url_watermark, principal, ordem)')
          .eq('status', 'publicado')
          .eq('destaque', true)
          .order('created_at', { ascending: false })
          .limit(6)

        if (errDestaques) throw errDestaques

        let result = (destaques || []) as unknown as ImovelDestaque[]

        // If less than 6 featured, fill with most recent publicados
        if (result.length < 6) {
          const existingIds = result.map(i => i.id)
          let fillQuery = supabase
            .from('imoveis')
            .select('id, codigo, slug, titulo, tipo, finalidade, preco, quartos, suites, banheiros, vagas_garagem, area_construida, destaque, bairros(nome), users_profiles!corretor_id(nome, creci, avatar_url), imoveis_fotos(url_watermark, principal, ordem)')
            .eq('status', 'publicado')
          if (existingIds.length > 0) {
            fillQuery = fillQuery.not('id', 'in', `(${existingIds.join(',')})`)
          }
          const { data: recentes, error: errRecentes } = await fillQuery
            .order('created_at', { ascending: false })
            .limit(6 - result.length)

          if (!errRecentes && recentes) {
            result = [...result, ...(recentes as unknown as ImovelDestaque[])]
          }
        }

        setImoveis(result)
      } catch (err) {
        console.error('Erro ao buscar imóveis destaque:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDestaques()
  }, [])

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-moradda-blue-800 line-gold-center">
              Imóveis em Destaque
            </h2>
            <p className="text-gray-500 font-body mt-6 text-lg">
              Selecionados especialmente para você
            </p>
          </div>
        </ScrollReveal>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
          </div>
        )}

        {/* Empty state */}
        {!loading && imoveis.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-body text-lg">Nenhum imóvel em destaque no momento</p>
          </div>
        )}

        {/* Grid */}
        {!loading && imoveis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {imoveis.map((imovel, index) => (
              <ScrollReveal key={imovel.id} delay={index * 100}>
                <Link to={`/imoveis/${imovel.slug}`} className="block">
                  <div className="card-premium bg-white rounded-2xl overflow-hidden shadow-md">
                    {/* Image */}
                    <div className="relative h-56 bg-gradient-to-br from-moradda-blue-100 to-moradda-blue-200 overflow-hidden">
                      {(() => {
                        const fotos = imovel.imoveis_fotos || []
                        const principal = fotos.find(f => f.principal) || fotos.sort((a, b) => a.ordem - b.ordem)[0]
                        return principal ? (
                          <img src={principal.url_watermark} alt={imovel.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                              <Maximize2 className="w-6 h-6 text-moradda-blue-400" />
                            </div>
                          </div>
                        )
                      })()}
                      {/* Badge */}
                      <span
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold font-body uppercase tracking-wider ${
                          imovel.finalidade === 'venda'
                            ? 'bg-moradda-blue-500 text-white'
                            : 'bg-moradda-gold-400 text-white'
                        }`}
                      >
                        {imovel.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-heading text-lg text-moradda-blue-800 mb-1 line-clamp-1">
                        {imovel.titulo}
                      </h3>
                      <p className="text-gray-400 text-sm font-body mb-3">
                        {imovel.bairros?.nome || 'Resende'}, Resende
                      </p>

                      <div className="text-moradda-gold-500 font-heading text-xl font-bold mb-4">
                        {formatPreco(imovel.preco, imovel.finalidade)}
                      </div>

                      {/* Specs */}
                      <div className="flex items-center gap-4 text-gray-500 text-sm font-body border-t border-gray-100 pt-4">
                        <span className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4" />
                          {imovel.quartos}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4" />
                          {imovel.banheiros}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Car className="w-4 h-4" />
                          {imovel.vagas_garagem}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Maximize2 className="w-4 h-4" />
                          {imovel.area_construida || 0}m²
                        </span>
                      </div>

                      {/* Broker */}
                      {imovel.users_profiles?.nome && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                          <div className="w-7 h-7 rounded-full bg-moradda-blue-100 flex items-center justify-center text-moradda-blue-500 text-xs font-bold font-body">
                            {imovel.users_profiles.nome
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <span className="text-xs text-gray-400 font-body">
                            {imovel.users_profiles.nome}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* CTA */}
        <ScrollReveal delay={600}>
          <div className="text-center mt-14">
            <Link
              to="/imoveis"
              className="inline-flex items-center gap-2 bg-moradda-blue-500 hover:bg-moradda-blue-600 text-white font-body font-semibold px-8 py-4 rounded-xl transition-colors duration-300 shadow-lg shadow-moradda-blue-500/20"
            >
              Ver todos os imóveis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
