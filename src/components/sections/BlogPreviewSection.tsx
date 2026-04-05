import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar } from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'
import { supabase } from '@/lib/supabase'

interface BlogPost {
  id: string
  titulo: string
  slug: string
  resumo: string
  imagem_capa: string | null
  categoria: string
  created_at: string
}

const fallbackPosts = [
  {
    id: 1,
    titulo: 'Como declarar imóvel no IRPF',
    resumo:
      'Entenda o passo a passo para declarar corretamente seu imóvel no Imposto de Renda e evitar problemas com a Receita Federal.',
    categoria: 'Tributário',
    data: '28 Mar 2026',
  },
  {
    id: 2,
    titulo: '5 dicas para comprar seu primeiro imóvel',
    resumo:
      'Comprar o primeiro imóvel é um grande passo. Confira nossas dicas essenciais para fazer uma escolha segura e inteligente.',
    categoria: 'Dicas',
    data: '15 Mar 2026',
  },
  {
    id: 3,
    titulo: 'Os bairros mais valorizados de Resende',
    resumo:
      'Descubra quais são os bairros com maior valorização imobiliária em Resende e por que investir nessas regiões.',
    categoria: 'Mercado',
    data: '02 Mar 2026',
  },
]

export default function BlogPreviewSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [_loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, titulo, slug, resumo, imagem_capa, categoria, created_at')
          .eq('publicado', true)
          .order('created_at', { ascending: false })
          .limit(3)

        if (!error && data && data.length > 0) {
          setPosts(data)
        }
      } catch {
        // fallback will be used
      } finally {
        setLoaded(true)
      }
    }
    fetchPosts()
  }, [])

  const displayPosts = posts.length > 0
    ? posts.map(p => ({
        id: p.id,
        titulo: p.titulo,
        resumo: p.resumo,
        categoria: p.categoria,
        data: new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        slug: p.slug,
        imagem_capa: p.imagem_capa,
      }))
    : fallbackPosts.map(p => ({ ...p, slug: '', imagem_capa: null }))

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-moradda-blue-800 line-gold-center">
              Dicas e Conteúdos
            </h2>
            <p className="text-gray-500 font-body mt-6 text-lg">
              Fique por dentro do mercado imobiliário
            </p>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayPosts.map((post, index) => (
            <ScrollReveal key={post.id} delay={index * 150}>
              <Link to={post.slug ? `/blog/${post.slug}` : '/blog'} className="group block">
                <div className="card-premium bg-white rounded-2xl overflow-hidden border border-gray-100">
                  {/* Image */}
                  <div className="h-48 bg-gradient-to-br from-moradda-blue-50 to-moradda-blue-100 relative overflow-hidden">
                    {post.imagem_capa ? (
                      <img src={post.imagem_capa} alt={post.titulo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className="w-20 h-20 rounded-full border-2 border-moradda-blue-300" />
                      </div>
                    )}
                    {/* Category badge */}
                    <span className="absolute top-4 left-4 bg-moradda-blue-500 text-white text-xs font-body font-semibold px-3 py-1 rounded-full">
                      {post.categoria}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-body mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.data}
                    </div>
                    <h3 className="font-heading text-lg text-moradda-blue-800 mb-2 group-hover:text-moradda-blue-500 transition-colors line-clamp-2">
                      {post.titulo}
                    </h3>
                    <p className="text-gray-500 font-body text-sm leading-relaxed line-clamp-3 mb-4">
                      {post.resumo}
                    </p>
                    <span className="inline-flex items-center gap-1 text-moradda-gold-500 font-body font-semibold text-sm group-hover:gap-2 transition-all duration-300">
                      Ler mais
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={500}>
          <div className="text-center mt-14">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-moradda-blue-500 hover:text-moradda-blue-700 font-body font-semibold transition-colors duration-300"
            >
              Ver todos os artigos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
