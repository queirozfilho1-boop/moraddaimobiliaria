/**
 * Application constants — Moradda Imobiliária
 */

// ── Site ────────────────────────────────────────────────────────────────────
export const SITE_NAME = 'Moradda Imobiliária'
export const SITE_URL = 'https://moraddaimobiliaria.com.br'
export const WHATSAPP_NUMBER = '5524998571528'

// ── SEO Defaults ────────────────────────────────────────────────────────────
export const SEO_DEFAULTS = {
  title: 'Moradda Imobiliária — Imóveis de Alto Padrão',
  description:
    'Encontre imóveis de alto padrão com a Moradda Imobiliária. Casas, apartamentos, coberturas e terrenos nas melhores localizações.',
  image: `${SITE_URL}/og-image.jpg`,
  locale: 'pt_BR',
  twitterHandle: '@moraddaimob',
}

// ── Property Types ──────────────────────────────────────────────────────────
export const TIPOS_IMOVEL = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'kitnet', label: 'Kitnet' },
  { value: 'sobrado', label: 'Sobrado' },
] as const

// ── Listing Purpose ─────────────────────────────────────────────────────────
export const FINALIDADES = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'venda_aluguel', label: 'Venda e Aluguel' },
] as const

// ── Property Status ─────────────────────────────────────────────────────────
export const STATUS_IMOVEL = [
  { value: 'rascunho', label: 'Rascunho', color: 'gray' },
  { value: 'em_revisao', label: 'Em Revisão', color: 'yellow' },
  { value: 'publicado', label: 'Publicado', color: 'green' },
  { value: 'vendido', label: 'Vendido', color: 'blue' },
  { value: 'alugado', label: 'Alugado', color: 'gold' },
  { value: 'inativo', label: 'Inativo', color: 'red' },
] as const

// ── Available Features / Amenities ──────────────────────────────────────────
export const CARACTERISTICAS_DISPONIVEIS = [
  'Piscina',
  'Churrasqueira',
  'Academia',
  'Varanda',
  'Elevador',
  'Portaria 24h',
  'Playground',
  'Salão de Festas',
  'Ar Condicionado',
  'Aquecimento',
  'Suíte Master',
  'Closet',
  'Lavabo',
  'Escritório',
  'Jardim',
  'Sauna',
  'Quadra Esportiva',
  'Espaço Gourmet',
  'Brinquedoteca',
  'Pet Place',
  'Coworking',
  'Rooftop',
  'Depósito',
  'Lavanderia',
] as const

// ── Price Range Filters ─────────────────────────────────────────────────────
export const FAIXAS_PRECO = [
  { label: 'Até R$ 300 mil', min: 0, max: 300_000 },
  { label: 'R$ 300 mil – R$ 500 mil', min: 300_000, max: 500_000 },
  { label: 'R$ 500 mil – R$ 800 mil', min: 500_000, max: 800_000 },
  { label: 'R$ 800 mil – R$ 1,2 mi', min: 800_000, max: 1_200_000 },
  { label: 'R$ 1,2 mi – R$ 2 mi', min: 1_200_000, max: 2_000_000 },
  { label: 'R$ 2 mi – R$ 5 mi', min: 2_000_000, max: 5_000_000 },
  { label: 'Acima de R$ 5 mi', min: 5_000_000, max: Infinity },
] as const

// ── Bedrooms Filter ─────────────────────────────────────────────────────────
export const QUARTOS_OPTIONS = [
  { value: 1, label: '1 quarto' },
  { value: 2, label: '2 quartos' },
  { value: 3, label: '3 quartos' },
  { value: 4, label: '4+ quartos' },
] as const
