import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TIPOS_IMOVEL, FINALIDADES } from '@/lib/constants'

const stats = [
  { value: '150+', label: 'Imóveis' },
  { value: '50+', label: 'Famílias Atendidas' },
  { value: '10+', label: 'Anos de Experiência' },
  { value: '98%', label: 'Satisfação' },
]

export default function HeroSection() {
  const [tipo, setTipo] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [finalidade, setFinalidade] = useState('')

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-moradda-blue-900 via-moradda-blue-800 to-moradda-blue-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(27,79,138,0.4),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,169,74,0.08),transparent_50%)]" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex-1 flex flex-col justify-center">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="inline-block text-moradda-gold-400 font-body text-sm tracking-[0.2em] uppercase mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Moradda Imobiliária
          </motion.span>

          <motion.h1
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Encontre o imóvel{' '}
            <span className="text-moradda-gold-400">dos seus sonhos</span>
          </motion.h1>

          <motion.p
            className="text-moradda-blue-200 text-lg sm:text-xl max-w-2xl mx-auto mb-12 font-body leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            A Moradda Imobiliária oferece imóveis selecionados com atendimento
            exclusivo e personalizado
          </motion.p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          className="max-w-4xl mx-auto w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
            <div className="flex flex-col md:flex-row gap-2">
              {/* Tipo */}
              <div className="relative flex-1">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full appearance-none bg-white/10 text-white rounded-xl px-5 py-4 pr-10 font-body text-sm border border-white/5 focus:outline-none focus:border-moradda-gold-400/50 transition-colors cursor-pointer"
                >
                  <option value="" className="text-gray-900">
                    Tipo de Imóvel
                  </option>
                  {TIPOS_IMOVEL.map((t) => (
                    <option key={t.value} value={t.value} className="text-gray-900">
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>

              {/* Localização */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Localização"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl px-5 py-4 font-body text-sm border border-white/5 focus:outline-none focus:border-moradda-gold-400/50 transition-colors"
                />
              </div>

              {/* Finalidade */}
              <div className="relative flex-1">
                <select
                  value={finalidade}
                  onChange={(e) => setFinalidade(e.target.value)}
                  className="w-full appearance-none bg-white/10 text-white rounded-xl px-5 py-4 pr-10 font-body text-sm border border-white/5 focus:outline-none focus:border-moradda-gold-400/50 transition-colors cursor-pointer"
                >
                  <option value="" className="text-gray-900">
                    Finalidade
                  </option>
                  {FINALIDADES.map((f) => (
                    <option key={f.value} value={f.value} className="text-gray-900">
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>

              {/* Search button */}
              <Link
                to="/imoveis"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-moradda-gold-400 to-moradda-gold-600 text-white font-body font-semibold text-sm px-8 py-4 rounded-xl hover:from-moradda-gold-500 hover:to-moradda-gold-700 transition-all duration-300 shadow-lg shadow-moradda-gold-400/20"
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="py-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + i * 0.15 }}
              >
                <div className="text-2xl sm:text-3xl font-heading font-bold text-moradda-gold-400">
                  {stat.value}
                </div>
                <div className="text-sm text-moradda-blue-200 mt-1 font-body">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
