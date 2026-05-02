import { TEMPLATE_RESIDENCIAL } from './residencial'
import { TEMPLATE_COMERCIAL } from './comercial'
import { TEMPLATE_TEMPORADA } from './temporada'
import { TEMPLATE_ADMINISTRACAO } from './administracao'
import { TEMPLATE_CAPTACAO_EXCLUSIVA } from './captacao_exclusiva'
import { TEMPLATE_COMPRA_VENDA } from './compra_venda'
import { TEMPLATE_ASSOCIACAO_CORRETOR } from './associacao_corretor'

export const TEMPLATES_PADRAO = [
  {
    nome: 'Locação Residencial — Padrão Moradda',
    tipo: 'locacao_residencial' as const,
    conteudo: TEMPLATE_RESIDENCIAL,
    padrao: true,
  },
  {
    nome: 'Locação Comercial — Padrão Moradda',
    tipo: 'locacao_comercial' as const,
    conteudo: TEMPLATE_COMERCIAL,
    padrao: true,
  },
  {
    nome: 'Locação por Temporada — Padrão Moradda',
    tipo: 'temporada' as const,
    conteudo: TEMPLATE_TEMPORADA,
    padrao: true,
  },
  {
    nome: 'Administração de Imóvel — Padrão Moradda',
    tipo: 'administracao' as const,
    conteudo: TEMPLATE_ADMINISTRACAO,
    padrao: true,
  },
  {
    nome: 'Captação com Exclusividade — Padrão Moradda',
    tipo: 'captacao_exclusiva' as const,
    conteudo: TEMPLATE_CAPTACAO_EXCLUSIVA,
    padrao: true,
  },
  {
    nome: 'Compra e Venda de Imóvel — Padrão Moradda',
    tipo: 'compra_venda' as any,
    conteudo: TEMPLATE_COMPRA_VENDA,
    padrao: true,
  },
  {
    nome: 'Associação Profissional com Corretor — Padrão Moradda',
    tipo: 'associacao_corretor' as any,
    conteudo: TEMPLATE_ASSOCIACAO_CORRETOR,
    padrao: true,
  },
]
