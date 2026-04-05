import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Heart,
  Target,
  Users,
  Building2,
  Calculator,
  FileText,
  TrendingUp,
  ClipboardCheck,
  Briefcase,
  ChevronRight,
} from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'

const valores = [
  {
    icon: ShieldCheck,
    title: 'Confiança',
    description: 'Transparência total em cada negociação. Nosso compromisso é com a sua segurança.',
  },
  {
    icon: Heart,
    title: 'Compromisso',
    description: 'Tratamos cada cliente como único. Sua satisfação é nossa prioridade.',
  },
  {
    icon: Target,
    title: 'Excelência',
    description: 'Padrão elevado em tudo que fazemos, do atendimento à entrega.',
  },
  {
    icon: Users,
    title: 'Proximidade',
    description: 'Atendimento humanizado e personalizado do início ao fim.',
  },
]

const solucoes = [
  {
    icon: FileText,
    title: 'Consultoria Tributária',
    description: 'Orientação fiscal para compra, venda e locação de imóveis',
  },
  {
    icon: Building2,
    title: 'Planejamento Patrimonial',
    description: 'Estruturação inteligente do seu patrimônio imobiliário',
  },
  {
    icon: Calculator,
    title: 'IRPF e Declarações',
    description: 'Suporte para declarar corretamente seus imóveis e rendimentos',
  },
  {
    icon: TrendingUp,
    title: 'Apoio ao Investidor',
    description: 'Análise financeira para decisões de investimento imobiliário',
  },
  {
    icon: ClipboardCheck,
    title: 'Orientação Documental',
    description: 'Apoio com escrituração, contratos e regularizações',
  },
  {
    icon: Briefcase,
    title: 'Suporte Empresarial',
    description: 'Para quem compra imóvel como pessoa jurídica ou para negócio',
  },
]

const stats = [
  { value: '150+', label: 'Imóveis' },
  { value: '50+', label: 'Famílias Atendidas' },
  { value: '10+', label: 'Anos de Experiência' },
  { value: '98%', label: 'Satisfação' },
]

const moraddaServices = [
  'Intermediação Imobiliária',
  'Avaliação de Imóveis',
  'Consultoria Patrimonial',
  'Gestão de Locações',
]

const alfaconServices = [
  'Contabilidade Empresarial',
  'Planejamento Tributário',
  'Departamento Pessoal',
  'Consultoria Estratégica',
]

