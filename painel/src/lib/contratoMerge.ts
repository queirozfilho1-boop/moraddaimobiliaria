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
  matricula?: string | null
  cartorio?: string | null
  inscricao_iptu?: string | null
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
  nome: 'Moradda Empreendimentos Imobiliários LTDA',
  cnpj: '47.527.793/0001-65',
  creci: 'RJ 10404',
  endereco: 'R Dom Bosco, nº 163, Galpão Fundos, Paraíso, Resende-RJ, CEP 27535-070',
  endereco_completo: 'R Dom Bosco, nº 163, Galpão Fundos, Paraíso, Resende-RJ, CEP 27535-070',
  email: 'contato@moraddaimobiliaria.com.br',
  telefone: '(24) 99857-1528',
  email_dpo: 'contato@moraddaimobiliaria.com.br',
  dpo_nome: 'Sebastião Queiroz',
  responsavel_tecnico: 'Sebastião Queiroz',
  responsavel_creci: 'RJ 10404-F',
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

// Conversão "dias → extenso" cobrindo os marcos típicos de tail period e
// proteção pós-contratual (15, 30, 60, 90, 180, 365).
function diasPorExtenso(dias?: number | null): string {
  if (!dias) return 'zero'
  const map: Record<number, string> = {
    7: 'sete',
    15: 'quinze',
    30: 'trinta',
    45: 'quarenta e cinco',
    60: 'sessenta',
    90: 'noventa',
    120: 'cento e vinte',
    150: 'cento e cinquenta',
    180: 'cento e oitenta',
    365: 'trezentos e sessenta e cinco',
  }
  return map[dias] || String(dias)
}

