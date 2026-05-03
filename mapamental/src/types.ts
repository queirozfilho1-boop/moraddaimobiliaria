export type Categoria =
  | "principal"
  | "cadastros"
  | "comercial"
  | "locacao"
  | "marketing"
  | "sistema";

export interface Modulo {
  id: string;
  nome: string;
  categoria: Categoria;
  rota: string;
  arquivo: string;
  funcao: string;
  tabelas: string[];
  dependencias: string[];
  edgeFunctions: string[];
  integracoes: string[];
  socioOnly?: boolean;
  detalhes: string;
}

export interface Integracao {
  id: string;
  nome: string;
  tipo: "pagamento" | "assinatura" | "calendario" | "mensageria";
  status: "ativo" | "sandbox" | "pendente";
  descricao: string;
}

export interface EdgeFunction {
  id: string;
  nome: string;
  trigger: "cron" | "webhook" | "manual" | "storage" | "public";
  funcao: string;
  integracao?: string;
}

export interface Fluxo {
  id: string;
  nome: string;
  descricao: string;
  passos: { ordem: number; modulo: string; acao: string }[];
}

export type NodeKind = "module" | "integration" | "edge" | "flowGroup";
