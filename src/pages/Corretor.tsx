import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Phone, MessageCircle, Home, Users } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import ImovelCard from '@/components/imoveis/ImovelCard'
import { supabase } from '@/lib/supabase'
import type { Imovel } from '@/types'

interface CorretorProfile {
  id: string
  nome: string
  email: string
  telefone?: string
  whatsapp?: string
  creci?: string
  avatar_url?: string
  bio?: string
  slug: string
}

export default function CorretorPage() {
  const { slug } = useParams()
  const [corretor, setCorretor] = useState<CorretorProfile | null>(null)
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('moradda_favoritos') || '[]')
    } catch { return [] }
  })

  useEffect(() => {
    async function fetchCorretor() {
      if (!slug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setCorretor(data)

        // Fetch properties
        const { data: imoveisData } = await supabase
          .from('imoveis')
          .select('id, codigo, slug, titulo, tipo, finalidade, preco, quartos, banheiros, vagas_garagem, area_construida, bairros(nome), imoveis_fotos(url_watermark, principal, ordem)')
          .eq('corretor_id', data.id)
          .eq('status', 'publicado')
          .order('created_at', { ascending: false })

        const mapped: Imovel[] = (imoveisData || []).map((row: any) => ({
          id: row.id,
          codigo: row.codigo,
          slug: row.slug,
          titulo: row.titulo,
          descricao: '',
          tipo: row.tipo,
          finalidade: row.finalidade,
          status: 'publicado',
          cep: '',
          endereco: '',
          numero: '',
          cidade: 'Resende',
          estado: 'RJ',
          preco: row.preco,
          quartos: row.quartos,
          suites: 0,
          banheiros: row.banheiros,
          vagas_garagem: row.vagas_garagem,
          area_construida: row.area_construida,
          area_total: undefined,
          caracteristicas: [],
          destaque: false,
          visualizacoes: 0,
          corretor_id: data.id,
          bairro_id: '',
          bairro: row.bairros ? { id: '', nome: row.bairros.nome, slug: '', cidade: 'Resende', publicado: true, created_at: '' } : undefined,
          fotos: (row.imoveis_fotos || []).sort((a: any, b: any) => a.ordem - b.ordem).map((f: any) => ({
            id: '', imovel_id: row.id, url: f.url_watermark, url_watermark: f.url_watermark,
            principal: f.principal, ordem: f.ordem, created_at: '',
          })),
          foto_principal: (() => {
            const fotos = row.imoveis_fotos || []
            const principal = fotos.find((f: any) => f.principal)
            return principal?.url_watermark || fotos[0]?.url_watermark || undefined
          })(),
          created_at: '',
          updated_at: '',
        }))

        setImoveis(mapped)
      } catch (err) {
        console.error('Erro ao buscar corretor:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchCorretor()
  }, [slug])

  const toggleFavorito = (id: string) => {
    setFavoritos(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('moradda_favoritos', JSON.stringify(next))
      return next
    })
  }

  function getInitials(nome: string): string {
    return nome.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  }

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
          <p className="mt-4 font-body text-gray-500">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  // 404
  if (notFound || !corretor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="inline-block rounded-full bg-moradda-blue-50 p-6">
            <Users className="h-12 w-12 text-moradda-blue-300" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold text-moradda-blue-800">Corretor nao encontrado</h1>
          <p className="mt-2 font-body text-gray-500">O perfil que voce procura nao existe ou nao esta mais disponivel.</p>
          <Link
            to="/equipe"
            className="mt-6 inline-block rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
          >
            Ver toda a equipe
          </Link>
        </div>
      </div>
    )
  }

  const whatsappNumber = corretor.whatsapp || corretor.telefone || ''

  return (
    <>
      <SEO
        title={`${corretor.nome} — Corretor`}
        description={corretor.bio ? corretor.bio.slice(0, 160) : `Conheça ${corretor.nome}, corretor da Moradda Imobiliária.`}
      />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,169,74,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400">Inicio</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/equipe" className="transition-colors hover:text-moradda-gold-400">Equipe</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-moradda-gold-400">{corretor.nome}</span>
          </nav>

          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            {/* Avatar */}
            {corretor.avatar_url ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                src={corretor.avatar_url}
                alt={corretor.nome}
                className="h-28 w-28 rounded-full border-4 border-moradda-gold-400/30 object-cover shadow-lg"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-moradda-gold-400/30 bg-moradda-blue-700 font-heading text-3xl font-bold text-white"
              >
                {getInitials(corretor.nome)}
              </motion.div>
            )}

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-heading text-3xl font-bold text-white sm:text-4xl"
              >
                {corretor.nome}
              </motion.h1>
              {corretor.creci && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-1 font-body text-moradda-gold-400"
                >
                  CRECI {corretor.creci}
                </motion.p>
              )}

              {/* Contact buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 flex gap-3"
              >
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 font-body text-sm font-semibold text-white shadow-md transition-all hover:bg-green-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {corretor.telefone && (
                  <a
                    href={`tel:${corretor.telefone}`}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-5 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4" />
                    Ligar
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio */}
      {corretor.bio && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl">
                <div className="mb-2 h-1 w-12 rounded bg-moradda-gold-400" />
                <h2 className="font-heading text-2xl font-bold text-moradda-blue-800">Sobre</h2>
                <p className="mt-4 font-body leading-relaxed text-gray-600 whitespace-pre-line">
                  {corretor.bio}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Properties */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-2 h-1 w-12 rounded bg-moradda-gold-400" />
            <h2 className="font-heading text-2xl font-bold text-moradda-blue-800">
              Imoveis de {corretor.nome.split(' ')[0]}
            </h2>
          </ScrollReveal>

          {imoveis.length > 0 ? (
            <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {imoveis.map((imovel, i) => (
                <ScrollReveal key={imovel.id} delay={i * 80}>
                  <ImovelCard
                    imovel={imovel}
                    onFavorite={toggleFavorito}
                    isFavorito={favoritos.includes(imovel.id)}
                  />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-moradda-blue-50 p-6">
                <Home className="h-10 w-10 text-moradda-blue-300" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-semibold text-moradda-blue-800">
                Nenhum imovel publicado
              </h3>
              <p className="mt-2 max-w-md font-body text-gray-500">
                Este corretor ainda nao possui imoveis publicados.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
