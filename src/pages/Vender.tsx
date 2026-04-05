import { Link } from 'react-router-dom'
import { ChevronRight, Home, Camera, Users, TrendingUp, ArrowRight, Check, Star, MessageCircle } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { WHATSAPP_NUMBER } from '@/lib/constants'

export default function VenderPage() {
  return (
    <>
      <SEO
        title="Anuncie seu Imóvel — Venda ou Alugue com a Moradda"
        description="Anuncie seu imóvel com a Moradda Imobiliária. Alcance milhares de compradores e locatários com atendimento profissional e tecnologia de ponta."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-moradda-blue-800 via-moradda-blue-900 to-moradda-blue-950 pb-20 pt-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-moradda-gold-400 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-moradda-blue-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400"><Home className="h-4 w-4" /></Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Anuncie seu Imóvel</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-moradda-gold-400/20 px-4 py-1.5 font-body text-sm font-semibold text-moradda-gold-400">
              Anúncio Gratuito
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Venda ou Alugue seu Imóvel com <span className="text-moradda-gold-400">Quem Entende</span>
            </h1>
            <p className="mt-6 font-body text-xl text-moradda-blue-200">
              Cadastre seu imóvel na Moradda e alcance milhares de interessados com nossa plataforma moderna e equipe especializada.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/contato"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-moradda-gold-400 px-8 py-4 font-body text-base font-semibold text-white shadow-lg transition-all hover:bg-moradda-gold-500 hover:shadow-xl"
              >
                Quero Anunciar <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá, gostaria de anunciar meu imóvel na Moradda.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 font-body text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-moradda-blue-800 sm:text-4xl line-gold-center">
                Como Funciona
              </h2>
              <p className="mx-auto mt-6 max-w-2xl font-body text-gray-500">
                Anunciar seu imóvel com a Moradda é simples, rápido e sem complicação.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              { step: '01', icon: MessageCircle, title: 'Entre em Contato', desc: 'Fale conosco por WhatsApp, telefone ou formulário com as informações do seu imóvel' },
              { step: '02', icon: Camera, title: 'Fotos Profissionais', desc: 'Nossa equipe cuida das fotos e de todo o material de divulgação do seu imóvel' },
              { step: '03', icon: TrendingUp, title: 'Divulgação Estratégica', desc: 'Seu imóvel é publicado no site, portais parceiros e redes sociais' },
              { step: '04', icon: Users, title: 'Atendimento aos Interessados', desc: 'Cuidamos de toda a intermediação, visitas e negociação' },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="relative rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md">
                  <span className="font-heading text-5xl font-bold text-moradda-blue-100">{item.step}</span>
                  <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-moradda-gold-400/10">
                    <item.icon className="h-7 w-7 text-moradda-gold-500" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-moradda-blue-800">{item.title}</h3>
                  <p className="mt-2 font-body text-sm text-gray-500">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-3xl font-bold text-moradda-blue-800 line-gold">
                  Por que Escolher a Moradda?
                </h2>
                <div className="mt-8 space-y-5">
                  {[
                    { title: 'Plataforma moderna e otimizada', desc: 'Site de alto desempenho com SEO otimizado que atrai mais visitantes qualificados' },
                    { title: 'Marca d\'água profissional', desc: 'Todas as fotos recebem marca d\'água automática da Moradda para proteger seu anúncio' },
                    { title: 'Suporte do Grupo Alfacon', desc: 'Apoio contábil, tributário e documental para facilitar toda a transação' },
                    { title: 'Equipe de corretores qualificados', desc: 'Profissionais experientes que conhecem o mercado de Resende e região' },
                    { title: 'Sem custo de anúncio', desc: 'Você não paga nada para anunciar. Só cobra comissão sobre a venda ou locação' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-moradda-gold-400">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="font-body text-base font-semibold text-moradda-blue-800">{item.title}</p>
                        <p className="font-body text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="rounded-2xl bg-moradda-blue-900 p-8 text-center">
                <Star className="mx-auto h-12 w-12 text-moradda-gold-400" />
                <h3 className="mt-4 font-heading text-2xl font-bold text-white">
                  Pronto para Anunciar?
                </h3>
                <p className="mt-3 font-body text-moradda-blue-200">
                  Entre em contato agora e comece a receber propostas para o seu imóvel.
                </p>
                <Link
                  to="/contato"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-moradda-gold-400 px-8 py-4 font-body font-semibold text-white transition-all hover:bg-moradda-gold-500"
                >
                  Fale com Nossa Equipe <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  )
}
