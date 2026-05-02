// Tipos e helpers do módulo de Locação

export type ContratoTipo =
  | 'locacao_residencial'
  | 'locacao_comercial'
  | 'temporada'
  | 'administracao'
  | 'captacao_exclusiva'

export type ContratoStatus =
  | 'rascunho'
  | 'aguardando_assinatura'
  | 'ativo'
  | 'inadimplente'
  | 'encerrado'
  | 'distratado'
  | 'cancelado'

export type ContratoGarantia =
  | 'fiador'
  | 'caucao'
  | 'seguro_fianca'
  | 'capitalizacao'
  | 'sem_garantia'

export type ContratoIndice =
  | 'igpm'
  | 'ipca'
  | 'ipc_fipe'
  | 'incc'
  | 'sem_reajuste'

export type PartePapel =
  | 'locador'
  | 'locatario'
  | 'fiador'
  | 'avalista'
  | 'corretor'
  | 'testemunha'

export const TIPO_LABEL: Record<ContratoTipo, string> = {
  locacao_residencial: 'Locação Residencial',
  locacao_comercial:   'Locação Comercial',
  temporada:           'Temporada',
  administracao:       'Administração',
  captacao_exclusiva:  'Captação Exclusiva',
}

export const STATUS_LABEL: Record<ContratoStatus, string> = {
  rascunho:               'Rascunho',
  aguardando_assinatura:  'Aguardando assinatura',
  ativo:                  'Ativo',
  inadimplente:           'Inadimplente',
  encerrado:              'Encerrado',
  distratado:             'Distratado',
  cancelado:              'Cancelado',
}

export const STATUS_COR: Record<ContratoStatus, string> = {
  rascunho:               'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  aguardando_assinatura:  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ativo:                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  inadimplente:           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  encerrado:              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  distratado:             'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  cancelado:              'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

export const GARANTIA_LABEL: Record<ContratoGarantia, string> = {
  fiador:         'Fiador',
  caucao:         'Caução',
  seguro_fianca:  'Seguro Fiança',
  capitalizacao:  'Capitalização',
  sem_garantia:   'Sem Garantia',
}

export const INDICE_LABEL: Record<ContratoIndice, string> = {
  igpm:          'IGPM',
  ipca:          'IPCA',
  ipc_fipe:      'IPC-FIPE',
  incc:          'INCC',
  sem_reajuste:  'Sem reajuste',
}

export const PAPEL_LABEL: Record<PartePapel, string> = {
  locador:     'Locador',
  locatario:   'Locatário',
  fiador:      'Fiador',
  avalista:    'Avalista',
  corretor:    'Corretor',
  testemunha:  'Testemunha',
}

export interface ContratoLocacao {
  id: string
  numero: string
  tipo: ContratoTipo
  status: ContratoStatus
  imovel_id: string
  modelo_id?: string | null
  data_inicio: string
  data_fim: string
  prazo_meses?: number | null
  dia_vencimento: number
  valor_aluguel: number
  valor_condominio: number
  valor_iptu: number
  valor_outros: number
  observacoes_valor?: string | null
  taxa_admin_pct: number
  taxa_admin_minima: number
  repasse_dia: number
  garantia_tipo: ContratoGarantia
  garantia_valor?: number | null
  garantia_observacoes?: string | null
  indice_reajuste: ContratoIndice
  proximo_reajuste?: string | null
  ultimo_reajuste?: string | null
  multa_atraso_pct: number
  juros_dia_pct: number
  multa_rescisao_meses: number
  pdf_url?: string | null
  zapsign_doc_id?: string | null
  zapsign_status?: string | null
  zapsign_url?: string | null
  asaas_subscription_id?: string | null
  observacoes?: string | null
  corretor_id?: string | null
  criado_por?: string | null
  created_at: string
  updated_at: string
  ativado_em?: string | null
  encerrado_em?: string | null
}

export interface ContratoParte {
  id: string
  contrato_id: string
  papel: PartePapel
  nome: string
  cpf_cnpj?: string | null
  rg?: string | null
  nacionalidade?: string | null
  estado_civil?: string | null
  profissao?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  data_nascimento?: string | null
  observacoes?: string | null
  ordem: number
}

export function fmtMoeda(v?: number | null): string {
  if (v == null) return 'R$ 0,00'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtData(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

export function calcularPrazoMeses(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0
  const di = new Date(inicio)
  const df = new Date(fim)
  return (df.getFullYear() - di.getFullYear()) * 12 + (df.getMonth() - di.getMonth())
}

export function calcularRepasse(c: Pick<ContratoLocacao, 'valor_aluguel' | 'valor_condominio' | 'valor_iptu' | 'valor_outros' | 'taxa_admin_pct' | 'taxa_admin_minima'>) {
  const totalRecebido = (c.valor_aluguel || 0) + (c.valor_condominio || 0) + (c.valor_iptu || 0) + (c.valor_outros || 0)
  const taxaCalc = (c.valor_aluguel || 0) * (c.taxa_admin_pct || 0) / 100
  const taxa = Math.max(taxaCalc, c.taxa_admin_minima || 0)
  const repasse = totalRecebido - taxa
  return { totalRecebido, taxa, repasse }
}
