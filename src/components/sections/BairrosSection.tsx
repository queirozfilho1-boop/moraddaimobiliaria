import { Link } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'

const bairros = [
  { nome: 'Centro', imoveis: 32 },
  { nome: 'Jardim Jalisco', imoveis: 18 },
  { nome: 'Paraíso', imoveis: 24 },
  { nome: 'Campos Elíseos', imoveis: 15 },
  { nome: 'Itapuca', imoveis: 12 },
  { nome: 'Manejo', imoveis: 9 },
]

// Distinct gradient pairs for each card
const gradients = [
  'from-moradda-blue-700 to-moradda-blue-900',
  'from-moradda-blue-600 to-moradda-blue-800',
  'from-moradda-blue-800 to-moradda-blue-950',
  'from-moradda-blue-500 to-moradda-blue-700',
  'from-moradda-blue-700 to-moradda-blue-950',
  'from-moradda-blue-600 to-moradda-blue-900',
]

export default function BairrosSection() {
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
              Conheça as regiões mais valorizadas
            </p>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bairros.map((bairro, index) => (
            <ScrollReveal key={bairro.nome} delay={index * 100}>
              <Link
                to="/bairros"
                className="group block relative h-52 rounded-2xl overflow-hidden"
              >
                {/* Gradient placeholder for image */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} transition-transform duration-500 group-hover:scale-110`}
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-moradda-gold-400" />
                    <h3 className="font-heading text-xl text-white">
                      {bairro.nome}
                    </h3>
                  </div>
                  <p className="text-white/70 text-sm font-body">
                    {bairro.imoveis} imóveis disponíveis
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
