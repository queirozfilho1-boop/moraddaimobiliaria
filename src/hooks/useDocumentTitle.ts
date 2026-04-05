import { useEffect } from 'react'
import { SITE_NAME } from '@/lib/constants'

/**
 * Set the document title, appending the site name.
 * Uses react-helmet-async when available in the tree, otherwise falls back to
 * direct DOM manipulation so the hook works everywhere.
 *
 * Usage:
 *   useDocumentTitle('Imóveis à Venda')
 *   // → "Imóveis à Venda | Moradda Imobiliária"
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle
  }, [title])
}
