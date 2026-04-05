import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Heart, Home } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import ImovelCard from '@/components/imoveis/ImovelCard'
import { supabase } from '@/lib/supabase'
import type { Imovel } from '@/types'

export default function FavoritosPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [loading, setLoading] = useState(true)
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('moradda_favoritos') || '[]')
    } catch { return [] }
  })

  const fetchFavoritos = useCallback(async () => {
    if (favoritos.length === 0) {
      setImoveis([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('id, codigo, slug, titulo, tipo, finalidade, preco, quartos, banheiros, vagas_garagem, area_construida, bairros(nome), users_profiles!corretor_id(nome, creci), imoveis_fotos(url_watermark, principal, ordem)')
        .in('id', favoritos)
        .eq('status', 'publicado')

      if (error) {
        console.error('Erro ao buscar favoritos:', error)
        setImoveis([])
        return
      }

      const mapped: Imovel[] = (data || []).map((row: any) => ({
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
        bairro_id: '',
        bairro: row.bairros ? { id: '', nome: row.bairros.nome, slug: '', cidade: 'Resende', publicado: true, created_at: '' } : undefined,
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
      console.error('Erro ao buscar favoritos:', err)
      setImoveis([])
    } finally {
      setLoading(false)
    }
  }, [favoritos])

  useEffect(() => {
    fetchFavoritos()
  }, [fetchFavoritos])

  const toggleFavorito = (id: string) => {
    setFavoritos(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('moradda_favoritos', JSON.stringify(next))
      return next
    })
  }

  return (
    <>
      <SEO
        title="Favoritos"
        description="Seus imoveis favoritos salvos na Moradda Imobiliaria."
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
            <span className="text-moradda-gold-400">Favoritos</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            Meus Favoritos
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-moradda-blue-200"
          >
            {favoritos.length > 0
              ? `Voce tem ${favoritos.length} ${favoritos.length === 1 ? 'imovel salvo' : 'imoveis salvos'}`
              : 'Seus imoveis favoritos aparecerao aqui'}
          </motion.p>
        </div>
      </section>

      {/* Results */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
                <p className="mt-4 font-body text-gray-500">Carregando favoritos...</p>
              </div>
            </div>
          )}

          {!loading && imoveis.length > 0 && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          )}

          {!loading && imoveis.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-moradda-blue-50 p-6">
                <Heart className="h-10 w-10 text-moradda-blue-300" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-semibold text-moradda-blue-800">
                Voce ainda nao salvou nenhum imovel
              </h3>
              <p className="mt-2 max-w-md font-body text-gray-500">
                Explore nosso catalogo e clique no coracao para salvar seus imoveis favoritos.
              </p>
              <Link
                to="/imoveis"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
              >
                <Home className="h-4 w-4" />
                Ver imoveis
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
