import type { LucideIcon } from "lucide-react";
import {
  Users, Home, FileText, Calendar, HandCoins, ClipboardCheck,
  Building2, UserCircle, Megaphone, GraduationCap, Settings,
  Search, MessageCircle, Handshake, FileSignature, Banknote,
  AlertTriangle, KeyRound, ArrowRightLeft, ShieldCheck,
} from "lucide-react";

export type Cor = "azul" | "dourado" | "verde" | "laranja" | "rosa" | "roxo";

export interface AreaCard {
  id: string;
  nome: string;
  icone: LucideIcon;
  cor: Cor;
  resumo: string;
  oQueE: string;
  comoFunciona: string[];
  dicas?: string[];
}

export interface PassoFluxo {
  titulo: string;
  quem: string;
  acao: string;
  icone: LucideIcon;
}

export interface Fluxo {
  id: string;
  nome: string;
  cor: Cor;
  resumo: string;
  passos: PassoFluxo[];
}

// ---- ÁREAS DO SISTEMA (visão simples para quem chega) ----
export const AREAS: AreaCard[] = [
  {
    id: "clientes",
    nome: "Clientes",
    icone: Users,
    cor: "azul",
    resumo: "Onde fica TODA pessoa do sistema.",
    oQueE: "É a agenda mestra da imobiliária. Todo mundo que aparece — locatário, comprador, proprietário, lead — fica aqui.",
    comoFunciona: [
      "Toda pessoa cadastrada vira um Cliente.",
      "O mesmo cliente pode ser locatário em um imóvel e proprietário em outro.",
      "Quando precisar buscar uma pessoa em qualquer formulário, é nessa base que o sistema procura.",
    ],
    dicas: ["Antes de cadastrar de novo, sempre busque pelo CPF/CNPJ — pode já existir."],
  },
  {
    id: "imoveis",
    nome: "Imóveis",
    icone: Home,
    cor: "dourado",
    resumo: "Cadastro de cada imóvel da carteira.",
    oQueE: "Toda casa, apartamento ou sala fica registrada aqui com fotos, documentos e proprietário(s).",
    comoFunciona: [
      "Cadastro precisa de: título, tipo (casa/apto/sala…) e finalidade (venda/locação).",
      "As fotos recebem marca d'água automaticamente.",
      "Imóvel publicado aparece no site e nos portais (Zap+, VivaReal, OLX).",
    ],
  },
  {
    id: "leads",
    nome: "Leads",
    icone: Search,
    cor: "verde",
    resumo: "Pessoas interessadas que chegaram pelo site ou indicação.",
    oQueE: "Todo contato novo (formulário do site, WhatsApp, indicação) entra como Lead até virar Cliente.",
    comoFunciona: [
      "O lead é distribuído automaticamente para um corretor.",
      "Quando o atendimento avança, o corretor clica em \"Converter em cliente\".",
      "Tem visão Kanban (Pipeline) para ver em que estágio cada lead está.",
    ],
  },
  {
    id: "visitas",
    nome: "Visitas",
    icone: Calendar,
    cor: "rosa",
    resumo: "Agenda de visitas aos imóveis.",
    oQueE: "Calendário das visitas marcadas, integrado com o Google Calendar do corretor.",
    comoFunciona: [
      "Ao marcar, o sistema mostra os horários livres do corretor (sem expor a agenda dele).",
      "Salvar a visita cria automaticamente o evento no Google Calendar.",
      "Depois da visita, o corretor preenche \"o cliente gostou? qual o próximo passo?\".",
    ],
    dicas: ["Para usar o Google Calendar, o corretor conecta a conta uma vez no Perfil."],
  },
  {
    id: "propostas",
    nome: "Propostas",
    icone: Handshake,
    cor: "laranja",
    resumo: "Quando o cliente faz uma oferta pelo imóvel.",
    oQueE: "Registra a oferta formal: valor, forma de pagamento, prazo.",
    comoFunciona: [
      "Pode partir direto de uma visita (já vem com cliente e imóvel preenchidos).",
      "Status: feita, aceita, recusada ou contraproposta.",
      "Quando aceita, basta clicar em \"Virar venda\" para criar o registro de venda.",
    ],
  },
  {
    id: "vendas",
    nome: "Vendas",
    icone: HandCoins,
    cor: "verde",
    resumo: "Vendas em andamento ou já fechadas.",
    oQueE: "Acompanha cada venda da negociação até a escritura.",
    comoFunciona: [
      "Recebe automaticamente os dados de uma proposta aceita.",
      "Quando a venda é concluída, as comissões dos corretores são geradas sozinhas.",
    ],
  },
  {
    id: "contratos",
    nome: "Contratos",
    icone: FileText,
    cor: "azul",
    resumo: "Editor único para 7 tipos de contrato.",
    oQueE: "Locação residencial, comercial, temporada, compra e venda, captação, administração e associação.",
    comoFunciona: [
      "Escolhe o tipo, o imóvel (que já traz os proprietários) e as partes.",
      "Gera o PDF com layout pronto e envia para assinatura digital (ZapSign).",
      "Quando todo mundo assina, o status vira \"ativo\" sozinho.",
    ],
  },
  {
    id: "locacoes",
    nome: "Locações",
    icone: KeyRound,
    cor: "dourado",
    resumo: "Painel do dia a dia das locações ativas.",
    oQueE: "Lista todas as locações com cobranças, repasses e status atual.",
    comoFunciona: [
      "Mostra ativas, inadimplentes, recebido no mês e o que ainda precisa repassar.",
      "Cada linha tem ações rápidas: gerar cobrança, marcar paga, mandar WhatsApp.",
      "Toda madrugada o sistema gera as cobranças do mês automaticamente.",
    ],
  },
  {
    id: "vistorias",
    nome: "Vistorias",
    icone: ClipboardCheck,
    cor: "roxo",
    resumo: "Laudo de entrada e saída do imóvel.",
    oQueE: "Checklist por cômodo com fotos, estado de cada item e assinatura digital.",
    comoFunciona: [
      "Vistoria de entrada: registra como o imóvel está sendo entregue.",
      "Vistoria de saída: detecta o que foi danificado.",
      "Itens avariados viram despesas em lote, pré-preenchidas para cobrar do responsável.",
    ],
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    icone: Banknote,
    cor: "verde",
    resumo: "Visão geral de tudo que entra e sai.",
    oQueE: "KPIs do mês: receita da imobiliária, vendas, repasses, despesas e comissões.",
    comoFunciona: [
      "Junta dados de cobranças, repasses, despesas, comissões e vendas em um lugar só.",
      "Mostra inadimplência, forecast de vendas e o que falta repassar.",
    ],
  },
  {
    id: "proprietarios",
    nome: "Proprietários",
    icone: UserCircle,
    cor: "rosa",
    resumo: "Quem tem acesso ao Portal do Proprietário.",
    oQueE: "Subconjunto de clientes que recebem login para acompanhar imóveis e repasses.",
    comoFunciona: [
      "Botão \"Convidar pro Portal\" envia um link mágico de acesso.",
      "Repasse pode ser por TED ou split automático no Asaas.",
    ],
  },
  {
    id: "marketing",
    nome: "Marketing & Site",
    icone: Megaphone,
    cor: "laranja",
    resumo: "Campanhas, banners, blog e depoimentos.",
    oQueE: "Tudo que aparece para o público externo (site, WhatsApp em massa, Instagram).",
    comoFunciona: [
      "Banners e blog alimentam o site institucional.",
      "Marketing dispara campanhas por email, WhatsApp ou Instagram.",
    ],
  },
  {
    id: "aprendizado",
    nome: "Aprendizado",
    icone: GraduationCap,
    cor: "roxo",
    resumo: "Treinamento interno para corretores.",
    oQueE: "Trilhas com aulas, quizzes e certificados.",
    comoFunciona: ["Cada corretor tem progresso próprio em cada módulo."],
  },
  {
    id: "configuracoes",
    nome: "Configurações & Perfil",
    icone: Settings,
    cor: "azul",
    resumo: "Ajustes do sistema e da sua conta.",
    oQueE: "Dados pessoais, conexão com Google Calendar, disponibilidade para visitas e configs gerais.",
    comoFunciona: ["No Perfil você conecta seu Google Calendar e define seus horários de atendimento."],
  },
];

