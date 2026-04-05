import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ChevronRight, Home, LayoutGrid, List } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import ImovelCard from '@/components/imoveis/ImovelCard'
import ImovelFilters from '@/components/imoveis/ImovelFilters'
import { supabase } from '@/lib/supabase'
import type { FiltrosBusca, Imovel } from '@/types'

const PER_PAGE = 12

export default function ImoveisPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [bairros, setBairros] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('moradda_favoritos') || '[]')
    } catch { return [] }
  })

  const filtros: FiltrosBusca = {
    tipo: searchParams.get('tipo') as FiltrosBusca['tipo'] || undefined,
    finalidade: searchParams.get('finalidade') as FiltrosBusca['finalidade'] || undefined,
    bairro_id: searchParams.get('bairro') || undefined,
    busca: searchParams.get('q') || undefined,
    quartos_min: searchParams.get('quartos') ? Number(searchParams.get('quartos')) : undefined,
    ordenar: (searchParams.get('ordenar') as FiltrosBusca['ordenar']) || 'recentes',
    pagina: Number(searchParams.get('pagina')) || 1,
    por_pagina: 12,
  }

  // Fetch bairros on mount
  useEffect(() => {
    async function fetchBairros() {
      const { data } = await supabase
        .from('bairros')
        .select('id, nome')
        .order('nome')
      if (data) setBairros(data)
    }
    fetchBairros()
  }, [])

  // Fetch imoveis when filters change
  const fetchImoveis = useCallback(async () => {
    setLoading(true)
    try {
      const page = filtros.pagina || 1
      let query = supabase
        .from('imoveis')
        .select('id, codigo, slug, titulo, descricao, tipo, finalidade, status, preco, quartos, suites, banheiros, vagas_garagem, area_construida, area_total, destaque, corretor_id, bairro_id, bairros(id, nome), users_profiles!corretor_id(id, nome, creci, slug, avatar_url), imoveis_fotos(id, url_watermark, url_thumb, principal, ordem)', { count: 'exact' })
        .eq('status', 'publicado')

      if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
      if (filtros.finalidade) query = query.eq('finalidade', filtros.finalidade)
      if (filtros.bairro_id) query = query.eq('bairro_id', filtros.bairro_id)
      if (filtros.quartos_min) query = query.gte('quartos', filtros.quartos_min)
      if (filtros.busca) query = query.or(`titulo.ilike.%${filtros.busca}%,codigo.ilike.%${filtros.busca}%`)
      if (filtros.ordenar === 'preco_asc') query = query.order('preco', { ascending: true })
      else if (filtros.ordenar === 'preco_desc') query = query.order('preco', { ascending: false })
      else query = query.order('created_at', { ascending: false })

      query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao buscar imóveis:', error)
        setImoveis([])
        setTotalCount(0)
        return
      }

      if (typeof count === 'number') setTotalCount(count)

      // Map Supabase response to Imovel type
      const mapped: Imovel[] = (data || []).map((row: any) => ({
        id: row.id,
        codigo: row.codigo,
        slug: row.slug,
        titulo: row.titulo,
        descricao: row.descricao || '',
        tipo: row.tipo,
        finalidade: row.finalidade,
        status: row.status,
        cep: '',
        endereco: '',
        numero: '',
        cidade: 'Resende',
        estado: 'RJ',
        preco: row.preco,
        quartos: row.quartos,
        suites: row.suites,
        banheiros: row.banheiros,
        vagas_garagem: row.vagas_garagem,
        area_construida: row.area_construida,
        area_total: row.area_total,
        caracteristicas: [],
        destaque: row.destaque,
        visualizacoes: 0,
        corretor_id: row.corretor_id,
        bairro_id: row.bairro_id,
        bairro: row.bairros ? {
          id: row.bairros.id,
          nome: row.bairros.nome,
          slug: '',
          cidade: 'Resende',
          publicado: true,
          created_at: '',
        } : undefined,
        corretor: row.users_profiles ? {
          id: row.users_profiles.id,
          user_id: '',
          nome: row.users_profiles.nome,
          email: '',
          slug: row.users_profiles.slug || '',
          role_id: '',
          ativo: true,
          created_at: '',
          creci: row.users_profiles.creci,
        } : undefined,
        fotos: (row.imoveis_fotos || []).sort((a: any, b: any) => a.ordem - b.ordem).map((f: any) => ({
          id: f.id, imovel_id: row.id, url: f.url_watermark, url_watermark: f.url_watermark,
          url_thumb: f.url_thumb, principal: f.principal, ordem: f.ordem, created_at: '',
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
      console.error('Erro ao buscar imóveis:', err)
      setImoveis([])
    } finally {
      setLoading(false)
    }
  }, [searchParams.toString()])

  useEffect(() => {
    fetchImoveis()
  }, [fetchImoveis])

  const handleFiltrosChange = (novosFiltros: FiltrosBusca) => {
    const params = new URLSearchParams()
    if (novosFiltros.tipo) params.set('tipo', novosFiltros.tipo)
    if (novosFiltros.finalidade) params.set('finalidade', novosFiltros.finalidade)
    if (novosFiltros.bairro_id) params.set('bairro', novosFiltros.bairro_id)
    if (novosFiltros.busca) params.set('q', novosFiltros.busca)
    if (novosFiltros.quartos_min) params.set('quartos', String(novosFiltros.quartos_min))
    if (novosFiltros.ordenar && novosFiltros.ordenar !== 'recentes') params.set('ordenar', novosFiltros.ordenar)
    if (novosFiltros.pagina && novosFiltros.pagina > 1) params.set('pagina', String(novosFiltros.pagina))
    setSearchParams(params)
  }

  const toggleFavorito = (id: string) => {
    setFavoritos(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('moradda_favoritos', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [searchParams.toString()])

  return (
    <>
      <SEO
        title="Imóveis à Venda e para Alugar em Resende"
        description="Encontre casas, apartamentos, terrenos e imóveis comerciais em Resende e região. Busca avançada com filtros para encontrar o imóvel ideal."
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-12 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Imóveis</span>
          </nav>

          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Encontre seu Imóvel
          </h1>
          <p className="mt-3 max-w-2xl font-body text-lg text-moradda-blue-200">
            Explore nosso portfólio completo de imóveis em Resende e região
          </p>
        </div>
      </section>

      {/* Filters + Results */}
      <section className="bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ImovelFilters
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            bairros={bairros}
            totalResultados={imoveis.length}
          />

          <div className="mt-6 flex items-center justify-between">
            <p className="font-body text-sm text-gray-500">
              {loading ? 'Buscando imóveis...' : `Mostrando ${imoveis.length} de ${totalCount} imóveis`}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-2 transition-colors ${viewMode === 'grid' ? 'bg-moradda-blue-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md p-2 transition-colors ${viewMode === 'list' ? 'bg-moradda-blue-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Loading spinner */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
            </div>
          )}

          {!loading && imoveis.length > 0 ? (
            <div className={`mt-6 grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
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
          ) : !loading ? (
            <div className="mt-16 flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-moradda-blue-50 p-6">
                <Home className="h-10 w-10 text-moradda-blue-300" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-semibold text-moradda-blue-800">
                Nenhum imóvel encontrado
              </h3>
              <p className="mt-2 max-w-md font-body text-gray-500">
                Tente ajustar os filtros ou faça uma nova busca.
              </p>
              <button
                onClick={() => handleFiltrosChange({ pagina: 1, por_pagina: 12 })}
                className="mt-6 rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
              >
                Limpar Filtros
              </button>
            </div>
          ) : null}

          {/* Pagination */}
          {!loading && totalCount > PER_PAGE && (() => {
            const currentPage = filtros.pagina || 1
            const totalPages = Math.ceil(totalCount / PER_PAGE)
            return (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  onClick={() => handleFiltrosChange({ ...filtros, pagina: currentPage - 1 })}
                  disabled={currentPage <= 1}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-body text-sm font-semibold text-moradda-blue-700 transition-all hover:bg-moradda-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="font-body text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => handleFiltrosChange({ ...filtros, pagina: currentPage + 1 })}
                  disabled={currentPage >= totalPages}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-body text-sm font-semibold text-moradda-blue-700 transition-all hover:bg-moradda-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próximo
                </button>
              </div>
            )
          })()}
        </div>
      </section>
    </>
  )
}