function fmtMoedaSemPrefixo(v?: number | null): string {
  if (v == null) return '0,00'
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarTelefone(t?: string | null): string {
  if (!t) return ''
  const d = String(t).replace(/\D/g, '')
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  // não bate com formato esperado — retorna como veio (preserva input do usuário)
  return String(t).trim()
}

function formatarCep(c?: string | null): string {
  if (!c) return ''
  const d = String(c).replace(/\D/g, '')
  if (d.length === 8) return `${d.slice(0, 5)}-${d.slice(5)}`
  return String(c).trim()
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
  if (o.cep) parts.push(`CEP ${formatarCep(o.cep)}`)
  return parts.join(', ')
}

function buildContexto(args: MergeArgs): Record<string, any> {
  const { contrato, partes, imovel } = args
  const imobiliariaRaw = { ...IMOBILIARIA_DEFAULT, ...(args.imobiliaria || {}) }
  // Normaliza telefone da imobiliária (caso override venha em formato cru)
  const imobiliaria = {
    ...imobiliariaRaw,
    telefone: formatarTelefone((imobiliariaRaw as any).telefone) || (imobiliariaRaw as any).telefone || '',
  }
  const locador = partes.find((p) => p.papel === 'locador')
  const locatario = partes.find((p) => p.papel === 'locatario')
  const fiador = partes.find((p) => p.papel === 'fiador')
  const corretor = partes.find((p) => p.papel === 'corretor' || p.papel === 'corretor_parceiro')
  const vendedor = partes.find((p) => p.papel === 'vendedor')
  const comprador = partes.find((p) => p.papel === 'comprador')
  const proprietarioParte = partes.find((p) => p.papel === 'proprietario')
  const hospede = partes.find((p) => p.papel === 'hospede')
  const testemunha1 = partes.find((p, i) => p.papel === 'testemunha' && i === partes.findIndex((x) => x.papel === 'testemunha'))
  const testemunhasArr = partes.filter((p) => p.papel === 'testemunha')
  const testemunha2 = testemunhasArr[1]

  const parteCtx = (p?: Partial<ContratoParte>) => p ? ({
    nome: p.nome || '',
    cpf: p.cpf_cnpj || '',
    cpf_cnpj: p.cpf_cnpj || '',
    cnpj: p.cpf_cnpj || '', // alias para PJ
    rg: p.rg || '',
    creci: (p as any).creci || '',
    nacionalidade: p.nacionalidade || 'brasileiro(a)',
    estado_civil: p.estado_civil || '',
    profissao: p.profissao || '',
    email: p.email || '',
    telefone: formatarTelefone(p.telefone),
    endereco: p.endereco || '',
    numero: p.numero || '',
    complemento: p.complemento || '',
    bairro: p.bairro || '',
    cidade: p.cidade || '',
    estado: p.estado || '',
    cep: formatarCep(p.cep),
    endereco_completo: enderecoCompleto(p),
  }) : null

  // Contrato — bloco unificado
  const valorVenda = (contrato as any).valor_venda
  const valorSinal = (contrato as any).valor_sinal
  const valorFinanciado = (contrato as any).valor_financiado
  const valorSaldo = valorVenda && valorSinal ? Number(valorVenda) - Number(valorSinal) : null
  const prazoExclusividadeMeses = (contrato as any).prazo_exclusividade_meses ?? 6
  const prazoExclusividadeDias = prazoExclusividadeMeses * 30
  const prazoProtecaoDias = (contrato as any).prazo_protecao_dias ?? 180
  const iptuResp = ((contrato as any).iptu_responsavel || 'LOCATÁRIO').toUpperCase()

  const contratoCtx: Record<string, any> = {
    numero: contrato.numero || '',
    data_emissao: fmtData(new Date().toISOString()),
    data_assinatura: fmtData(new Date().toISOString()), // alias
    data_inicio: fmtData(contrato.data_inicio),
    data_fim: fmtData(contrato.data_fim),
    data_termino: fmtData(contrato.data_fim), // alias
    prazo_meses: contrato.prazo_meses || 0,
    prazo_extenso: prazoPorExtenso(contrato.prazo_meses),
    valor_aluguel: fmtMoedaSemPrefixo(contrato.valor_aluguel),
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
    ramo_atividade: (contrato as any).ramo_atividade || '',
    // Campos da Associação com Corretor + outros tipos
    comissao_venda_pct: (contrato as any).comissao_venda_pct ?? (contrato as any).comissao_pct ?? 6,
    comissao_temporada_pct: (contrato as any).comissao_temporada_pct ?? 30,
    dia_pagamento_comissao: (contrato as any).dia_pagamento_comissao ?? 10,
    aviso_previo_dias: (contrato as any).aviso_previo_dias ?? 30,
    multa_lgpd_valor: ((contrato as any).multa_lgpd_valor ?? 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    // Compra e Venda — nomenclatura unificada (tudo em contrato.*)
    valor_venda: valorVenda ? fmtMoedaSemPrefixo(Number(valorVenda)) : '',
    valor_venda_fmt: valorVenda ? fmtMoeda(valorVenda) : '',
    valor_venda_extenso: valorVenda ? valorPorExtenso(valorVenda) : '',
    valor_sinal: valorSinal ? fmtMoedaSemPrefixo(Number(valorSinal)) : '',
    valor_sinal_fmt: valorSinal ? fmtMoeda(valorSinal) : '',
    valor_sinal_extenso: valorSinal ? valorPorExtenso(valorSinal) : '',
    valor_saldo: valorSaldo ? fmtMoedaSemPrefixo(valorSaldo) : '',
    valor_saldo_fmt: valorSaldo ? fmtMoeda(valorSaldo) : '',
    valor_financiado: valorFinanciado ? fmtMoedaSemPrefixo(Number(valorFinanciado)) : '',
    valor_financiado_fmt: valorFinanciado ? fmtMoeda(valorFinanciado) : '',
    banco_financiamento: (contrato as any).banco_financiamento || '',
    parcelas_qtd: (contrato as any).parcelas_qtd || '',
    valor_itbi: (contrato as any).valor_itbi ? fmtMoeda((contrato as any).valor_itbi) : '',
    valor_cartorio: (contrato as any).valor_cartorio ? fmtMoeda((contrato as any).valor_cartorio) : '',
    data_escritura: fmtData((contrato as any).data_escritura),
    data_registro: fmtData((contrato as any).data_registro),
    data_imissao: fmtData((contrato as any).data_imissao),
    forma_sinal: (contrato as any).forma_sinal || '',
    forma_saldo: (contrato as any).forma_saldo || '',
    comissao_total_pct: (contrato as any).comissao_total_pct ?? (contrato as any).comissao_pct ?? 6,
    comissao_total_valor_fmt: (contrato as any).comissao_total_valor
      ? fmtMoeda((contrato as any).comissao_total_valor)
      : (valorVenda ? fmtMoeda(Number(valorVenda) * (((contrato as any).comissao_total_pct ?? 6) / 100)) : ''),
    comissao_pago_por: (contrato as any).comissao_pago_por || 'VENDEDOR',
    condicao_comissao: (contrato as any).condicao_comissao || 'no ato da assinatura da escritura',
    arras_natureza: (contrato as any).arras_natureza || 'confirmatórias',
    averbacao: (contrato as any).averbacao || 'averbam',
    chave_pix: (contrato as any).chave_pix || '',
    camara_arbitral: (contrato as any).camara_arbitral || 'CAMARB / CCBC ou outra de comum acordo',
    // Captação Exclusiva
    prazo_exclusividade_meses: prazoExclusividadeMeses,
    prazo_exclusividade_extenso: prazoPorExtenso(prazoExclusividadeMeses),
    prazo_exclusividade_dias: prazoExclusividadeDias,
    prazo_protecao_dias: prazoProtecaoDias,
    prazo_protecao_extenso: diasPorExtenso(prazoProtecaoDias),
  }

  // Locação — parâmetros operacionais (apenas para locacao_residencial / comercial / temporada)
  const locacaoCtx: Record<string, any> = {
    iptu_responsavel: iptuResp,
    indice_reajuste: contratoCtx.indice_reajuste,
    multa_atraso_pct: contrato.multa_atraso_pct ?? 10,
    juros_dia_pct: contrato.juros_dia_pct ?? 0.033,
    multa_rescisao_meses: contrato.multa_rescisao_meses ?? 3,
    avcb_status: (contrato as any).avcb_status || 'dispensado',
    seguro_rc_status: (contrato as any).seguro_rc_status || 'não contratado',
    fianca: (contrato as any).garantia_tipo === 'fiador' ? 'X' : ' ',
    caucao: (contrato as any).garantia_tipo === 'caucao' ? 'X' : ' ',
    seguro: (contrato as any).garantia_tipo === 'seguro_fianca' ? 'X' : ' ',
    capitalizacao: (contrato as any).garantia_tipo === 'capitalizacao' ? 'X' : ' ',
    fianca_bancaria: (contrato as any).garantia_tipo === 'fianca_bancaria' ? 'X' : ' ',
  }

  // Captação — bloco isolado (mantém compat com placeholders {{captacao.*}})
  const captacaoCtx: Record<string, any> = {
    modalidade: (contrato as any).modalidade_captacao || 'VENDA',
    valor_venda: valorVenda ? fmtMoedaSemPrefixo(Number(valorVenda)) : '',
    valor_venda_extenso: valorVenda ? valorPorExtenso(valorVenda) : '',
    valor_locacao: fmtMoedaSemPrefixo(contrato.valor_aluguel),
    margem_negociacao_percentual: (contrato as any).margem_negociacao_percentual ?? 5,
    numero_minimo_fotos: (contrato as any).numero_minimo_fotos ?? 15,
    taxa_devolucao_material: ((contrato as any).taxa_devolucao_material ?? 200).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    multa_quebra_percentual: (contrato as any).multa_quebra_percentual ?? 30,
    prazo_protecao_dias: prazoProtecaoDias,
    prazo_protecao_extenso: diasPorExtenso(prazoProtecaoDias),
    prazo_exclusividade_meses: prazoExclusividadeMeses,
    prazo_exclusividade_extenso: prazoPorExtenso(prazoExclusividadeMeses),
  }

  // Aliases reversos (venda.* → contrato.*) para compat com contratos antigos
  const vendaAlias: Record<string, any> = {
    numero: contratoCtx.numero,
    data_assinatura: contratoCtx.data_emissao,
    valor_venda_fmt: contratoCtx.valor_venda_fmt,
    valor_venda_extenso: contratoCtx.valor_venda_extenso,
    valor_sinal_fmt: contratoCtx.valor_sinal_fmt,
    valor_saldo_fmt: contratoCtx.valor_saldo_fmt,
    valor_financiado_fmt: contratoCtx.valor_financiado_fmt,
    banco_financiamento: contratoCtx.banco_financiamento,
    parcelas_qtd: contratoCtx.parcelas_qtd,
    data_imissao: contratoCtx.data_imissao,
    forma_sinal: contratoCtx.forma_sinal,
    forma_saldo: contratoCtx.forma_saldo,
    comissao_total_pct: contratoCtx.comissao_total_pct,
    comissao_total_valor_fmt: contratoCtx.comissao_total_valor_fmt,
    comissao_pago_por: contratoCtx.comissao_pago_por,
    condicao_comissao: contratoCtx.condicao_comissao,
  }

  return {
    contrato: contratoCtx,
    locacao: locacaoCtx,
    captacao: captacaoCtx,
    venda: vendaAlias, // alias reverso
    locador: parteCtx(locador) || parteCtx(undefined),
    locatario: parteCtx(locatario) || parteCtx(undefined),
    fiador: parteCtx(fiador) || parteCtx(undefined),
    proprietario: parteCtx(proprietarioParte || locador) || parteCtx(undefined), // alias
    corretor: parteCtx(corretor) || parteCtx(undefined),
    vendedor: parteCtx(vendedor) || parteCtx(undefined),
    comprador: parteCtx(comprador) || parteCtx(undefined),
    hospede: parteCtx(hospede) || parteCtx(undefined),
    testemunha1: parteCtx(testemunha1) || parteCtx(undefined),
    testemunha2: parteCtx(testemunha2) || parteCtx(undefined),
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
      cep: formatarCep(imovel?.cep),
      endereco_completo: imovel ? enderecoCompleto(imovel) : '',
      // Áreas com sufixo m² (uso direto em template)
      area_total: imovel?.area_total ? `${imovel.area_total} m²` : '',
      area_construida: imovel?.area_construida ? `${imovel.area_construida} m²` : '',
      area_privativa: imovel?.area_construida ? `${imovel.area_construida} m²` : '',
      // Versões numéricas sem sufixo (caso o template já escreva " m²" depois)
      area_total_num: imovel?.area_total != null ? String(imovel.area_total) : '',
      area_construida_num: imovel?.area_construida != null ? String(imovel.area_construida) : '',
      area_privativa_num: imovel?.area_construida != null ? String(imovel.area_construida) : '',
      quartos: imovel?.quartos || 0,
      suites: imovel?.suites || 0,
      banheiros: imovel?.banheiros || 0,
      vagas: imovel?.vagas_garagem || 0,
      vagas_garagem: imovel?.vagas_garagem || 0,
      matricula: imovel?.matricula || '',
      cartorio: imovel?.cartorio || '',
      inscricao_iptu: imovel?.inscricao_iptu || '',
      iptu: imovel?.inscricao_iptu || '', // alias reverso
    },
    imobiliaria,
    cidade: { foro: imobiliaria.foro || '' },
    taxa_admin: { percentual: contrato.taxa_admin_pct ?? 10 },
    comissao: { percentual: 6, percentual_venda: contratoCtx.comissao_venda_pct, percentual_venda_extenso: '' },
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

// Remove linhas que ficaram só com fragmentos órfãos depois do merge — heurística:
// - se a linha (após substituição) ficar com markup vazio claro (ex.: "**, série **", "()", "( ),"),
//   ou for um label puro do tipo "**Algo:**" / "**Algo:** ." sem conteúdo, descarta.
// - preserva linhas com qualquer conteúdo informativo.
function limparLinhasOrfas(texto: string): string {
  const linhas = texto.split('\n')
  const out: string[] = []
  for (const linha of linhas) {
    const t = linha.trim()
    if (t === '') { out.push(linha); continue }

    // Padrões de "label vazio" — variações comuns nos templates
    // ex.: "**Cônjuge** , CPF nº" → vira "Cônjuge , CPF nº" (sem dado)
    // ex.: "Inscrição imobiliária (IPTU): " (sem valor após ":")
    // ex.: "**Características**: " ou "Características: ,"
    const padraoLabelVazio = [
      // "**X:**" ou "**X**:" sem nada útil depois
      /^\*\*[^*]+:?\*\*:?\s*[.,;]?\s*$/,
      // "X: " (texto curto seguido só de pontuação/vazio)
      /^[A-Za-zÀ-ú()/ —–-]{1,40}:\s*[.,;]?\s*$/,
      // "**, série **" ou similar (só asteriscos e vírgulas/espaços)
      /^[*\s,.;:—–-]+$/,
      // "( )" ou "()" sozinho
      /^\(\s*\)\s*[.,;]?\s*$/,
    ]
    if (padraoLabelVazio.some((re) => re.test(t))) continue

    // "Cônjuge , CPF" — começa com label seguido imediatamente de vírgula sem dado entre eles
    if (/^\*?\*?[A-Za-zÀ-ú()/ ]+\*?\*?\s*,\s*(CPF|RG)\s*(nº|n°|n)?\s*[,.]?\s*$/i.test(t)) continue

    out.push(linha)
  }
  return out.join('\n')
}

export function mergeTemplate(template: string, args: MergeArgs): string {
  const ctx = buildContexto(args)
  const merged = template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, path) => getValue(ctx, path))
  return limparLinhasOrfas(merged)
}
