/**
 * Utility functions — Moradda Imobiliária
 */

/** Merge class names, filtering out falsy values */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Format number as BRL currency (R$ 350.000,00) */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Format area value (120 m²) */
export function formatArea(value: number): string {
  return `${value.toLocaleString('pt-BR')} m²`
}

/** Generate URL-friendly slug from text */
export function generateSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric
    .replace(/[\s_]+/g, '-')         // spaces/underscores to hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
}

/** Generate WhatsApp link with pre-filled message about a property */
export function generateWhatsAppLink(
  phone: string,
  imovelTitulo: string,
  imovelCodigo: string,
): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const message = encodeURIComponent(
    `Olá, vi o imóvel ${imovelTitulo} (${imovelCodigo}) e gostaria de mais informações.`,
  )
  return `https://wa.me/${cleanPhone}?text=${message}`
}

/** Human-readable label for property type */
export function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    casa: 'Casa',
    apartamento: 'Apartamento',
    terreno: 'Terreno',
    comercial: 'Comercial',
    rural: 'Rural',
    cobertura: 'Cobertura',
    kitnet: 'Kitnet',
    sobrado: 'Sobrado',
  }
  return labels[tipo] ?? tipo
}

/** Human-readable label for listing purpose */
export function getFinalidadeLabel(finalidade: string): string {
  const labels: Record<string, string> = {
    venda: 'Venda',
    aluguel: 'Aluguel',
    venda_aluguel: 'Venda e Aluguel',
  }
  return labels[finalidade] ?? finalidade
}

/** Human-readable label and color for property status */
export function getStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    rascunho: { label: 'Rascunho', color: 'text-gray-500 bg-gray-100' },
    em_revisao: { label: 'Em Revisão', color: 'text-yellow-700 bg-yellow-100' },
    publicado: { label: 'Publicado', color: 'text-green-700 bg-green-100' },
    vendido: { label: 'Vendido', color: 'text-moradda-blue-500 bg-moradda-blue-500/10' },
    alugado: { label: 'Alugado', color: 'text-moradda-gold-600 bg-moradda-gold-400/20' },
    inativo: { label: 'Inativo', color: 'text-red-700 bg-red-100' },
  }
  return map[status] ?? { label: status, color: 'text-gray-500 bg-gray-100' }
}

/** Truncate text to a maximum length, appending ellipsis */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '…'
}
