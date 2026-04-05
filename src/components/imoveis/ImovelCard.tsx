import { Link } from 'react-router-dom'
import { Bed, Bath, Car, Maximize2, MapPin, Heart } from 'lucide-react'
import { formatCurrency, formatArea, getTipoLabel, getFinalidadeLabel } from '@/lib/utils'
import type { Imovel } from '@/types'
import { useState } from 'react'

interface ImovelCardProps {
  imovel: Imovel
  onFavorite?: (id: string) => void
  isFavorito?: boolean
}

export default function ImovelCard({ imovel, onFavorite, isFavorito = false }: ImovelCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)

  const fotoPrincipal = imovel.fotos?.find(f => f.principal)?.url_watermark
    || imovel.fotos?.[0]?.url_watermark
    || imovel.foto_principal

  return (
    <Link
      to={`/imoveis/${imovel.slug}`}
      className="card-premium group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-moradda-blue-100 to-moradda-blue-50">
        {fotoPrincipal && (
          <img
            src={fotoPrincipal}
            alt={imovel.titulo}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        {!fotoPrincipal && (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-12 w-12 text-moradda-blue-200" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-lg bg-moradda-blue-500 px-3 py-1 font-body text-xs font-semibold text-white shadow-md">
            {getFinalidadeLabel(imovel.finalidade)}
          </span>
          <span className="rounded-lg bg-white/90 px-3 py-1 font-body text-xs font-medium text-moradda-blue-700 shadow-md backdrop-blur-sm">
            {getTipoLabel(imovel.tipo)}
          </span>
          {imovel.destaque && (
            <span className="rounded-lg bg-moradda-gold-400 px-3 py-1 font-body text-xs font-semibold text-white shadow-md">
              Destaque
            </span>
          )}
        </div>

        {/* Favorite */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onFavorite(imovel.id)
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:scale-110"
            aria-label={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorito ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
        )}

        {/* Price on image */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-lg bg-white/95 px-4 py-2 font-body text-lg font-bold text-moradda-blue-800 shadow-md backdrop-blur-sm">
            {formatCurrency(imovel.preco)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold leading-tight text-moradda-blue-800 transition-colors group-hover:text-moradda-gold-500">
          {imovel.titulo}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-gray-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-body text-sm">
            {imovel.bairro?.nome || 'Localização'}{imovel.cidade ? `, ${imovel.cidade}` : ''}
          </span>
        </div>

        {/* Specs */}
        <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
          {imovel.quartos > 0 && (
            <div className="flex items-center gap-1.5" title={`${imovel.quartos} quarto(s)`}>
              <Bed className="h-4 w-4 text-moradda-blue-400" />
              <span className="font-body text-sm font-medium text-gray-600">{imovel.quartos}</span>
            </div>
          )}
          {imovel.banheiros > 0 && (
            <div className="flex items-center gap-1.5" title={`${imovel.banheiros} banheiro(s)`}>
              <Bath className="h-4 w-4 text-moradda-blue-400" />
              <span className="font-body text-sm font-medium text-gray-600">{imovel.banheiros}</span>
            </div>
          )}
          {imovel.vagas_garagem > 0 && (
            <div className="flex items-center gap-1.5" title={`${imovel.vagas_garagem} vaga(s)`}>
              <Car className="h-4 w-4 text-moradda-blue-400" />
              <span className="font-body text-sm font-medium text-gray-600">{imovel.vagas_garagem}</span>
            </div>
          )}
          {imovel.area_construida && imovel.area_construida > 0 && (
            <div className="flex items-center gap-1.5 ml-auto" title="Área construída">
              <Maximize2 className="h-4 w-4 text-moradda-blue-400" />
              <span className="font-body text-sm font-medium text-gray-600">{formatArea(imovel.area_construida)}</span>
            </div>
          )}
        </div>

        {/* Broker */}
        {imovel.corretor && (
          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-moradda-blue-100 text-xs font-semibold text-moradda-blue-600 overflow-hidden">
              {imovel.corretor.avatar_url ? (
                <img src={imovel.corretor.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                imovel.corretor.nome.charAt(0)
              )}
            </div>
            <div>
              <span className="font-body text-xs font-medium text-gray-700">{imovel.corretor.nome}</span>
              {imovel.corretor.creci && (
                <span className="ml-1 font-body text-xs text-gray-400">CRECI {imovel.corretor.creci}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
