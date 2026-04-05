import { Helmet } from 'react-helmet-async'
import { SITE_NAME, SITE_URL, SEO_DEFAULTS } from '@/lib/constants'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  /** Optional JSON-LD structured data (object or array of objects) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export default function SEO({
  title,
  description = SEO_DEFAULTS.description,
  image = SEO_DEFAULTS.image,
  url,
  type = 'website',
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SEO_DEFAULTS.title
  const canonicalUrl = url
    ? url.startsWith('http')
      ? url
      : `${SITE_URL}${url}`
    : SITE_URL

  return (
    <Helmet>
      {/* Base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SEO_DEFAULTS.locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content={SEO_DEFAULTS.twitterHandle} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
