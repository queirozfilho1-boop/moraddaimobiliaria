import { Users, ShieldCheck, Monitor, Award } from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'

const diferenciais = [
  {
    icon: Users,
    titulo: 'Atendimento Personalizado',
    descricao: 'Cada cliente recebe atenção exclusiva do início ao fim',
  },
  {
    icon: ShieldCheck,
    titulo: 'Imóveis Verificados',
    descricao: 'Todos os imóveis passam por verificação rigorosa',
  },
  {
    icon: Monitor,
    titulo: 'Tecnologia e Transparência',
    descricao: 'Plataforma moderna com informações claras e atualizadas',
  },
  {
    icon: Award,
    titulo: 'Experiência Comprovada',
    descricao: 'Parte do Grupo Alfacon, com mais de 10 anos de mercado',
  },
]

export default function DiferenciaisSection() {
  return (
    <section className="py-24 bg-moradda-blue-900 relative overflow-hidden">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-white line-gold-center">
              Por que a Moradda?
            </h2>
            <p className="text-moradda-blue-200 font-body mt-6 text-lg">
              Diferenciais que fazem toda a diferença na sua experiência
            </p>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {diferenciais.map((item, index) => {
            const Icon = item.icon
            return (
              <ScrollReveal key={item.titulo} delay={index * 150}>
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-moradda-gold-400/10 mb-6 group-hover:bg-moradda-gold-400/20 transition-colors duration-300">
                    <Icon className="w-7 h-7 text-moradda-gold-400" />
                  </div>
                  <h3 className="font-heading text-xl text-white mb-3">
                    {item.titulo}
                  </h3>
                  <p className="text-moradda-blue-200 font-body text-sm leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
