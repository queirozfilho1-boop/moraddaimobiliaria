/**
 * Structured data (JSON-LD) generators for SEO — Moradda Imobiliária
 */

import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Imovel } from '@/types'

// ── Organization (RealEstateAgent) ──────────────────────────────────────────

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Imobiliária especializada em imóveis de alto padrão. Encontre casas, apartamentos, coberturas e terrenos nas melhores localizações.',
    telephone: '+55 24 99857-1528',
    email: 'contato@moraddaimobiliaria.com.br',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua Dom Bosco, nº 165',
      addressLocality: 'Resende',
      addressRegion: 'RJ',
      postalCode: '27541-140',
      addressCountry: 'BR',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'Grupo Alfacon',
      member: [
        { '@type': 'AccountingService', name: 'Alfacon Contabilidade', url: 'https://contabilidadealfacon.com.br' },
        { '@type': 'RealEstateAgent', name: 'Moradda Imobiliária', url: SITE_URL },
      ],
    },
    sameAs: [
      'https://instagram.com/moraddaimobiliaria/',
      'https://facebook.com/moraddaimobiliaria',
    ],
  }
}

// ── Real Estate Listing ─────────────────────────────────────────────────────

export function getRealEstateListingSchema(imovel: Imovel) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: imovel.titulo,
    description: imovel.descricao,
    url: `${SITE_URL}/imoveis/${imovel.slug}`,
    image: imovel.foto_principal
      ? [imovel.foto_principal]
      : imovel.fotos?.map((f) => f.url) ?? [],
    datePosted: imovel.created_at,
    offers: {
      '@type': 'Offer',
      price: imovel.preco,
      priceCurrency: 'BRL',
      priceValidUntil: undefined,
      availability: imovel.status === 'publicado'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${imovel.endereco}, ${imovel.numero}`,
      addressLocality: imovel.cidade,
      addressRegion: imovel.estado,
      postalCode: imovel.cep,
      addressCountry: 'BR',
    },
    geo:
      imovel.latitude && imovel.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: imovel.latitude,
            longitude: imovel.longitude,
          }
        : undefined,
    numberOfRooms: imovel.quartos,
    floorSize: imovel.area_construida
      ? {
          '@type': 'QuantitativeValue',
          value: imovel.area_construida,
          unitCode: 'MTK', // square metre
        }
      : undefined,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Preço formatado',
        value: formatCurrency(imovel.preco),
      },
      {
        '@type': 'PropertyValue',
        name: 'Vagas de garagem',
        value: imovel.vagas_garagem,
      },
    ],
  }
}

// ── Breadcrumb ──────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string
  url: string
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

// ── Local Business ──────────────────────────────────────────────────────────

export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      'Imobiliária especializada em imóveis de alto padrão. Atendimento personalizado e exclusivo.',
    telephone: '+55 24 99857-1528',
    email: 'contato@moraddaimobiliaria.com.br',
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua Dom Bosco, nº 165',
      addressLocality: 'Resende',
      addressRegion: 'RJ',
      postalCode: '27541-140',
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -22.4693,
      longitude: -44.4509,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '13:00',
      },
    ],
  }
}
