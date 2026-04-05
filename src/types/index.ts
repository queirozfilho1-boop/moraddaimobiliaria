export interface Imovel {
  id: string
  codigo: string
  slug: string
  titulo: string
  descricao: string
  tipo: TipoImovel
  finalidade: Finalidade
  status: StatusImovel
  // Localização
  cep: string
  endereco: string
  numero: string
  complemento?: string
  bairro_id: string
  bairro?: Bairro
  cidade: string
  estado: string
  latitude?: number
  longitude?: number
  // Valores
  preco: number
  preco_condominio?: number
  preco_iptu?: number
  // Características
  area_total?: number
  area_construida?: number
  quartos: number
  suites: number
  banheiros: number
  vagas_garagem: number
  // Extras
  caracteristicas: string[]
  // Mídia
  tour_virtual_url?: string
  video_url?: string
  fotos?: ImovelFoto[]
  foto_principal?: string
  // Meta
  destaque: boolean
  visualizacoes: number
  corretor_id: string
  corretor?: UserProfile
  created_at: string
  updated_at: string
}

export type TipoImovel = 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural' | 'cobertura' | 'kitnet' | 'sobrado'

export type Finalidade = 'venda' | 'aluguel' | 'venda_aluguel'

export type StatusImovel = 'rascunho' | 'em_revisao' | 'publicado' | 'vendido' | 'alugado' | 'inativo'

export interface ImovelFoto {
  id: string
  imovel_id: string
  url: string
  url_watermark: string
  url_thumb?: string
  legenda?: string
  principal: boolean
  ordem: number
  created_at: string
}

export interface Bairro {
  id: string
  nome: string
  slug: string
  cidade: string
  descricao?: string
  foto_url?: string
  infraestrutura?: Record<string, number>
  coordenadas?: { lat: number; lng: number }
  publicado: boolean
  created_at: string
}

export interface PrecoReferencia {
  id: string
  bairro_id: string
  bairro?: Bairro
  tipo_imovel: string
  preco_m2_medio: number
  preco_m2_minimo: number
  preco_m2_maximo: number
  fonte: 'mercado' | 'manual' | 'calculado'
  data_referencia: string
  observacoes?: string
  atualizado_por?: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  nome: string
  email?: string
  telefone: string
  mensagem?: string
  origem: 'site_contato' | 'imovel' | 'avaliacao' | 'whatsapp' | 'vender' | 'alerta'
  imovel_id?: string
  imovel?: Imovel
  corretor_id?: string
  corretor?: UserProfile
  status: 'novo' | 'em_atendimento' | 'convertido' | 'perdido'
  notas?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  nome: string
  email: string
  telefone?: string
  whatsapp?: string
  creci?: string
  avatar_url?: string
  bio?: string
  slug: string
  role_id: string
  role?: Role
  ativo: boolean
  created_at: string
}

export type RoleName = 'superadmin' | 'corretor'

export interface Role {
  id: string
  nome: RoleName
  descricao?: string
  created_at: string
}

export interface BlogPost {
  id: string
  titulo: string
  slug: string
  conteudo: string
  resumo: string
  imagem_capa?: string
  categoria: string
  tags: string[]
  publicado: boolean
  autor_id: string
  autor?: UserProfile
  created_at: string
  updated_at: string
}

export interface Depoimento {
  id: string
  nome: string
  texto: string
  foto_url?: string
  nota: number
  publicado: boolean
  ordem: number
  created_at: string
}

export interface Banner {
  id: string
  titulo: string
  subtitulo?: string
  imagem_url: string
  link?: string
  ativo: boolean
  ordem: number
  created_at: string
}

export interface LogAtividade {
  id: string
  usuario_id: string
  usuario?: UserProfile
  acao: string
  entidade: string
  entidade_id: string
  detalhes?: Record<string, unknown>
  created_at: string
}

export interface AlertaImovel {
  id: string
  email: string
  nome: string
  tipo?: string
  bairro_id?: string
  preco_min?: number
  preco_max?: number
  quartos_min?: number
  ativo: boolean
  created_at: string
}

// Filtros de busca
export interface FiltrosBusca {
  tipo?: TipoImovel
  finalidade?: Finalidade
  bairro_id?: string
  preco_min?: number
  preco_max?: number
  quartos_min?: number
  suites_min?: number
  vagas_min?: number
  area_min?: number
  area_max?: number
  busca?: string
  ordenar?: 'preco_asc' | 'preco_desc' | 'recentes' | 'relevancia'
  pagina?: number
  por_pagina?: number
}

// Precificação
export interface DadosPrecificacao {
  bairro_id: string
  tipo_imovel: TipoImovel
  area_construida: number
  quartos: number
  suites: number
  vagas_garagem: number
  idade_imovel: number
  caracteristicas: string[]
}

export interface ResultadoPrecificacao {
  valor_minimo: number
  valor_maximo: number
  valor_medio: number
  preco_m2_referencia: number
  imoveis_similares: number
  confianca: 'alta' | 'media' | 'baixa'
}
