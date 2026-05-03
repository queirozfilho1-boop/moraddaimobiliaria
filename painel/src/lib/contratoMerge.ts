// Engine de merge — substitui {{placeholder.subchave}} pelos valores reais.
// Suporta paths aninhados como {{contrato.valor_aluguel}} ou {{locador.nome}}.

import type { ContratoLocacao, ContratoParte } from './contratos'
import { fmtData, fmtMoeda } from './contratos'

interface ImovelMerge {
  id: string
  codigo?: string | null
  titulo?: string | null
  tipo?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro_nome?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  area_total?: number | null
  area_construida?: number | null
  quartos?: number | null
  suites?: number | null
  banheiros?: number | null
  vagas_garagem?: number | null
}

interface MergeArgs {
  contrato: Partial<ContratoLocacao>
  partes: Array<Partial<ContratoParte>>
  imovel: ImovelMerge
  imobiliaria?: {
    nome?: string
    cnpj?: string
    creci?: string
    endereco?: string
    endereco_completo?: string
    foro?: string
  }
}

const IMOBILIARIA_DEFAULT = {
  nome: 'Moradda Imobiliária',
  cnpj: '',
  creci: '',
  endereco: 'Brasil',
  endereco_completo: 'Brasil',
  foro: 'Resende-RJ',
}

function valorPorExtenso(v?: number | null): string {
  if (!v) return 'zero reais'
  // Implementação simples; poderia usar lib `extenso` mas aqui basta o display
  const reais = Math.floor(v)
  const cents = Math.round((v - reais) * 100)
  if (cents === 0) return `R$ ${reais.toLocaleString('pt-BR')} reais`
  return `R$ ${reais.toLocaleString('pt-BR')} reais e ${cents} centavos`
}

function prazoPorExtenso(meses?: number | null): string {
  if (!meses) return 'zero'
  const map: Record<number, string> = {
    1: 'um', 2: 'dois', 3: 'três', 6: 'seis', 12: 'doze', 18: 'dezoito',
    24: 'vinte e quatro', 30: 'trinta', 36: 'trinta e seis', 48: 'quarenta e oito', 60: 'sessenta',
  }
  return map[meses] || String(meses)
}

function enderecoCompleto(o: any): string {
  if (!o) return ''
  const parts: string[] = []
  if (o.endereco) parts.push(o.endereco)
  if (o.numero) parts.push(`nº ${o.numero}`)
  if (o.complemento) parts.push(o.complemento)
  if (o.bairro || o.bairro_nome) parts.push(`bairro ${o.bairro_nome || o.bairro}`)
  if (o.cidade) parts.push(o.cidade)
  if (o.estado) parts.push(`/${o.estado}`)
  if (o.cep) parts.push(`CEP ${o.cep}`)
  return parts.join(', ')
}

function buildContexto(args: MergeArgs): Record<string, any> {
  const { contrato, partes, imovel } = args
  const imobiliaria = { ...IMOBILIARIA_DEFAULT, ...(args.imobiliaria || {}) }
  const locador = partes.find((p) => p.papel === 'locador')
  const locatario = partes.find((p) => p.papel === 'locatario')
  const fiador = partes.find((p) => p.papel === 'fiador')

  const parteCtx = (p?: Partial<ContratoParte>) => p ? ({
    nome: p.nome || '',
    cpf_cnpj: p.cpf_cnpj || '',
    rg: p.rg || '',
    nacionalidade: p.nacionalidade || 'brasileiro(a)',
    estado_civil: p.estado_civil || '',
    profissao: p.profissao || '',
    email: p.email || '',
    telefone: p.telefone || '',
    endereco: p.endereco || '',
    numero: p.numero || '',
    complemento: p.complemento || '',
    bairro: p.bairro || '',
    cidade: p.cidade || '',
    estado: p.estado || '',
    cep: p.cep || '',
    endereco_completo: enderecoCompleto(p),
  }) : null

  return {
    contrato: {
      numero: contrato.numero || '',
      data_emissao: fmtData(new Date().toISOString()),
      data_inicio: fmtData(contrato.data_inicio),
      data_fim: fmtData(contrato.data_fim),
      prazo_meses: contrato.prazo_meses || 0,
      prazo_extenso: prazoPorExtenso(contrato.prazo_meses),
      valor_aluguel: contrato.valor_aluguel?.toFixed(2) || '0,00',
      valor_aluguel_fmt: fmtMoeda(contrato.valor_aluguel),
      valor_aluguel_extenso: valorPorExtenso(contrato.valor_aluguel),
      dia_vencimento: contrato.dia_vencimento || 5,
      valor_condominio: contrato.valor_condominio?.toFixed(2) || '0,00',
      valor_iptu: contrato.valor_iptu?.toFixed(2) || '0,00',
      valor_outros: contrato.valor_outros?.toFixed(2) || '0,00',
      indice_reajuste: (contrato.indice_reajuste || 'IGPM').toUpperCase().replace('_', '-'),
      multa_atraso_pct: contrato.multa_atraso_pct ?? 2,
      juros_dia_pct: contrato.juros_dia_pct ?? 0.033,
      multa_rescisao_meses: contrato.multa_rescisao_meses ?? 3,
      ramo_atividade: '',
    },
    locador: parteCtx(locador) || parteCtx(undefined),
    locatario: parteCtx(locatario) || parteCtx(undefined),
    fiador: parteCtx(fiador) || parteCtx(undefined),
    proprietario: parteCtx(locador) || parteCtx(undefined), // alias pra contrato de administração
    imovel: {
      codigo: imovel?.codigo || '',
      titulo: imovel?.titulo || '',
      tipo: imovel?.tipo || '',
      endereco: imovel?.endereco || '',
      numero: imovel?.numero || '',
      complemento: imovel?.complemento || '',
      bairro: imovel?.bairro_nome || '',
      cidade: imovel?.cidade || '',
      estado: imovel?.estado || '',
      cep: imovel?.cep || '',
      endereco_completo: imovel ? enderecoCompleto(imovel) : '',
      area_total: imovel?.area_total ? `${imovel.area_total} m²` : '',
      area_construida: imovel?.area_construida ? `${imovel.area_construida} m²` : '',
      quartos: imovel?.quartos || 0,
      suites: imovel?.suites || 0,
      banheiros: imovel?.banheiros || 0,
      vagas: imovel?.vagas_garagem || 0,
    },
    imobiliaria,
    cidade: { foro: imobiliaria.foro || '' },
    taxa_admin: { percentual: contrato.taxa_admin_pct ?? 10 },
    comissao: { percentual: 6 },
    plataforma_assinatura: 'ZapSign',
  }
}

function getValue(ctx: Record<string, any>, path: string): string {
  const parts = path.trim().split('.')
  let cur: any = ctx
  for (const p of parts) {
    if (cur == null) return ''
    cur = cur[p]
  }
  return cur == null ? '' : String(cur)
}

export function mergeTemplate(template: string, args: MergeArgs): string {
  const ctx = buildContexto(args)
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, path) => getValue(ctx, path))
}
