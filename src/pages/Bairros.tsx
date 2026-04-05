import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, MapPin } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { supabase } from '@/lib/supabase'
import { truncate } from '@/lib/utils'

interface BairroItem {
  id: string
  nome: string
  slug: string
  descricao?: string
  foto_url?: string
}

export default function BairrosPage() {
  const [bairros, setBairros] = useState<BairroItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBairros() {
      try {
        const { data, error } = await supabase
          .from('bairros')
          .select('id, nome, slug, descricao, foto_url')
          .eq('publicado', true)
          .order('nome')

        if (error) {
          console.error('Erro ao buscar bairros:', error)
          setBairros([])
          return
        }

        setBairros(data || [])
      } catch (err) {
        console.error('Erro ao buscar bairros:', err)
        setBairros([])
      } finally {
        setLoading(false)
      }
    }

    fetchBairros()
  }, [])

  return (
    <>
      <SEO
        title="Bairros de Resende"
        description="Explore os melhores bairros de Resende-RJ. Conheça cada região e encontre o local ideal para morar."
      />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,169,74,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-moradda-gold-400">Bairros</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            Bairros de Resende
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-moradda-blue-200"
          >
            Conheca os melhores bairros da cidade e encontre o lugar perfeito para voce
          </motion.p>
        </div>
      </section>

      {/* Bairros Grid */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
                <p className="mt-4 font-body text-gray-500">Carregando bairros...</p>
              </div>
            </div>
          )}

          {!loading && bairros.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-moradda-blue-50 p-6">
                <MapPin className="h-10 w-10 text-moradda-blue-300" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-semibold text-moradda-blue-800">
                Nenhum bairro cadastrado
              </h3>
              <p className="mt-2 max-w-md font-body text-gray-500">
                Os bairros estao sendo adicionados. Volte em breve!
              </p>
            </div>
          )}

          {!loading && bairros.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {bairros.map((bairro, i) => (
                <ScrollReveal key={bairro.id} delay={i * 80}>
                  <Link
                    to={`/bairros/${bairro.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-moradda-gold-400/30 hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-moradda-blue-100 to-moradda-blue-50">
                      {bairro.foto_url ? (
                        <img
                          src={bairro.foto_url}
                          alt={bairro.nome}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <MapPin className="h-12 w-12 text-moradda-blue-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="rounded-lg bg-white/95 px-4 py-2 font-heading text-lg font-bold text-moradda-blue-800 shadow-md backdrop-blur-sm">
                          {bairro.nome}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      {bairro.descricao && (
                        <p className="font-body text-sm leading-relaxed text-gray-500">
                          {truncate(bairro.descricao, 140)}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-1 font-body text-sm font-semibold text-moradda-blue-500 transition-colors group-hover:text-moradda-gold-500">
                        Explorar bairro
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
