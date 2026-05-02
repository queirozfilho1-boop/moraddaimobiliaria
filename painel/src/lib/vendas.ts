// Tipos + helpers do módulo de Vendas

export type PropostaStatus = 'feita' | 'aceita' | 'recusada' | 'contraproposta' | 'expirada' | 'cancelada'
export type VendaStatus = 'em_negociacao' | 'proposta_aceita' | 'documentacao' | 'aguardando_financiamento' | 'aguardando_assinatura' | 'aguardando_escritura' | 'concluida' | 'cancelada'
export type ComissaoPapel = 'captador' | 'vendedor' | 'lider' | 'imobiliaria' | 'externo'
export type ComissaoStatus = 'pendente' | 'parcial' | 'paga' | 'cancelada'

export const PROPOSTA_STATUS_LABEL: Record<PropostaStatus, string> = {
  feita: 'Feita', aceita: 'Aceita', recusada: 'Recusada',
  contraproposta: 'Contraproposta', expirada: 'Expirada', cancelada: 'Cancelada',
}
export const PROPOSTA_STATUS_COR: Record<PropostaStatus, string> = {
  feita: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  aceita: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  recusada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  contraproposta: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  expirada: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  cancelada: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

export const VENDA_STATUS_LABEL: Record<VendaStatus, string> = {
  em_negociacao: 'Em negociação',
  proposta_aceita: 'Proposta aceita',
  documentacao: 'Documentação',
  aguardando_financiamento: 'Aguardando financiamento',
  aguardando_assinatura: 'Aguardando assinatura',
  aguardando_escritura: 'Aguardando escritura',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}
export const VENDA_STATUS_COR: Record<VendaStatus, string> = {
  em_negociacao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  proposta_aceita: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  documentacao: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  aguardando_financiamento: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  aguardando_assinatura: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  aguardando_escritura: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  concluida: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelada: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

// ─────────────────────────────────────────────
// Cálculo de comissão
// ─────────────────────────────────────────────

export interface ComissaoVendaInput {
  valor_venda: number
  comissao_total_pct: number       // ex: 5
  comissao_lider_pct: number       // ex: 0.5
  captador_id?: string | null
  vendedor_id: string              // corretor que fechou
  lider_id?: string | null
}

export interface ComissaoCalc {
  papel: ComissaoPapel
  beneficiario_id: string | null
  base_calculo: number
  percentual: number
  valor: number
  descricao: string
}

export function calcularComissaoVenda(input: ComissaoVendaInput): ComissaoCalc[] {
  const total = input.valor_venda * (input.comissao_total_pct / 100)
  const valorLider = input.valor_venda * (input.comissao_lider_pct / 100)
  const sobra = total - valorLider

  const out: ComissaoCalc[] = []

  // Líder
  if (input.lider_id) {
    out.push({
      papel: 'lider', beneficiario_id: input.lider_id,
      base_calculo: input.valor_venda, percentual: input.comissao_lider_pct, valor: valorLider,
      descricao: `Override líder — ${input.comissao_lider_pct}% sobre venda`,
    })
  }

  // Captador = vendedor → 50% só pra ele
  const captadorIgual = input.captador_id && input.captador_id === input.vendedor_id
  if (captadorIgual) {
    const v = sobra * 0.50
    out.push({
      papel: 'vendedor', beneficiario_id: input.vendedor_id,
      base_calculo: sobra, percentual: 50, valor: v,
      descricao: `50% (captador = vendedor)`,
    })
    out.push({
      papel: 'imobiliaria', beneficiario_id: null,
      base_calculo: sobra, percentual: 50, valor: sobra - v,
      descricao: `50% Moradda`,
    })
  } else {
    if (input.captador_id) {
      const vc = sobra * 0.20
      out.push({
        papel: 'captador', beneficiario_id: input.captador_id,
        base_calculo: sobra, percentual: 20, valor: vc,
        descricao: `20% captador`,
      })
    }
    const vv = sobra * 0.30
    out.push({
      papel: 'vendedor', beneficiario_id: input.vendedor_id,
      base_calculo: sobra, percentual: 30, valor: vv,
      descricao: `30% corretor responsável`,
    })
    const vMor = sobra - (input.captador_id ? sobra * 0.20 : 0) - vv
    out.push({
      papel: 'imobiliaria', beneficiario_id: null,
      base_calculo: sobra, percentual: input.captador_id ? 50 : 70, valor: vMor,
      descricao: input.captador_id ? `50% Moradda` : `70% Moradda (sem captador)`,
    })
  }

  return out
}

export interface ComissaoLocacaoBonusInput {
  valor_aluguel: number
  captador_id?: string | null
  vendedor_id: string
  lider_id?: string | null
}

export function calcularComissaoLocacaoBonus(input: ComissaoLocacaoBonusInput): ComissaoCalc[] {
  const total = input.valor_aluguel
  const valorLider = total * 0.05
  const sobra = total - valorLider

  const out: ComissaoCalc[] = []
  if (input.lider_id) {
    out.push({
      papel: 'lider', beneficiario_id: input.lider_id,
      base_calculo: total, percentual: 5, valor: valorLider,
      descricao: `5% override líder sobre 1º aluguel`,
    })
  }
  const igual = input.captador_id && input.captador_id === input.vendedor_id
  if (igual) {
    const v = sobra * 0.50
    out.push({ papel: 'vendedor', beneficiario_id: input.vendedor_id, base_calculo: sobra, percentual: 50, valor: v, descricao: `50% (captador = vendedor)` })
    out.push({ papel: 'imobiliaria', beneficiario_id: null, base_calculo: sobra, percentual: 50, valor: sobra - v, descricao: `50% Moradda` })
  } else {
    if (input.captador_id) {
      out.push({ papel: 'captador', beneficiario_id: input.captador_id, base_calculo: sobra, percentual: 20, valor: sobra * 0.20, descricao: `20% captador` })
    }
    const vv = sobra * 0.30
    out.push({ papel: 'vendedor', beneficiario_id: input.vendedor_id, base_calculo: sobra, percentual: 30, valor: vv, descricao: `30% corretor responsável` })
    out.push({
      papel: 'imobiliaria', beneficiario_id: null,
      base_calculo: sobra, percentual: input.captador_id ? 50 : 70,
      valor: sobra - (input.captador_id ? sobra * 0.20 : 0) - vv,
      descricao: input.captador_id ? `50% Moradda` : `70% Moradda`,
    })
  }
  return out
}

export function calcularComissaoLocacaoMensal(taxa_admin: number, vendedor_id: string, lider_id?: string | null): ComissaoCalc[] {
  const out: ComissaoCalc[] = []
  out.push({
    papel: 'vendedor', beneficiario_id: vendedor_id,
    base_calculo: taxa_admin, percentual: 40, valor: taxa_admin * 0.40,
    descricao: `40% da taxa adm mensal`,
  })
  if (lider_id) {
    out.push({
      papel: 'lider', beneficiario_id: lider_id,
      base_calculo: taxa_admin, percentual: 5, valor: taxa_admin * 0.05,
      descricao: `5% override líder mensal`,
    })
  }
  out.push({
    papel: 'imobiliaria', beneficiario_id: null,
    base_calculo: taxa_admin, percentual: lider_id ? 55 : 60, valor: taxa_admin * (lider_id ? 0.55 : 0.60),
    descricao: lider_id ? `55% Moradda` : `60% Moradda`,
  })
  return out
}