// ---- FLUXOS (sequências passo a passo) ----
export const FLUXOS: Fluxo[] = [
  {
    id: "lead-venda",
    nome: "Da primeira mensagem até a venda",
    cor: "verde",
    resumo: "O caminho de um interessado que chega no site até virar venda fechada.",
    passos: [
      { titulo: "Lead chega", quem: "Site / WhatsApp", acao: "A pessoa preenche o formulário ou manda mensagem. Vira um Lead.", icone: Search },
      { titulo: "Distribuição", quem: "Sistema", acao: "O lead é distribuído para um corretor automaticamente.", icone: ArrowRightLeft },
      { titulo: "Atendimento", quem: "Corretor", acao: "Conversa, qualifica e converte o lead em Cliente.", icone: MessageCircle },
      { titulo: "Visita marcada", quem: "Corretor", acao: "Agenda a visita ao imóvel — entra no Google Calendar dele.", icone: Calendar },
      { titulo: "Proposta", quem: "Cliente + Corretor", acao: "Cliente faz uma oferta. Vira proposta no sistema.", icone: Handshake },
      { titulo: "Venda", quem: "Imobiliária", acao: "Proposta aceita → vira Venda. Comissões geradas sozinhas.", icone: HandCoins },
    ],
  },
  {
    id: "locacao-completa",
    nome: "Locação do começo ao fim",
    cor: "dourado",
    resumo: "Todo o ciclo de uma locação: contrato, vistoria, cobrança mensal e saída.",
    passos: [
      { titulo: "Contrato", quem: "Imobiliária", acao: "Cria o contrato escolhendo o imóvel, locador e locatário.", icone: FileText },
      { titulo: "Vistoria de entrada", quem: "Vistoriador", acao: "Checklist por cômodo + fotos. Locador e locatário assinam.", icone: ClipboardCheck },
      { titulo: "Assinatura digital", quem: "ZapSign", acao: "Contrato é enviado para assinatura. Quando todos assinam, vira ATIVO.", icone: FileSignature },
      { titulo: "Cobrança mensal", quem: "Sistema (06h)", acao: "Toda madrugada, gera as cobranças do mês no Asaas.", icone: Banknote },
      { titulo: "Repasse", quem: "Sistema", acao: "Quando o locatário paga, descontamos a taxa e repassamos ao proprietário.", icone: ArrowRightLeft },
      { titulo: "Vistoria de saída", quem: "Vistoriador", acao: "No fim, vistoria de saída. Avarias viram despesas para cobrar.", icone: ClipboardCheck },
    ],
  },
  {
    id: "despesa-aprovacao",
    nome: "Despesa que precisa de aprovação",
    cor: "laranja",
    resumo: "Quando uma manutenção precisa ser autorizada pelo proprietário antes de cobrar.",
    passos: [
      { titulo: "Despesa cadastrada", quem: "Imobiliária", acao: "Cadastra a despesa (ex: troca de torneira) com orçamento e nota.", icone: AlertTriangle },
      { titulo: "Enviar pra aprovação", quem: "Sistema", acao: "Gera um link único e tenta enviar por WhatsApp para o proprietário.", icone: MessageCircle },
      { titulo: "Proprietário decide", quem: "Proprietário", acao: "Acessa o link (sem login), vê o orçamento e aprova ou recusa.", icone: ShieldCheck },
      { titulo: "Cobrança ajustada", quem: "Sistema", acao: "Se aprovada, o valor entra na próxima cobrança ou vira abatimento no repasse.", icone: Banknote },
    ],
  },
  {
    id: "imovel-portais",
    nome: "Imóvel novo no site e portais",
    cor: "azul",
    resumo: "Como um imóvel cadastrado chega nos portais (Zap+, VivaReal, OLX).",
    passos: [
      { titulo: "Cadastro", quem: "Corretor", acao: "Cadastra o imóvel: título, tipo, finalidade, características.", icone: Building2 },
      { titulo: "Fotos com marca d'água", quem: "Sistema", acao: "Upload das fotos — a marca d'água é aplicada automaticamente.", icone: Home },
      { titulo: "Publicar", quem: "Imobiliária", acao: "Marca como publicado. Aparece imediatamente no site Moradda.", icone: Megaphone },
      { titulo: "Portais externos", quem: "Sistema", acao: "Um feed XML alimenta Zap+, VivaReal e OLX automaticamente.", icone: ArrowRightLeft },
    ],
  },
];

