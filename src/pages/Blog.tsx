import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, FileText, Calendar, User } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { supabase } from '@/lib/supabase'
import { truncate } from '@/lib/utils'

interface BlogPostItem {
  id: string
  titulo: string
  slug: string
  resumo: string
  imagem_capa?: string
  categoria: string
  created_at: string
  users_profiles?: {
    nome: string
  }
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, titulo, slug, resumo, imagem_capa, categoria, created_at, users_profiles!autor_id(nome)')
          .eq('publicado', true)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Erro ao buscar posts:', error)
          setPosts([])
          return
        }

        const mapped = (data || []).map((row: any) => ({
          ...row,
          users_profiles: Array.isArray(row.users_profiles) ? row.users_profiles[0] : row.users_profiles,
        }))
        setPosts(mapped)
      } catch (err) {
        console.error('Erro ao buscar posts:', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <>
      <SEO
        title="Blog"
        description="Dicas, novidades e informacoes sobre o mercado imobiliario de Resende e regiao. Blog da Moradda Imobiliaria."
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
            <span className="text-moradda-gold-400">Blog</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            Blog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-moradda-blue-200"
          >
            Dicas, novidades e informacoes sobre o mercado imobiliario
          </motion.p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
                <p className="mt-4 font-body text-gray-500">Carregando artigos...</p>
              </div>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-moradda-blue-50 p-6">
                <FileText className="h-10 w-10 text-moradda-blue-300" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-semibold text-moradda-blue-800">
                Nenhum artigo publicado ainda
              </h3>
              <p className="mt-2 max-w-md font-body text-gray-500">
                Volte em breve! Estamos preparando conteudos incriveis sobre o mercado imobiliario.
              </p>
              <Link
                to="/"
                className="mt-6 inline-block rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
              >
                Voltar ao inicio
              </Link>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <ScrollReveal key={post.id} delay={i * 80}>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-moradda-gold-400/30 hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-moradda-blue-100 to-moradda-blue-50">
                      {post.imagem_capa ? (
                        <img
                          src={post.imagem_capa}
                          alt={post.titulo}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FileText className="h-12 w-12 text-moradda-blue-200" />
                        </div>
                      )}

                      {/* Category Badge */}
                      {post.categoria && (
                        <div className="absolute left-3 top-3">
                          <span className="rounded-lg bg-moradda-gold-400 px-3 py-1 font-body text-xs font-semibold text-white shadow-md">
                            {post.categoria}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-heading text-lg font-semibold leading-tight text-moradda-blue-800 transition-colors group-hover:text-moradda-gold-500">
                        {post.titulo}
                      </h3>

                      {post.resumo && (
                        <p className="mt-2 font-body text-sm leading-relaxed text-gray-500">
                          {truncate(post.resumo, 120)}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="mt-auto flex items-center gap-4 border-t border-gray-100 pt-4 mt-4">
                        {post.users_profiles?.nome && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <User className="h-3.5 w-3.5" />
                            <span className="font-body text-xs">{post.users_profiles.nome}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="font-body text-xs">{formatDate(post.created_at)}</span>
                        </div>
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
