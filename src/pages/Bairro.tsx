import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, MapPin, Home } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import ImovelCard from '@/components/imoveis/ImovelCard'
import { supabase } from '@/lib/supabase'
import type { Imovel, Bairro } from '@/types'

export default function BairroPage() {
  const { slug } = useParams()
  const [bairro, setBairro] = useState<Bairro | null>(null)
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('moradda_favoritos') || '[]')
    } catch { return [] }
  })

  useEffect(() => {
    async function fetchBairro() {
      if (!slug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('bairros')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setBairro(data)

        // Fetch properties in this bairro
        const { data: imoveisData } = await supabase
          .from('imoveis')
          .select('id, codigo, slug, titulo, tipo, finalidade, preco, quartos, banheiros, vagas_garagem, area_construida, bairros(nome), users_profiles!corretor_id(nome, creci, avatar_url), imoveis_fotos(url_watermark, principal, ordem)')
          .eq('bairro_id', data.id)
          .eq('status', 'publicado')

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
          corretor_id: '',
          bairro_id: data.id,
          bairro: row.bairros ? { id: data.id, nome: row.bairros.nome, slug: data.slug, cidade: 'Resende', publicado: true, created_at: '' } : undefined,
          corretor: row.users_profiles ? {
            id: '', user_id: '', nome: row.users_profiles.nome, email: '', slug: '',
            role_id: '', ativo: true, created_at: '', creci: row.users_profiles.creci,
          } : undefined,
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
        console.error('Erro ao buscar bairro:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchBairro()
  }, [slug])

  const toggleFavorito = (id: string) => {
    setFavoritos(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('moradda_favoritos', JSON.stringify(next))
      return next
    })
  }

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
          <p className="mt-4 font-body text-gray-500">Carregando bairro...</p>
        </div>
      </div>
    )
  }

  // 404
  if (notFound || !bairro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="inline-block rounded-full bg-moradda-blue-50 p-6">
            <MapPin className="h-12 w-12 text-moradda-blue-300" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold text-moradda-blue-800">Bairro nao encontrado</h1>
          <p className="mt-2 font-body text-gray-500">O bairro que voce procura nao existe ou nao esta disponivel.</p>
          <Link
            to="/bairros"
            className="mt-6 inline-block rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
          >
            Ver todos os bairros
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title={`${bairro.nome} — Bairro`}
        description={bairro.descricao ? bairro.descricao.slice(0, 160) : `Imoveis no bairro ${bairro.nome} em Resende-RJ. Encontre casas, apartamentos e terrenos.`}
      />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,169,74,0.08),transparent_60%)]" />
        {bairro.foto_url && (
          <div className="absolute inset-0">
            <img src={bairro.foto_url} alt={bairro.nome} className="h-full w-full object-cover opacity-20" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400">Inicio</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/bairros" className="transition-colors hover:text-moradda-gold-400">Bairros</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-moradda-gold-400">{bairro.nome}</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            {bairro.nome}
          </motion.h1>
          {bairro.descricao && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-moradda-blue-200"
            >
              {bairro.descricao}
            </motion.p>
          )}
        </div>
      </section>

      {/* Properties */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-2 h-1 w-12 rounded bg-moradda-gold-400" />
            <h2 className="font-heading text-2xl font-bold text-moradda-blue-800">
              Imoveis em {bairro.nome}
            </h2>
            <p className="mt-2 font-body text-gray-500">
              {imoveis.length > 0
                ? `${imoveis.length} ${imoveis.length === 1 ? 'imovel encontrado' : 'imoveis encontrados'}`
                : 'Nenhum imovel disponivel neste bairro no momento'}
            </p>
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
                Nenhum imovel disponivel
              </h3>
              <p className="mt-2 max-w-md font-body text-gray-500">
                No momento nao ha imoveis publicados neste bairro.
              </p>
              <Link
                to="/imoveis"
                className="mt-6 inline-block rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
              >
                Ver todos os imoveis
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
