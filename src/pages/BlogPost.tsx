import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, FileText, Calendar, ArrowLeft } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { supabase } from '@/lib/supabase'

interface BlogPostData {
  id: string
  titulo: string
  slug: string
  conteudo: string
  resumo: string
  imagem_capa?: string
  categoria: string
  tags: string[]
  created_at: string
  updated_at: string
  users_profiles?: {
    nome: string
    avatar_url?: string
  }
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      if (!slug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*, users_profiles!autor_id(nome, avatar_url)')
          .eq('slug', slug)
          .eq('publicado', true)
          .single()

        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setPost(data)
      } catch (err) {
        console.error('Erro ao buscar artigo:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
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
          <p className="mt-4 font-body text-gray-500">Carregando artigo...</p>
        </div>
      </div>
    )
  }

  // 404
  if (notFound || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="inline-block rounded-full bg-moradda-blue-50 p-6">
            <FileText className="h-12 w-12 text-moradda-blue-300" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold text-moradda-blue-800">Artigo nao encontrado</h1>
          <p className="mt-2 font-body text-gray-500">O artigo que voce procura nao existe ou nao esta mais disponivel.</p>
          <Link
            to="/blog"
            className="mt-6 inline-block rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
          >
            Voltar ao blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title={post.titulo}
        description={post.resumo ? post.resumo.slice(0, 160) : `Leia "${post.titulo}" no blog da Moradda Imobiliaria.`}
        image={post.imagem_capa}
        type="article"
        url={`/blog/${post.slug}`}
      />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,169,74,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400">Inicio</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/blog" className="transition-colors hover:text-moradda-gold-400">Blog</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-moradda-gold-400 line-clamp-1">{post.titulo}</span>
          </nav>

          {post.categoria && (
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 inline-block rounded-lg bg-moradda-gold-400 px-4 py-1.5 font-body text-sm font-semibold text-white"
            >
              {post.categoria}
            </motion.span>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            {post.titulo}
          </motion.h1>

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center gap-6"
          >
            {post.users_profiles?.nome && (
              <div className="flex items-center gap-3">
                {post.users_profiles.avatar_url ? (
                  <img
                    src={post.users_profiles.avatar_url}
                    alt={post.users_profiles.nome}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-moradda-blue-700 font-heading text-sm font-bold text-white">
                    {getInitials(post.users_profiles.nome)}
                  </div>
                )}
                <span className="font-body text-sm text-moradda-blue-200">{post.users_profiles.nome}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-moradda-blue-300">
              <Calendar className="h-4 w-4" />
              <span className="font-body text-sm">{formatDate(post.created_at)}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Cover Image */}
          {post.imagem_capa && (
            <ScrollReveal>
              <div className="-mt-24 mb-10 overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={post.imagem_capa}
                  alt={post.titulo}
                  className="h-auto w-full object-cover"
                />
              </div>
            </ScrollReveal>
          )}

          {/* Article Body */}
          <ScrollReveal>
            <div
              className="prose prose-lg max-w-none font-body text-gray-700 prose-headings:font-heading prose-headings:text-moradda-blue-800 prose-a:text-moradda-blue-500 prose-a:no-underline hover:prose-a:text-moradda-gold-500 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.conteudo }}
            />
          </ScrollReveal>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <ScrollReveal>
              <div className="mt-10 border-t border-gray-100 pt-8">
                <h3 className="font-heading text-sm font-semibold text-moradda-blue-800">Tags</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-moradda-blue-50 px-3 py-1.5 font-body text-xs font-medium text-moradda-blue-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Back link */}
          <ScrollReveal>
            <div className="mt-10 border-t border-gray-100 pt-8">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-moradda-blue-500 transition-colors hover:text-moradda-gold-500"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao blog
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