export default function SobrePage() {
  return (
    <>
      <SEO
        title="Sobre"
        description="Conheça a história e os valores da Moradda Imobiliária. Mais que uma imobiliária: uma experiência completa para o seu patrimônio."
      />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,169,74,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400">
              Início
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-moradda-gold-400">Sobre</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            Sobre a Moradda
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-moradda-blue-200"
          >
            Mais que uma imobiliária: uma experiência completa para o seu patrimônio
          </motion.p>
        </div>
      </section>

      {/* Nossa Historia */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Text */}
              <div>
                <div className="mb-2 h-1 w-12 rounded bg-moradda-gold-400" />
                <h2 className="font-heading text-3xl font-bold text-moradda-blue-800 sm:text-4xl">
                  Nossa História
                </h2>
                <p className="mt-6 font-body leading-relaxed text-gray-600">
                  A Moradda Imobiliária nasceu da visão dos mesmos sócios que, há mais de uma
                  década, fundaram a Alfacon Contabilidade em Resende &ndash; RJ. Após anos atuando
                  com centenas de empresas e profissionais da região, identificamos uma necessidade
                  clara no mercado imobiliário local: oferecer um serviço à altura do que já fazíamos
                  na contabilidade &mdash; com a mesma excelência, proximidade e compromisso com o
                  cliente.
                </p>
                <p className="mt-4 font-body leading-relaxed text-gray-600">
                  Assim nasceu a Moradda: com a solidez de quem já construiu uma história de
                  confiança, e com a energia de quem quer transformar o mercado imobiliário da região
                  Sul Fluminense.
                </p>
              </div>

              {/* Placeholder Image */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-moradda-blue-100 to-moradda-blue-200 shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="h-20 w-20 text-moradda-blue-300" />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Nossos Valores */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <div className="mx-auto mb-2 h-1 w-12 rounded bg-moradda-gold-400" />
              <h2 className="font-heading text-3xl font-bold text-moradda-blue-800 sm:text-4xl">
                Nossos Valores
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {valores.map((valor, i) => (
              <ScrollReveal key={valor.title} delay={i * 0.1}>
                <div className="group rounded-2xl bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-moradda-gold-400/10">
                    <valor.icon className="h-7 w-7 text-moradda-gold-400" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-moradda-blue-800">
                    {valor.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-gray-500">
                    {valor.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* O Grupo Alfacon */}
      <section className="bg-moradda-blue-900 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-moradda-gold-400 sm:text-4xl">
                O Grupo Alfacon
              </h2>
              <p className="mt-3 font-heading text-lg text-moradda-blue-200">
                Solidez e confiança há mais de 10 anos
              </p>
              <p className="mx-auto mt-6 max-w-2xl font-body leading-relaxed text-moradda-blue-300">
                Nosso grupo empresarial reúne competências complementares para oferecer ao cliente
                uma experiência completa. Mesmos sócios. Mesma visão. Mesma excelência.
              </p>
            </div>
          </ScrollReveal>

          {/* Brand Cards */}
          <ScrollReveal>
            <div className="mt-14 grid gap-8 md:grid-cols-2">
              {/* Moradda Card */}
              <div className="rounded-2xl border border-moradda-gold-400/30 bg-moradda-blue-800 p-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-moradda-gold-400/10">
                  <Building2 className="h-7 w-7 text-moradda-gold-400" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-white">
                  Moradda Imobiliária
                </h3>
                <ul className="mt-5 space-y-3">
                  {moraddaServices.map((service) => (
                    <li
                      key={service}
                      className="flex items-center gap-2 font-body text-sm text-moradda-blue-200"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-moradda-gold-400" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Alfacon Card */}
              <div className="rounded-2xl border border-moradda-gold-400/30 bg-moradda-blue-800 p-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-moradda-gold-400/10">
                  <Calculator className="h-7 w-7 text-moradda-gold-400" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-white">
                  Alfacon Contabilidade
                </h3>
                <ul className="mt-5 space-y-3">
                  {alfaconServices.map((service) => (
                    <li
                      key={service}
                      className="flex items-center gap-2 font-body text-sm text-moradda-blue-200"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-moradda-gold-400" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Gold connecting line */}
            <div className="mx-auto mt-8 h-px w-2/3 bg-gradient-to-r from-transparent via-moradda-gold-400 to-transparent" />
          </ScrollReveal>
        </div>
      </section>

      {/* Solucoes Integradas */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <div className="mx-auto mb-2 h-1 w-12 rounded bg-moradda-gold-400" />
              <h2 className="font-heading text-3xl font-bold text-moradda-blue-800 sm:text-4xl">
                Vantagens Exclusivas do Nosso Ecossistema
              </h2>
              <p className="mx-auto mt-4 max-w-2xl font-body text-gray-500">
                Ao escolher a Moradda, você conta com o suporte de uma estrutura completa
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {solucoes.map((solucao, i) => (
              <ScrollReveal key={solucao.title} delay={i * 0.08}>
                <div className="group rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:border-moradda-gold-400/30 hover:shadow-lg">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-moradda-gold-400/10 transition-colors group-hover:bg-moradda-gold-400/20">
                    <solucao.icon className="h-7 w-7 text-moradda-gold-400" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-moradda-blue-800">
                    {solucao.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-gray-500">
                    {solucao.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Numeros */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-heading text-4xl font-bold text-moradda-blue-500 sm:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 font-body text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Sócios */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-moradda-blue-800 sm:text-4xl line-gold-center">
                Nossos Fundadores
              </h2>
              <p className="mx-auto mt-6 max-w-2xl font-body text-gray-500">
                A liderança por trás da Moradda e do Grupo Alfacon
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
            <ScrollReveal delay={100}>
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all hover:shadow-md">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-moradda-blue-100 font-heading text-2xl font-bold text-moradda-blue-600">
                  TS
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-moradda-blue-800">
                  Tamires Santos
                </h3>
                <p className="mt-1 font-body text-sm font-medium text-moradda-gold-500">
                  Contadora
                </p>
                <p className="mt-3 font-body text-sm text-gray-500">
                  Sócia-fundadora do Grupo Alfacon. À frente da Alfacon Contabilidade há mais de 10 anos, traz sua experiência em gestão, planejamento e visão estratégica para a Moradda.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all hover:shadow-md">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-moradda-blue-100 font-heading text-2xl font-bold text-moradda-blue-600">
                  SQ
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-moradda-blue-800">
                  Sebastião Queiroz
                </h3>
                <p className="mt-1 font-body text-sm font-medium text-moradda-gold-500">
                  Corretor de Imóveis
                </p>
                <p className="mt-3 font-body text-sm text-gray-500">
                  Sócio-fundador da Moradda Imobiliária. Profissional do mercado imobiliário com profundo conhecimento da região Sul Fluminense e compromisso com o atendimento de excelência.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-moradda-gold-400 to-amber-500 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Pronto para encontrar seu imóvel ideal?
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/imoveis"
                className="inline-flex items-center rounded-full bg-white px-8 py-3.5 font-body text-sm font-semibold text-moradda-blue-800 shadow-lg transition-all duration-300 hover:bg-gray-100 hover:shadow-xl"
              >
                Ver Imóveis
              </Link>
              <Link
                to="/contato"
                className="inline-flex items-center rounded-full border-2 border-white px-8 py-3.5 font-body text-sm font-semibold text-white transition-all duration-300 hover:bg-white hover:text-moradda-blue-800"
              >
                Fale Conosco
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