export const COR_BG: Record<Cor, string> = {
  azul: "bg-c-azul/10 text-c-azul",
  dourado: "bg-c-dourado/15 text-c-dourado-text",
  verde: "bg-c-verde/10 text-c-verde",
  laranja: "bg-c-laranja/10 text-c-laranja",
  rosa: "bg-c-rosa/10 text-c-rosa",
  roxo: "bg-c-roxo/10 text-c-roxo",
};

export const COR_BORDER: Record<Cor, string> = {
  azul: "border-c-azul/30",
  dourado: "border-c-dourado/40",
  verde: "border-c-verde/30",
  laranja: "border-c-laranja/30",
  rosa: "border-c-rosa/30",
  roxo: "border-c-roxo/30",
};

export const COR_BAR: Record<Cor, string> = {
  azul: "bg-c-azul",
  dourado: "bg-c-dourado",
  verde: "bg-c-verde",
  laranja: "bg-c-laranja",
  rosa: "bg-c-rosa",
  roxo: "bg-c-roxo",
};

export const COR_GRAD: Record<Cor, string> = {
  azul: "from-c-azul to-moradda-azul-claro",
  dourado: "from-c-dourado to-c-laranja",
  verde: "from-c-verde to-c-azul",
  laranja: "from-c-laranja to-c-rosa",
  rosa: "from-c-rosa to-c-roxo",
  roxo: "from-c-roxo to-c-azul",
};
