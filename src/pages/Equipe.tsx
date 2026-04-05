import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Users, Phone, MessageCircle } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { supabase } from '@/lib/supabase'
import { truncate } from '@/lib/utils'

interface Corretor {
  id: string
  nome: string
  email: string
  telefone?: string
  creci?: string
  avatar_url?: string
  bio?: string
  slug: string
}

export default function EquipePage() {
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCorretores() {
      try {
        const { data, error } = await supabase
          .from('users_profiles')
          .select('id, nome, email, telefone, creci, avatar_url, bio, slug')
          .eq('ativo', true)
          .order('nome')

        if (error) {
          console.error('Erro ao buscar corretores:', error)
          setCorretores([])
          return
        }

        setCorretores(data || [])
      } catch (err) {
        console.error('Erro ao buscar corretores:', err)
        setCorretores([])
      } finally {
        setLoading(false)
      }
    }

    fetchCorretores()
  }, [])

  function getInitials(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <>
      <SEO
        title="Nossa Equipe"
        description="Conheça os profissionais da Moradda Imobiliária. Corretores especializados no mercado imobiliário de Resende e região."
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
            <span className="text-moradda-gold-400">Nossa Equipe</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            Nossa Equipe
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-moradda-blue-200"
          >
            Profissionais dedicados a encontrar o imovel ideal para voce
          </motion.p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
                <p className="mt-4 font-body text-gray-500">Carregando equipe...</p>
              </div>
            </div>
          )}

          {!loading && corretores.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-moradda-blue-50 p-6">
                <Users className="h-10 w-10 text-moradda-blue-300" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-semibold text-moradda-blue-800">
                Nenhum corretor cadastrado
              </h3>
              <p className="mt-2 max-w-md font-body text-gray-500">
                Nossa equipe esta sendo montada. Volte em breve!
              </p>
            </div>
          )}

          {!loading && corretores.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {corretores.map((corretor, i) => (
                <ScrollReveal key={corretor.id} delay={i * 100}>
                  <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-moradda-gold-400/30 hover:shadow-lg">
                    {/* Avatar */}
                    <div className="flex justify-center">
                      {corretor.avatar_url ? (
                        <img
                          src={corretor.avatar_url}
                          alt={corretor.nome}
                          className="h-24 w-24 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-moradda-blue-100 font-heading text-2xl font-bold text-moradda-blue-600">
                          {getInitials(corretor.nome)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="mt-5 text-center">
                      <h3 className="font-heading text-xl font-semibold text-moradda-blue-800">
                        {corretor.nome}
                      </h3>
                      {corretor.creci && (
                        <p className="mt-1 font-body text-sm text-moradda-gold-500">
                          CRECI {corretor.creci}
                        </p>
                      )}
                      {corretor.bio && (
                        <p className="mt-3 font-body text-sm leading-relaxed text-gray-500">
                          {truncate(corretor.bio, 120)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                      {corretor.telefone && (
                        <a
                          href={`tel:${corretor.telefone}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-moradda-blue-50 text-moradda-blue-500 transition-colors hover:bg-moradda-blue-100"
                          aria-label={`Ligar para ${corretor.nome}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {corretor.telefone && (
                        <a
                          href={`https://wa.me/${corretor.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600 transition-colors hover:bg-green-100"
                          aria-label={`WhatsApp de ${corretor.nome}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    {/* Link */}
                    <div className="mt-5 text-center">
                      <Link
                        to={`/equipe/${corretor.slug}`}
                        className="inline-flex items-center gap-1 font-body text-sm font-semibold text-moradda-blue-500 transition-colors hover:text-moradda-gold-500"
                      >
                        Ver perfil
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
