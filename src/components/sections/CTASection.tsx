import { Link } from 'react-router-dom'
import ScrollReveal from '@/components/common/ScrollReveal'

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-moradda-gold-400 via-moradda-gold-500 to-moradda-gold-600 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal>
          <h2 className="font-heading text-3xl sm:text-4xl text-white mb-4">
            Quer Vender ou Anunciar seu Imóvel?
          </h2>
          <p className="text-white/90 font-body text-lg mb-10 max-w-2xl mx-auto">
            Cadastre seu imóvel na Moradda e alcance milhares de interessados com
            a nossa plataforma
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/vender"
              className="inline-flex items-center justify-center bg-white text-moradda-gold-600 font-body font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors duration-300 shadow-lg shadow-black/10 min-w-[180px]"
            >
              Anuncie Grátis
            </Link>
            <Link
              to="/contato"
              className="inline-flex items-center justify-center border-2 border-white text-white font-body font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors duration-300 min-w-[180px]"
            >
              Fale Conosco
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
