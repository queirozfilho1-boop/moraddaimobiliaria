// Tipos e helpers do módulo de Vistorias

export type VistoriaTipo = 'entrada' | 'saida'

export type VistoriaStatus =
  | 'rascunho'
  | 'aguardando_assinatura'
  | 'assinada'
  | 'contestada'
  | 'finalizada'

export type VistoriaItemEstado = 'otimo' | 'bom' | 'regular' | 'ruim' | 'avariado'

export interface Vistoria {
  id: string
  contrato_id?: string | null
  imovel_id: string
  tipo: VistoriaTipo
  status: VistoriaStatus
  realizada_em?: string | null
  estado_geral?: string | null
  observacoes?: string | null
  // Snapshot de partes (preenchido a partir de contratos_partes ao escolher contrato; editável manualmente)
  locador_nome?: string | null
  locador_cpf?: string | null
  locatario_nome?: string | null
  locatario_cpf?: string | null
  // Geolocalização
  lat?: number | null
  lng?: number | null
  // PDF / ZapSign
  pdf_url?: string | null
  pdf_signed_url?: string | null
  zapsign_doc_id?: string | null
  zapsign_status?: string | null
  zapsign_url?: string | null
  responsavel_id?: string | null
  // legacy (deprecated, mas mantém)
  finalizada?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface VistoriaItem {
  id?: string
  vistoria_id?: string
  comodo: string
  item: string
  estado: VistoriaItemEstado
  observacoes?: string | null
  fotos?: string[] | null
  ordem?: number | null
  despesa_id?: string | null
}

export const COMODOS = [
  'Sala',
  'Cozinha',
  'Quarto 1',
  'Quarto 2',
  'Quarto 3',
  'Suíte',
  'Banheiro',
  'Banheiro Social',
  'Lavabo',
  'Área de Serviço',
  'Varanda',
  'Garagem',
  'Externa',
  'Outros',
]

export const ITEMS_PADRAO = [
  'Pintura',
  'Piso',
  'Janelas/Vidros',
  'Portas',
  'Tomadas/Interruptores',
  'Iluminação',
  'Hidráulica',
  'Mobiliário fixo',
  'Limpeza geral',
]

export const ESTADOS: { v: VistoriaItemEstado; l: string; cor: string }[] = [
  { v: 'otimo',    l: 'Ótimo',    cor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { v: 'bom',      l: 'Bom',      cor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { v: 'regular',  l: 'Regular',  cor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { v: 'ruim',     l: 'Ruim',     cor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { v: 'avariado', l: 'Avariado', cor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]

export const ESTADO_LABEL: Record<VistoriaItemEstado, string> =
  ESTADOS.reduce((acc, e) => ({ ...acc, [e.v]: e.l }), {} as any)

export const ESTADO_COR: Record<VistoriaItemEstado, string> =
  ESTADOS.reduce((acc, e) => ({ ...acc, [e.v]: e.cor }), {} as any)

export const TIPO_LABEL: Record<VistoriaTipo, string> = {
  entrada: 'Entrada',
  saida:   'Saída',
}

export const STATUS_LABEL: Record<VistoriaStatus, string> = {
  rascunho:              'Rascunho',
  aguardando_assinatura: 'Aguardando assinatura',
  assinada:              'Assinada',
  contestada:            'Contestada',
  finalizada:            'Finalizada',
}

export const STATUS_COR: Record<VistoriaStatus, string> = {
  rascunho:              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  aguardando_assinatura: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  assinada:              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  contestada:            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  finalizada:            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

export const ESTADOS_AVARIA: VistoriaItemEstado[] = ['ruim', 'avariado']

export function isAvariado(estado: VistoriaItemEstado | string | null | undefined): boolean {
  return estado === 'ruim' || estado === 'avariado'
}
