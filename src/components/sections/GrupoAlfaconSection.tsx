import { Link } from 'react-router-dom'
import {
  Home,
  Calculator,
  FileText,
  TrendingUp,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'

const services = [
  {
    icon: FileText,
    titulo: 'Consultoria Tributária',
    descricao: 'Orientação fiscal para compra e venda',
  },
  {
    icon: TrendingUp,
    titulo: 'Apoio ao Investidor',
    descricao: 'Análise financeira para decisões imobiliárias',
  },
  {
    icon: ClipboardCheck,
    titulo: 'Suporte Documental',
    descricao: 'Escrituração, contratos e regularizações',
  },
]

export default function GrupoAlfaconSection() {
  return (
    <section className="py-24 bg-moradda-blue-900 relative overflow-hidden">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%), linear-gradient(45deg, transparent 75%, white 75%), linear-gradient(-45deg, transparent 75%, white 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl text-moradda-gold-400 line-gold-center">
              Parte de Algo Maior
            </h2>
          </div>
        </ScrollReveal>

        {/* Text content */}
        <ScrollReveal delay={100}>
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-5">
            <p className="text-moradda-blue-100 font-body text-lg leading-relaxed">
              A Moradda Imobiliária faz parte do{' '}
              <strong className="text-white">Grupo Alfacon</strong>, a mesma
              estrutura empresarial da Alfacon Contabilidade — referência há mais
              de 10 anos na região Sul Fluminense.
            </p>
            <p className="text-moradda-blue-200 font-body leading-relaxed">
              Isso significa que, ao contar com a Moradda, você tem acesso a uma
              rede completa de soluções: do imóvel ideal ao planejamento
              financeiro, passando por consultoria tributária, orientação
              documental e apoio patrimonial.
            </p>
            <p className="text-white font-body font-bold text-lg leading-relaxed">
              Não somos apenas uma imobiliária. Somos parte de um ecossistema que
              cuida do seu patrimônio de forma completa.
            </p>
          </div>
        </ScrollReveal>

        {/* Brand cards */}
        <ScrollReveal delay={200}>
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-0 mb-16 max-w-4xl mx-auto">
            {/* Moradda card */}
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-r-none p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-moradda-gold-400/15 mb-4">
                <Home className="w-7 h-7 text-moradda-gold-400" />
              </div>
              <h3 className="font-heading text-xl text-white mb-3">
                Moradda Imobiliária
              </h3>
              <p className="text-moradda-blue-200 font-body text-sm leading-relaxed">
                Intermediação Imobiliária
                <br />
                Avaliação de Imóveis
                <br />
                Consultoria Patrimonial
              </p>
            </div>

            {/* Gold bridge connector */}
            <div className="hidden md:flex items-center justify-center relative w-20">
              <div className="absolute h-full w-px border-l-2 border-dashed border-moradda-gold-400/40" />
              <div className="relative z-10 w-10 h-10 rounded-full bg-moradda-gold-400 flex items-center justify-center shadow-lg shadow-moradda-gold-400/30">
                <span className="text-white font-bold font-body text-xs">+</span>
              </div>
            </div>

            {/* Mobile connector */}
            <div className="flex md:hidden items-center justify-center py-2">
              <div className="w-px h-8 border-l-2 border-dashed border-moradda-gold-400/40" />
            </div>

            {/* Alfacon card */}
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-l-none p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-moradda-gold-400/15 mb-4">
                <Calculator className="w-7 h-7 text-moradda-gold-400" />
              </div>
              <h3 className="font-heading text-xl text-white mb-3">
                Alfacon Contabilidade
              </h3>
              <p className="text-moradda-blue-200 font-body text-sm leading-relaxed">
                Contabilidade
                <br />
                Planejamento Tributário
                <br />
                Consultoria Empresarial
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Service highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-14">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <ScrollReveal key={service.titulo} delay={300 + index * 100}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-moradda-gold-400/10 mb-4">
                    <Icon className="w-5 h-5 text-moradda-gold-400" />
                  </div>
                  <h4 className="font-heading text-lg text-white mb-2">
                    {service.titulo}
                  </h4>
                  <p className="text-moradda-blue-200 font-body text-sm">
                    {service.descricao}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* CTA */}
        <ScrollReveal delay={600}>
          <div className="text-center">
            <Link
              to="/sobre"
              className="inline-flex items-center gap-2 bg-moradda-gold-400 hover:bg-moradda-gold-500 text-white font-body font-semibold px-8 py-4 rounded-xl transition-colors duration-300 shadow-lg shadow-moradda-gold-400/20"
            >
              Conheça nossas soluções integradas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
