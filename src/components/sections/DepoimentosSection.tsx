import { Star, Quote } from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'

const depoimentos = [
  {
    nome: 'Fernanda Oliveira',
    texto:
      'A equipe da Moradda foi incrível desde o primeiro contato. Encontraram o apartamento perfeito para minha família em tempo recorde. O atendimento personalizado fez toda a diferença!',
    estrelas: 5,
    tipo: 'Compradora',
  },
  {
    nome: 'Ricardo Mendes',
    texto:
      'Vendi meu imóvel em menos de 30 dias com a Moradda. A equipe cuidou de toda a documentação e me manteve informado em cada etapa. Super recomendo!',
    estrelas: 5,
    tipo: 'Vendedor',
  },
  {
    nome: 'Juliana Costa',
    texto:
      'O que mais me impressionou foi a transparência e a honestidade da Moradda. Nada de surpresas, tudo muito claro. Encontrei minha casa dos sonhos no Jardim Jalisco!',
    estrelas: 5,
    tipo: 'Compradora',
  },
]

export default function DepoimentosSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-moradda-blue-800 line-gold-center">
              O que Nossos Clientes Dizem
            </h2>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {depoimentos.map((depo, index) => (
            <ScrollReveal key={depo.nome} delay={index * 150}>
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-moradda-gold-400/20 absolute top-6 right-6" />

                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: depo.estrelas }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-moradda-gold-400 text-moradda-gold-400"
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-gray-600 font-body leading-relaxed mb-6 text-sm">
                  "{depo.texto}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                  <div className="w-10 h-10 rounded-full bg-moradda-blue-100 flex items-center justify-center text-moradda-blue-500 font-bold font-body text-sm">
                    {depo.nome
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="font-body font-semibold text-moradda-blue-800 text-sm">
                      {depo.nome}
                    </div>
                    <div className="text-gray-400 font-body text-xs">
                      {depo.tipo}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
