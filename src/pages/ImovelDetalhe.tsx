import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Home, Bed, Bath, Car, Maximize2, MapPin, Heart, Share2,
  Phone, MessageCircle, ChevronDown, Check, Eye, Calendar
} from 'lucide-react'
import SEO from '@/components/common/SEO'
import { getRealEstateListingSchema } from '@/data/seo'
import { formatCurrency, formatArea, getTipoLabel, getFinalidadeLabel, generateWhatsAppLink } from '@/lib/utils'
import { WHATSAPP_NUMBER } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { Imovel, ImovelFoto } from '@/types'

export default function ImovelDetalhePage() {
  const { slug } = useParams()
  const [imovel, setImovel] = useState<Imovel | null>(null)
  const [fotos, setFotos] = useState<ImovelFoto[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showAllCaracteristicas, setShowAllCaracteristicas] = useState(false)
  const [isFavorito, setIsFavorito] = useState(false)
  const [fotoAtual, setFotoAtual] = useState(0)
  // Swipe / drag state
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const SWIPE_THRESHOLD = 50

  function nextFoto() {
    setFotoAtual((prev) => (prev + 1) % Math.max(1, fotos.length))
  }
  function prevFoto() {
    setFotoAtual((prev) => (prev - 1 + Math.max(1, fotos.length)) % Math.max(1, fotos.length))
  }
  function handleTouchStart(e: React.TouchEvent | React.MouseEvent) {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    setTouchStartX(x)
    setDragOffset(0)
  }
  function handleTouchMove(e: React.TouchEvent | React.MouseEvent) {
    if (touchStartX === null) return
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragOffset(x - touchStartX)
  }
  function handleTouchEnd() {
    if (touchStartX === null) return
    if (dragOffset > SWIPE_THRESHOLD) prevFoto()
    else if (dragOffset < -SWIPE_THRESHOLD) nextFoto()
    setTouchStartX(null)
    setDragOffset(0)
  }

  // Setas do teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (fotos.length <= 1) return
      if (e.key === 'ArrowRight') nextFoto()
      else if (e.key === 'ArrowLeft') prevFoto()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fotos.length])

  useEffect(() => {
    async function fetchImovel() {
      if (!slug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('imoveis')
          .select('*, bairros(id, nome, slug), users_profiles!corretor_id(id, nome, email, telefone, whatsapp, creci, slug, bio, avatar_url), imoveis_fotos(id, url, url_watermark, url_thumb, legenda, principal, ordem)')
          .eq('slug', slug)
          .eq('status', 'publicado')
          .single()

        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }

        // Increment views (fire and forget)
        supabase.rpc('increment_visualizacoes', { p_imovel_id: data.id }).then(() => {})

        // Map photos
        const imovelFotos: ImovelFoto[] = (data.imoveis_fotos || [])
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((f: any) => ({
            id: f.id,
            imovel_id: data.id,
            url: f.url,
            url_watermark: f.url_watermark,
            url_thumb: f.url_thumb,
            legenda: f.legenda,
            principal: f.principal,
            ordem: f.ordem,
            created_at: '',
          }))

        setFotos(imovelFotos)

        // Map to Imovel type
        const mapped: Imovel = {
          id: data.id,
          codigo: data.codigo,
          slug: data.slug,
          titulo: data.titulo,
          descricao: data.descricao || '',
          tipo: data.tipo,
          finalidade: data.finalidade,
          status: data.status,
          cep: data.cep || '',
          endereco: data.endereco || '',
          numero: data.numero || '',
          complemento: data.complemento,
          cidade: data.cidade || 'Resende',
          estado: data.estado || 'RJ',
          latitude: data.latitude,
          longitude: data.longitude,
          preco: data.preco,
          preco_condominio: data.preco_condominio,
          preco_iptu: data.preco_iptu,
          quartos: data.quartos,
          suites: data.suites,
          banheiros: data.banheiros,
          vagas_garagem: data.vagas_garagem,
          area_construida: data.area_construida,
          area_total: data.area_total,
          caracteristicas: data.caracteristicas || [],
          tour_virtual_url: data.tour_virtual_url,
          video_url: data.video_url,
          fotos: imovelFotos,
          foto_principal: imovelFotos.find((f) => f.principal)?.url_watermark || imovelFotos[0]?.url_watermark,
          destaque: data.destaque,
          visualizacoes: data.visualizacoes || 0,
          corretor_id: data.corretor_id,
          bairro_id: data.bairro_id,
          bairro: data.bairros ? {
            id: data.bairros.id,
            nome: data.bairros.nome,
            slug: data.bairros.slug || '',
            cidade: 'Resende',
            publicado: true,
            created_at: '',
          } : undefined,
          corretor: data.users_profiles ? {
            id: data.users_profiles.id,
            user_id: '',
            nome: data.users_profiles.nome,
            email: data.users_profiles.email || '',
            telefone: data.users_profiles.telefone,
            whatsapp: data.users_profiles.whatsapp,
            creci: data.users_profiles.creci,
            bio: data.users_profiles.bio,
            avatar_url: data.users_profiles.avatar_url,
            slug: data.users_profiles.slug || '',
            role_id: '',
            ativo: true,
            created_at: '',
          } : undefined,
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
        }

        setImovel(mapped)
      } catch (err) {
        console.error('Erro ao buscar imóvel:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImovel()
  }, [slug])

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
          <p className="mt-4 font-body text-gray-500">Carregando imóvel...</p>
        </div>
      </div>
    )
  }

  // 404
  if (notFound || !imovel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="rounded-full bg-moradda-blue-50 p-6 inline-block">
            <Home className="h-12 w-12 text-moradda-blue-300" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold text-moradda-blue-800">Imóvel não encontrado</h1>
          <p className="mt-2 font-body text-gray-500">O imóvel que você procura não existe ou não está mais disponível.</p>
          <Link
            to="/imoveis"
            className="mt-6 inline-block rounded-xl bg-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-moradda-blue-600"
          >
            Ver todos os imóveis
          </Link>
        </div>
      </div>
    )
  }

  const whatsappLink = generateWhatsAppLink(
    imovel.corretor?.whatsapp || WHATSAPP_NUMBER || '',
    imovel.titulo,
    imovel.codigo
  )

  const shareUrl = `${window.location.origin}/imoveis/${imovel.slug}`

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: imovel.titulo, url: shareUrl })
    } else {
      await navigator.clipboard.writeText(shareUrl)
    }
  }

  const specs = [
    { icon: Bed, value: imovel.quartos, label: imovel.quartos === 1 ? 'Quarto' : 'Quartos', show: imovel.quartos > 0 },
    { icon: Bed, value: imovel.suites, label: imovel.suites === 1 ? 'Suíte' : 'Suítes', show: imovel.suites > 0 },
    { icon: Bath, value: imovel.banheiros, label: imovel.banheiros === 1 ? 'Banheiro' : 'Banheiros', show: imovel.banheiros > 0 },
    { icon: Car, value: imovel.vagas_garagem, label: imovel.vagas_garagem === 1 ? 'Vaga' : 'Vagas', show: imovel.vagas_garagem > 0 },
    { icon: Maximize2, value: imovel.area_construida ? formatArea(imovel.area_construida) : null, label: 'Área Construída', show: !!imovel.area_construida },
    { icon: Maximize2, value: imovel.area_total ? formatArea(imovel.area_total) : null, label: 'Área Total', show: !!imovel.area_total },
  ].filter(s => s.show)

  const caracteristicasVisiveis = showAllCaracteristicas ? imovel.caracteristicas : imovel.caracteristicas.slice(0, 8)

  return (
    <>
      <SEO
        title={`${imovel.titulo} — ${getTipoLabel(imovel.tipo)} ${getFinalidadeLabel(imovel.finalidade)}`}
        description={imovel.descricao.slice(0, 160)}
        url={shareUrl}
        jsonLd={getRealEstateListingSchema(imovel)}
      />

      {/* Breadcrumb */}
      <section className="bg-moradda-blue-900 pb-4 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400"><Home className="h-4 w-4" /></Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/imoveis" className="transition-colors hover:text-moradda-gold-400">Imóveis</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{imovel.titulo}</span>
          </nav>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-moradda-blue-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
          <div
            className="relative aspect-[16/9] max-h-[500px] overflow-hidden rounded-2xl bg-gradient-to-br from-moradda-blue-700 to-moradda-blue-800 select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={(e) => { if (touchStartX !== null) handleTouchMove(e) }}
            onMouseUp={handleTouchEnd}
            onMouseLeave={() => { if (touchStartX !== null) handleTouchEnd() }}
          >
            {fotos.length > 0 ? (
              <>
                <img
                  src={fotos[fotoAtual]?.url_watermark || fotos[fotoAtual]?.url}
                  alt={fotos[fotoAtual]?.legenda || imovel.titulo}
                  className="h-full w-full object-cover transition-transform duration-100 ease-out pointer-events-none"
                  style={{
                    transform: touchStartX !== null ? `translateX(${dragOffset * 0.6}px)` : undefined,
                    cursor: fotos.length > 1 ? (touchStartX !== null ? 'grabbing' : 'grab') : 'default',
                  }}
                  draggable={false}
                />
                {fotos.length > 1 && (
                  <>
                    {/* Setas de navegação */}
                    <button
                      type="button"
                      onClick={prevFoto}
                      aria-label="Foto anterior"
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:h-12 sm:w-12"
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={nextFoto}
                      aria-label="Próxima foto"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:h-12 sm:w-12"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    {/* Contador de fotos */}
                    <div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {fotoAtual + 1} / {fotos.length}
                    </div>
                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {fotos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setFotoAtual(i)}
                          aria-label={`Foto ${i + 1}`}
                          className={`h-2.5 w-2.5 rounded-full transition-all ${i === fotoAtual ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <Home className="mx-auto h-16 w-16 text-moradda-blue-400" />
                  <p className="mt-4 font-body text-moradda-blue-300">Galeria de fotos</p>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="rounded-lg bg-moradda-blue-500 px-4 py-1.5 font-body text-sm font-semibold text-white shadow-lg">
                {getFinalidadeLabel(imovel.finalidade)}
              </span>
              {imovel.destaque && (
                <span className="rounded-lg bg-moradda-gold-400 px-4 py-1.5 font-body text-sm font-semibold text-white shadow-lg">
                  Destaque
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="absolute right-4 top-4 flex gap-2">
              <button
                onClick={() => setIsFavorito(!isFavorito)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:scale-110"
              >
                <Heart className={`h-5 w-5 ${isFavorito ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:scale-110"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Thumbnail strip */}
          {fotos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {fotos.map((foto, i) => (
                <button
                  key={foto.id}
                  onClick={() => setFotoAtual(i)}
                  className={`flex-shrink-0 h-16 w-24 overflow-hidden rounded-lg border-2 transition-all ${i === fotoAtual ? 'border-moradda-gold-400' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img
                    src={foto.url_thumb || foto.url_watermark || foto.url}
                    alt={foto.legenda || `Foto ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title + Price */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="rounded-md bg-moradda-blue-50 px-3 py-1 font-body text-xs font-semibold text-moradda-blue-600">
                        {imovel.codigo}
                      </span>
                      <span className="rounded-md bg-gray-100 px-3 py-1 font-body text-xs font-medium text-gray-600">
                        {getTipoLabel(imovel.tipo)}
                      </span>
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-moradda-blue-800 sm:text-3xl">
                      {imovel.titulo}
                    </h1>
                    <div className="mt-2 flex items-center gap-1.5 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span className="font-body text-sm">
                        {imovel.bairro?.nome}, {imovel.cidade}/{imovel.estado}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-3xl font-bold text-moradda-blue-700">
                      {formatCurrency(imovel.preco)}
                    </p>
                    {imovel.preco_condominio && imovel.preco_condominio > 0 && (
                      <p className="mt-1 font-body text-sm text-gray-500">
                        Condomínio: {formatCurrency(imovel.preco_condominio)}
                      </p>
                    )}
                    {imovel.preco_iptu && imovel.preco_iptu > 0 && (
                      <p className="font-body text-sm text-gray-500">
                        IPTU: {formatCurrency(imovel.preco_iptu)}/ano
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-6 flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {imovel.visualizacoes} visualizações</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Publicado em {new Date(imovel.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Specs */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="font-heading text-xl font-semibold text-moradda-blue-800 line-gold">
                  Características
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-moradda-blue-50/50 p-4">
                      <spec.icon className="h-5 w-5 text-moradda-gold-500" />
                      <div>
                        <p className="font-body text-lg font-bold text-moradda-blue-800">{spec.value}</p>
                        <p className="font-body text-xs text-gray-500">{spec.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="font-heading text-xl font-semibold text-moradda-blue-800 line-gold">
                  Descrição
                </h2>
                <p className="mt-6 font-body text-base leading-relaxed text-gray-600 whitespace-pre-line">
                  {imovel.descricao}
                </p>
              </div>

              {/* Amenities */}
              {imovel.caracteristicas.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="font-heading text-xl font-semibold text-moradda-blue-800 line-gold">
                    Comodidades
                  </h2>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {caracteristicasVisiveis.map((car, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 flex-shrink-0 text-moradda-gold-500" />
                        <span className="font-body text-sm text-gray-700">{car}</span>
                      </div>
                    ))}
                  </div>
                  {imovel.caracteristicas.length > 8 && (
                    <button
                      onClick={() => setShowAllCaracteristicas(!showAllCaracteristicas)}
                      className="mt-4 flex items-center gap-1 font-body text-sm font-medium text-moradda-blue-500 transition-colors hover:text-moradda-blue-700"
                    >
                      {showAllCaracteristicas ? 'Ver menos' : `Ver todas (${imovel.caracteristicas.length})`}
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAllCaracteristicas ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Corretor Card */}
              {imovel.corretor && (
                <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="font-heading text-lg font-semibold text-moradda-blue-800">
                    Corretor Responsável
                  </h3>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-moradda-blue-100 font-heading text-xl font-bold text-moradda-blue-600 overflow-hidden">
                      {imovel.corretor.avatar_url ? (
                        <img src={imovel.corretor.avatar_url} alt={imovel.corretor.nome} className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        imovel.corretor.nome.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-body text-base font-semibold text-moradda-blue-800">
                        {imovel.corretor.nome}
                      </p>
                      {imovel.corretor.creci && (
                        <p className="font-body text-sm text-gray-500">CRECI {imovel.corretor.creci}</p>
                      )}
                    </div>
                  </div>
                  {imovel.corretor.bio && (
                    <p className="mt-3 font-body text-sm text-gray-500">{imovel.corretor.bio}</p>
                  )}

                  {/* CTA Buttons */}
                  <div className="mt-6 space-y-3">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md transition-all hover:bg-green-600 hover:shadow-lg"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Chamar no WhatsApp
                    </a>
                    {imovel.corretor.telefone && (
                      <a
                        href={`tel:${imovel.corretor.telefone}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-moradda-blue-500 px-6 py-3 font-body text-sm font-semibold text-moradda-blue-500 transition-all hover:bg-moradda-blue-500 hover:text-white"
                      >
                        <Phone className="h-5 w-5" />
                        Ligar Agora
                      </a>
                    )}
                  </div>

                  <Link
                    to={`/equipe/${imovel.corretor.slug}`}
                    className="mt-4 block text-center font-body text-sm font-medium text-moradda-gold-500 transition-colors hover:text-moradda-gold-600"
                  >
                    Ver perfil do corretor
                  </Link>
                </div>
              )}

              {/* Quick Info */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="font-heading text-lg font-semibold text-moradda-blue-800">
                  Informações Rápidas
                </h3>
                <dl className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <dt className="font-body text-sm text-gray-500">Código</dt>
                    <dd className="font-body text-sm font-medium text-moradda-blue-800">{imovel.codigo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-body text-sm text-gray-500">Tipo</dt>
                    <dd className="font-body text-sm font-medium text-moradda-blue-800">{getTipoLabel(imovel.tipo)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-body text-sm text-gray-500">Finalidade</dt>
                    <dd className="font-body text-sm font-medium text-moradda-blue-800">{getFinalidadeLabel(imovel.finalidade)}</dd>
                  </div>
                  {imovel.bairro && (
                    <div className="flex justify-between">
                      <dt className="font-body text-sm text-gray-500">Bairro</dt>
                      <dd className="font-body text-sm font-medium text-moradda-blue-800">{imovel.bairro.nome}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="font-body text-sm text-gray-500">Cidade</dt>
                    <dd className="font-body text-sm font-medium text-moradda-blue-800">{imovel.cidade}/{imovel.estado}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
