"""
Seed do modulo de Aprendizado: trilha 'Sistema Moradda - Painel Administrativo'
Insere aulas (texto + quiz) e questoes para os 10 modulos.
"""
import json
import urllib.request
import uuid

import os
PAT = os.environ.get("SUPABASE_PAT") or "REPLACE_WITH_PAT"
PROJ = os.environ.get("SUPABASE_PROJECT_REF") or "mvzjqktgnwjwuinnxxcc"

MODULOS = {
    "visao_geral":   "74ef2611-f845-40c3-aa50-f91ffd665219",
    "clientes":      "4255c81b-e84d-4ae9-98db-b90ce7e78232",
    "imoveis":       "1bcca59a-60d3-4b1f-b245-7c9ff01fbbbd",
    "leads":         "e36352a0-88b4-4040-97e3-baaa0a7c4a92",
    "visitas":       "d2164440-5059-442a-a4e3-c8f86ddccf6c",
    "propostas":     "bd5ae315-99cd-41d8-a438-5e3386595474",
    "contratos":     "248f4783-5dbe-4438-bacd-34e356332d60",
    "locacoes":      "58547796-8694-4fe2-926e-60500c14fd17",
    "despesas":      "1356cc71-4246-4e40-9fd8-ea097eac0db7",
    "vistorias":     "6f28d100-20f9-4afe-b831-5c1825f7a76c",
}


def run_sql(sql: str):
    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJ}/database/query",
        data=body,
        headers={
            "Authorization": f"Bearer {PAT}",
            "Content-Type": "application/json",
            "User-Agent": "moradda-seed-script/1.0",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {msg}")


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def jsonb(obj) -> str:
    return sql_str(json.dumps(obj, ensure_ascii=False))


# Estrutura: cada modulo tem [aulas_texto, aulas_quiz]
# aulas_texto: [(titulo, conteudo_md, pontos)]
# aulas_quiz:  [(titulo, pontos, questoes)]
#   questoes: [(enunciado, opcoes_list, resposta_correta_idx, explicacao, pontos)]

CONTEUDO = {
    "visao_geral": {
        "textos": [(
            "Bem-vindo ao Painel Moradda",
            """# Visao Geral do Painel

O painel administrativo da Moradda Imobiliaria e o sistema central de gestao de toda a operacao.
Aqui voce gerencia clientes, imoveis, contratos, cobrancas, vistorias e muito mais.

## Estrutura da Sidebar

A barra lateral organiza os modulos em 6 grupos:

- **Principal**: Dashboard, Clientes (master), Financeiro
- **Cadastros**: Imoveis, Proprietarios, Corretores
- **Comercial**: CRM (socios), Leads, Pipeline Leads, Visitas, Propostas, Vendas, Pipeline Vendas
- **Locacao**: Contratos, Locacoes, Vistorias, Modelos Contrato
- **Marketing**: Marketing, Banners, Blog, Depoimentos
- **Sistema**: Precificacao, Aprendizado, Acessos (socios), Relatorios, Configuracoes

## Perfis de acesso

| Perfil | O que pode |
|--------|------------|
| **Socio** | Acesso total + Acessos + CRM |
| **Assistente** | Gerencia cadastros, contratos, cobrancas |
| **Corretor** | Ve seus leads, visitas, comissoes |

## Modulo de Perfil

Cada usuario tem `/painel/perfil` para editar dados pessoais, foto, senha,
**conectar Google Calendar** e configurar disponibilidade para visitas.""",
            30,
        )],
        "quizes": [(
            "Quiz: Estrutura do Painel",
            50,
            [
                ("Onde fica o atalho 'Clientes' no menu lateral?",
                 ["Em Cadastros", "Em Comercial", "Em Principal", "Em Sistema"],
                 2, "Clientes esta no grupo Principal junto com Dashboard e Financeiro.", 10),
                ("Qual perfil consegue acessar o item 'Acessos'?",
                 ["Apenas socios", "Socios e assistentes", "Todos os corretores", "Apenas o admin"],
                 0, "Acessos so aparece para usuarios com is_socio=true.", 10),
                ("Onde se conecta a agenda Google de cada usuario?",
                 ["Configuracoes", "Acessos", "Perfil", "CRM"],
                 2, "Em Perfil, na secao 'Minha Agenda Google', clique em Conectar.", 10),
            ],
        )],
    },

    "clientes": {
        "textos": [(
            "Clientes como Base Mestra",
            """# Clientes - Base Mestra do Sistema

O modulo **Clientes** e a fonte unica de verdade sobre pessoas no sistema.
Toda pessoa que aparece em qualquer lugar (locatario, comprador, hospede,
proprietario, lead) deve estar cadastrada como cliente.

## Diferenca: Clientes vs Proprietarios

- **Clientes**: base mestra de pessoas (PF/PJ). **Sem login.**
- **Proprietarios**: subset de clientes que recebe **acesso ao Portal do Proprietario** (login + magic link).
  A tabela `proprietarios` tem FK opcional para `clientes.id`.

## Componente BuscarCliente

Em **todo** formulario do sistema (contrato, proposta, visita, imovel)
voce usa o autocomplete `<BuscarCliente>`. Ele:

1. Busca por nome, CPF/CNPJ ou email
2. Mostra resultados em 300ms
3. Permite **criar novo cliente direto no modal** (botao "+ Novo cliente")
4. Auto-popula campos relacionados quando voce seleciona

## Aba "Imoveis" no detalhe

Lista todos os imoveis vinculados ao cliente via `imoveis_clientes`
(papel: proprietario / co-proprietario, com percentual de participacao).

## Aba "Contratos"

Mostra contratos onde o cliente e parte (locador, locatario, fiador, comprador).

## Aba "Lead origem"

Se o cliente foi convertido a partir de um lead, mostra o lead de origem.

## Convidar pro Portal

O botao "Convidar pro Portal" cria um registro em `proprietarios` (se nao
existir) e dispara magic link via edge function `convidar-proprietario`.""",
            40,
        )],
        "quizes": [(
            "Quiz: Modulo Clientes",
            60,
            [
                ("Qual a diferenca entre 'clientes' e 'proprietarios'?",
                 ["Sao a mesma coisa",
                  "Clientes nao tem login; proprietarios tem login no Portal",
                  "Clientes e PF, proprietarios e PJ",
                  "Clientes pagam, proprietarios recebem"],
                 1, "Clientes e a base mestra sem login. Proprietarios e o subset que recebe acesso ao Portal.", 15),
                ("Como vincular um proprietario a um imovel?",
                 ["Editando o imovel manualmente",
                  "Via tabela imoveis_clientes (N:N com papel e percentual)",
                  "Cadastrando o cliente como proprietario primeiro",
                  "Nao da pra vincular"],
                 1, "imoveis_clientes e a tabela N:N que registra papel (proprietario/co-proprietario) e percentual.", 15),
                ("Onde o componente BuscarCliente NAO aparece?",
                 ["Editor de contrato", "Editor de proposta", "Tela de visitas", "Tela de banners"],
                 3, "BuscarCliente e usado em formularios que tocam em pessoas (contrato, proposta, visita, imovel).", 15),
                ("Quando voce converte um lead em cliente, o que acontece?",
                 ["O lead some",
                  "Cria-se um registro em clientes com lead_origem_id apontando pro lead",
                  "Vira proprietario automaticamente",
                  "Manda email"],
                 1, "Conversao cria cliente preservando o vinculo via clientes.lead_origem_id.", 15),
            ],
        )],
    },

    "imoveis": {
        "textos": [(
            "Cadastro de Imoveis",
            """# Cadastro e Gestao de Imoveis

O modulo Imoveis (Cadastros > Imoveis) gerencia o catalogo de imoveis
da imobiliaria.

## Campos obrigatorios

- Codigo (auto: MRD-00001, MRD-00002...)
- Titulo
- Tipo (apartamento, casa, sala, terreno...)
- Finalidade (locacao / venda / ambos)

## Galeria de fotos

- Upload multiplo
- **Watermark automatico** aplicado via edge function `apply-watermark`
  ao chegar no Storage
- Bucket: `imoveis`
- Reorder por drag, foto principal (capa), legenda

## Vinculo com proprietarios

Use a secao `<ImovelClientesSection>` no editor:

1. Clica em "+ Adicionar proprietario"
2. Usa `<BuscarCliente>` (papel sugerido: proprietario)
3. Define **percentual de participacao** (ex: 50% / 50% pra coproprietarios)
4. Salva em `imoveis_clientes`

## Documentos

Aba "Documentos" do editor permite anexar IPTU, escritura, planta,
matricula. Salvos em `imoveis_documentos`.

## Publicacao

`imoveis.publicado = true` faz o imovel aparecer no site publico.
O feed XML para Zap+/VivaReal/OLX e gerado pela edge function `vrsync-feed`.""",
            40,
        )],
        "quizes": [(
            "Quiz: Imoveis",
            50,
            [
                ("O que faz a edge function apply-watermark?",
                 ["Comprime a foto em WebP",
                  "Aplica marca dagua automatica nas fotos enviadas",
                  "Redimensiona para 1600px",
                  "Faz upload do imovel para o site"],
                 1, "apply-watermark e disparada pelo Storage e adiciona watermark MRD nas fotos.", 15),
                ("Como cadastrar 2 proprietarios com 50% cada?",
                 ["Criar 2 imoveis identicos",
                  "Adicionar 2 entradas em imoveis_clientes com participacao_pct=50",
                  "Cadastrar como condominio",
                  "Nao da pra ter mais de 1 proprietario"],
                 1, "imoveis_clientes suporta N:N com percentual por linha.", 15),
                ("Onde o feed XML do site e gerado?",
                 ["Cron pg_cron", "Edge function vrsync-feed", "Trigger SQL", "Manualmente via curl"],
                 1, "vrsync-feed retorna XML publico para portais externos.", 10),
            ],
        )],
    },

    "leads": {
        "textos": [(
            "Leads e Pipeline",
            """# Gestao de Leads

Lead e o primeiro contato. O modulo Leads concentra TODOS os leads
(do site, manual, importacao em massa).

## Tipos de lead

- locacao
- compra
- avaliacao
- outro

## Status

- novo
- em_atendimento
- convertido (virou cliente)
- perdido (com motivo_perda)

## Distribuicao automatica

Quando um lead chega via formulario do site, o sistema atribui um
corretor automaticamente via round-robin (tabela `distribuicao_leads`).

## Pipeline kanban

Em **Comercial > Pipeline Leads**, voce ve um kanban com colunas:
Novo - Contato - Visita - Proposta - Convertido / Perdido.
Drag-and-drop atualiza `leads.status`.

## Acoes principais

- **WhatsApp** / Telefone / Email (atalhos no card)
- **Converter em cliente**: abre `<NovoClienteModal>` e cria registro
  em `clientes` com `lead_origem_id` preservando o vinculo

## Vinculacoes posteriores

Apos converter:
- Visitas vinculam `lead_id`
- Propostas vinculam `lead_id` + `cliente_id`
- Contratos vinculam pelas partes (`contratos_partes.cliente_id`)""",
            40,
        )],
        "quizes": [(
            "Quiz: Leads",
            50,
            [
                ("O que e a distribuicao automatica de leads?",
                 ["Manda email pra todos os corretores",
                  "Atribui corretor via round-robin baseado em distribuicao_leads",
                  "Manda pro corretor com mais vendas",
                  "Pergunta no WhatsApp quem quer pegar"],
                 1, "Round-robin garante distribuicao equitativa entre corretores ativos.", 15),
                ("Quando voce converte um lead, o que acontece?",
                 ["Cria registro em clientes preservando lead_origem_id",
                  "O lead some do sistema",
                  "Vira proprietario direto",
                  "Cria contrato"],
                 0, "Conversao cria cliente vinculado ao lead atraves do campo lead_origem_id.", 15),
                ("No Pipeline kanban, mover de coluna...",
                 ["Apenas reordena visualmente",
                  "Atualiza leads.status no banco",
                  "Manda email pro lead",
                  "Cria visita"],
                 1, "Drag-drop persiste a mudanca de status.", 10),
            ],
        )],
    },

    "visitas": {
        "textos": [(
            "Visitas e Google Calendar",
            """# Visitas com Integracao Google Calendar

O modulo Visitas e o **calendario operacional** dos corretores. Cada
usuario conecta a propria conta Google Calendar e os outros usuarios
(socios) podem agendar visitas escolhendo entre slots livres - **sem
ver os eventos pessoais**.

## Como conectar (uma vez por usuario)

1. Vai em **Perfil**
2. Secao "Minha Agenda Google" - botao **Conectar Google Calendar**
3. Autoriza no Google
4. Pronto - token salvo em `users_profiles.gcal_refresh_token`

## Configurar Disponibilidade

Em Perfil, secao "Disponibilidade para Visitas":

| Dia | Atende? | Inicio | Fim | Duracao | Buffer |
|-----|---------|--------|-----|---------|--------|
| Seg | sim | 08:00 | 18:00 | 60min | 30min |
| Sab | sim | 09:00 | 13:00 | 60min | 30min |

Salvo em `corretor_disponibilidade`.

## Marcar uma visita

1. Clica em **+ Nova Visita** ou em um dia do calendario
2. Escolhe o **corretor** (socios podem escolher outro corretor; corretores ficam travados em si proprios)
3. Escolhe o **imovel**
4. Usa `<BuscarCliente>` para o cliente
5. Escolhe a data - aparecem **slots livres** (calculados pela edge function `gcal-freebusy`)
6. Click no slot = preenche hora e duracao
7. Salva - cria evento no Google Calendar do corretor automaticamente

## Apos a visita

Mude o status para **realizada** - abre o modal pos-visita:

- Cliente gostou? sim/nao
- Interesse: alto/medio/baixo/nenhum
- Proximo passo: proposta / visita_2 / aguardando_decisao / descartado / outro
- Resultado (texto livre)

## Cancelar / Remover

Sempre **deleta o evento no Google primeiro** (await), depois marca/apaga
local. Isso evita eventos orfaos no calendario.""",
            50,
        )],
        "quizes": [(
            "Quiz: Visitas e Google Calendar",
            70,
            [
                ("Outros usuarios conseguem ver os eventos pessoais do meu Google?",
                 ["Sim, qualquer um",
                  "Nao, eles veem apenas slots LIVRES via freebusy.query",
                  "So os socios veem",
                  "So se eu autorizar"],
                 1, "freebusy.query do Google retorna apenas livre/ocupado, nunca o titulo do evento.", 15),
                ("Em qual edge function os slots livres sao calculados?",
                 ["gcal-create-event", "gcal-freebusy", "gcal-oauth-init", "gcal-webhook"],
                 1, "gcal-freebusy intersecta corretor_disponibilidade x freebusy.query x visitas no painel.", 15),
                ("O que acontece quando voce salva uma visita?",
                 ["So cria no banco",
                  "Cria no banco e await no gcal-create-event para criar evento Google",
                  "Manda email",
                  "Pede confirmacao do cliente"],
                 1, "O await garante que o google_event_id seja gravado antes de o usuario poder remover.", 15),
                ("Por que await em gcal-update-event(delete) ao remover visita?",
                 ["So por estilo de codigo",
                  "Evita race condition que deixaria evento orfao no Google",
                  "E mais rapido",
                  "Nao precisa await"],
                 1, "Sem await, o delete local pode acontecer antes da chamada Google e o evento fica orfao.", 15),
                ("Onde fica configurada a janela de atendimento (08-18, etc)?",
                 ["No proprio Google Calendar",
                  "Em Configuracoes do Sistema",
                  "Na tabela corretor_disponibilidade (configurada em Perfil)",
                  "Hardcoded no codigo"],
                 2, "corretor_disponibilidade tem dia_semana, hora_inicio/fim, duracao_visita_min, buffer_min.", 10),
            ],
        )],
    },

    "propostas": {
        "textos": [(
            "Propostas",
            """# Modulo Propostas

Proposta e a oferta formal de um comprador sobre um imovel a venda.
Esta entre **Visita** e **Venda** no funil comercial.

## Vinculos

Proposta tem FKs opcionais para:
- `cliente_id` - quem propos
- `lead_id` - lead que originou
- `visita_id` - visita que gerou a proposta
- `imovel_id` - imovel da oferta
- `corretor_id` - corretor responsavel

## Status

- feita - proposta enviada, aguardando resposta
- aceita - vendedor aceitou
- recusada - recusada definitivamente
- contraproposta - vendedor mandou contraproposta
- expirada - prazo passou

## Editor (cards)

- Imovel (select)
- Comprador (com `<BuscarCliente>`)
- Origem (lead/visita - secao recolhivel)
- Proposta (valor, forma_pagamento, condicoes, prazo)
- Status & Resposta (mostra contraproposta)
- Observacoes

## Acoes na lista

- Aceitar / Recusar (botoes verde/vermelho)
- Contraproposta (modal estilizado, NAO e prompt nativo)
- **Virar venda** (so se aceita) - cria registro em `vendas` e redireciona

## Vindo de visita

Quando voce marca o proximo_passo='proposta' apos uma visita, o
botao "Criar proposta a partir desta visita" aparece e leva para
`/painel/propostas/novo?visita_id=...&imovel_id=...&cliente_id=...`
ja preenchendo tudo.

## Gerar PDF

Botao "Gerar PDF" usa `printProposta()` que reusa o estilo dos
contratos (paleta Moradda, cabecalho, losangos). Sai pra impressao
imediata - o navegador permite salvar como PDF.""",
            40,
        )],
        "quizes": [(
            "Quiz: Propostas",
            50,
            [
                ("Quais status uma proposta pode ter?",
                 ["feita / aceita / recusada / contraproposta / expirada",
                  "ativo / inativo",
                  "novo / em_andamento / fechado",
                  "rascunho / enviado / aceito"],
                 0, "Sao 5 status que cobrem o ciclo da negociacao.", 15),
                ("Como criar proposta vinculada a uma visita ja realizada?",
                 ["Tem que digitar tudo de novo",
                  "Botao 'Criar proposta a partir desta visita' (proximo_passo=proposta)",
                  "Importar Excel",
                  "Criar manualmente"],
                 1, "O botao no modal pos-visita leva pra propostas/novo com query params pre-populados.", 15),
                ("O que faz 'Virar venda'?",
                 ["Marca a proposta como aceita",
                  "Cria registro em 'vendas' com proposta_id e redireciona pro editor",
                  "Manda email pro vendedor",
                  "Gera contrato"],
                 1, "Disponivel apenas quando proposta esta aceita; cria venda preservando vinculo.", 15),
            ],
        )],
    },

    "contratos": {
        "textos": [(
            "Editor Unificado de Contratos",
            """# Contratos - Editor Unificado

Um unico editor (`/painel/contratos/:id`) cuida de **7 tipos de contrato**:

1. Locacao Residencial (16 clausulas)
2. Locacao Comercial (16 clausulas)
3. Locacao por Temporada (16 clausulas, valor_diaria)
4. Compra e Venda (16 clausulas)
5. Captacao Exclusiva (clausula penal 10% + arts. 412+413 CC)
6. Administracao (datas em ANOS, taxa_admin)
7. Associacao com Corretor (campo IMOVEL ocultado dinamicamente)

## Secoes do editor

- **Imovel**: ao selecionar, **auto-popula proprietarios** via `imoveis_clientes`
- **Partes** (locador, locatario, fiador, testemunha) - todas com `<BuscarCliente>`
- **Vigencia e valores**
- **Garantia** (sem_garantia, fiador, caucao, seguro_fianca, titulo_capitalizacao)
- **Reajuste** (igpm, ipca, sem)
- **Cobrancas** - secao integrada (`<CobrancasSection>`)
- **Repasses** - secao integrada (`<RepassesSection>`)
- **Despesas** - secao integrada (`<DespesasSection>`) - locacao/administracao

## Modo de cobranca

- desativada: sem cobranca automatica
- manual: voce gera quando quiser
- automatica: cron diario gera 5 dias antes do vencimento (default)

## Geracao de PDF

- **Gerar PDF**: usa `printContratoFromMd` (window.print, visual perfeito)
- **Gerar PDF Base64**: html2canvas+jsPDF para upload no ZapSign

## ZapSign

- Botao "Enviar pra Assinar" - chama `zapsign-send`
- Cria documento com 1 signatario por parte
- Status muda pra `aguardando_assinatura`
- Webhook `zapsign-webhook` atualiza quando alguem assina
- Botao manual "Sincronizar" se webhook falhar

## Engine de merge

`{{placeholder}}` simples + `{{#if VAR}}...{{/if}}` condicional + helpers
(`valorPorExtenso`, `formatarCep`, `formatarTelefone`, `enderecoCompleto`).""",
            60,
        )],
        "quizes": [(
            "Quiz: Contratos",
            70,
            [
                ("Quantos tipos de contrato o editor suporta?",
                 ["3", "5", "7", "10"],
                 2, "7 tipos: 3 locacoes + Compra/Venda + Captacao + Administracao + Associacao.", 15),
                ("Para que serve o modo de cobranca 'automatica'?",
                 ["O cron diario gera as cobrancas 5 dias antes do vencimento",
                  "Cobra automaticamente todo dia",
                  "Manda WhatsApp",
                  "Nada, e placeholder"],
                 0, "moradda-cobranca-diaria roda as 06h e dispara cobranca-gerar-mes.", 15),
                ("O ZapSign envia o documento como?",
                 ["URL", "PDF base64 gerado pelo client", "Markdown", "DOC"],
                 1, "Geramos PDF base64 com html2canvas+jsPDF e enviamos via zapsign-send.", 15),
                ("Quando os proprietarios sao auto-populados como locador?",
                 ["Manualmente",
                  "Quando voce seleciona o imovel - o editor le imoveis_clientes",
                  "So no contrato de venda",
                  "Nao auto-populam"],
                 1, "Auto-import dos clientes vinculados ao imovel quando imovel_id muda.", 15),
                ("O que faz o helper valorPorExtenso?",
                 ["Formata moeda",
                  "Converte numero em texto por extenso (R$ 1.500,00 = mil e quinhentos reais)",
                  "Soma valores",
                  "Valida CPF"],
                 1, "Util para clausulas de valor que precisam de versao escrita por lei.", 10),
            ],
        )],
    },

    "locacoes": {
        "textos": [(
            "Locacoes - Cobrancas Asaas",
            """# Locacoes e Cobrancas Automaticas

A pagina **Locacoes** (`/painel/locacoes`) e uma view especializada
sobre `contratos_locacao` filtrada por tipos de aluguel.

## KPIs

- Locacoes ativas
- Aluguel total/mes
- Recebido no mes
- A repassar (proprietarios)
- Inadimplentes

## Tabela com acoes inline

| Acao | O que faz |
|------|-----------|
| Gerar cobranca | Modal com preview (valor + extras + abatimento + despesas) - chama `cobranca-gerar-uma` |
| Marcar paga | Marca a proxima pendente como paga |
| WhatsApp | Abre wa.me com link da fatura Asaas |
| Ver contrato | Vai pro editor |

## Cron diario as 06h BRT

`pg_cron` agendado:
- Job: `moradda-cobranca-diaria`
- Schedule: `0 9 * * *` (UTC = 06h BRT)
- Acao: `pg_net.http_post` para `cobranca-gerar-mes`

A funcao verifica todos os contratos ativos com `cobranca_modo='automatica'`
e cria cobranca se vencimento esta dentro de 5 dias e ainda nao foi gerada.

## Extras e Abatimentos

- `valor_extras` - cobra a mais do locatario (ex: extra de agua, gas)
- `valor_abatimento` - desconta (ex: conserto que o locatario fez no imovel)
- `valor_total = valor + valor_extras - valor_abatimento` (computed pelo Postgres)

## Mapeamento de status Asaas

`asaas-webhook` mapeia status UPPERCASE do Asaas para minusculo interno:

- CONFIRMED / RECEIVED / RECEIVED_IN_CASH -> paga
- OVERDUE -> vencida
- REFUNDED -> estornada
- DELETED / CANCELED -> cancelada
- default -> pendente

## Repasses

Quando uma cobranca vira `paga`, o webhook cria automaticamente registros
em `contratos_repasses` (um por proprietario do imovel, baseado em
`participacao_pct`). Se o proprietario tem `repasse_modo='split'`, ja
fica `concluido`. Senao, fica `pendente` para execucao manual via Asaas.

## Auto-marca inadimplente

Ao carregar a tabela, a UI faz UPDATE em `contratos_locacao` setando
`status='inadimplente'` para contratos com cobrancas vencidas (idempotente).""",
            70,
        )],
        "quizes": [(
            "Quiz: Locacoes e Asaas",
            80,
            [
                ("Em que horario o cron de cobranca roda?",
                 ["00:00 BRT", "06:00 BRT (09:00 UTC)", "12:00 BRT", "18:00 BRT"],
                 1, "Schedule '0 9 * * *' = 09 UTC = 06 BRT.", 15),
                ("Quantos dias antes do vencimento a cobranca e gerada?",
                 ["1 dia", "3 dias", "5 dias", "10 dias"],
                 2, "Janela de 5 dias - se vencimento - hoje > 5, pula.", 15),
                ("O que acontece se a despesa de manutencao excede o valor do aluguel?",
                 ["Bloqueia a cobranca",
                  "Abate o que pode e o restante vira saldo_pendente para o mes seguinte",
                  "Manda pro proprietario pagar",
                  "Erro"],
                 1, "saldo_pendente preserva o que falta abater nos proximos meses.", 15),
                ("Como o asaas-webhook mapeia o status RECEIVED?",
                 ["pendente", "paga", "vencida", "cancelada"],
                 1, "RECEIVED/CONFIRMED/RECEIVED_IN_CASH -> paga.", 10),
                ("O que e o repasse_modo='split'?",
                 ["Repasse manual",
                  "Asaas faz split automatico no momento do pagamento, indo direto pro proprietario",
                  "Divide entre 2 proprietarios",
                  "Atrasa o repasse"],
                 1, "Split delega ao Asaas a transferencia, eliminando o passo manual.", 15),
                ("Como funciona valor_total?",
                 ["E digitado manualmente",
                  "E coluna GENERATED ALWAYS AS (valor + extras - abatimento) STORED",
                  "Calculado no front",
                  "Igual ao valor"],
                 1, "Coluna computada pelo Postgres, sempre consistente.", 10),
            ],
        )],
    },

    "despesas": {
        "textos": [(
            "Despesas com Aprovacao do Proprietario",
            """# Despesas e Aprovacao do Proprietario

Despesas sao manutencoes, reformas, taxas que ocorrem no imovel
durante a locacao. O sistema permite registrar orcamentos, enviar
para o proprietario aprovar e abater nas cobrancas/repasses.

## Tipos de despesa

- manutencao
- reforma
- taxa
- outro

## Status

- orcamento - registrado, aguardando enviar pra proprietario
- aguardando_aprovacao - link enviado, esperando resposta
- aprovada - proprietario autorizou
- recusada - proprietario recusou (com motivo_recusa)
- executada - servico foi feito
- paga - despesa quitada

## Quem paga? Onde abater?

| Campo | Valores |
|-------|---------|
| `quem_paga` | locador / locatario / imobiliaria |
| `abater_em` | aluguel (proxima cobranca) / repasse (proximo repasse ao locador) / nao_abater |

## Fluxo de aprovacao

1. Cadastra despesa em `contratos > Despesas` ou via vistoria de saida (item avariado)
2. Status='orcamento'
3. Botao **"Enviar pra aprovacao"**:
   - Edge function `despesa-enviar-aprovacao`
   - Gera `aprovacao_token` unico (32 chars)
   - Status='aguardando_aprovacao'
   - Tenta enviar WhatsApp + retorna link copiavel
4. Proprietario acessa **rota publica** `/aprovar-despesa/:token` (sem login!)
5. Ve descricao, valor, anexo (foto da NF/orcamento)
6. **Aprova** ou **Recusa** (com motivo)
7. Status atualiza

## Integracao com cobrancas

Quando o cron `cobranca-gerar-mes` roda, ele soma:

- Despesas com `status='aprovada'` + `abater_em='aluguel'`
- Se `quem_paga='locatario'`: vira `valor_extras` (cobra mais)
- Se `quem_paga='locador'`: vira `valor_abatimento` (desconta)

Despesas usadas em uma cobranca recebem `cobranca_id` preenchido,
evitando uso duplicado.

## Vinculo com Vistorias

Quando uma vistoria detecta itens **avariados** ou **ruins**, voce pode:

- **Criar despesa individual** (botao por item)
- **Criar despesas em lote** (botao no card "Avariados detectados")

A despesa fica vinculada ao item via `vistorias_itens.despesa_id`,
e nao da pra remover o item enquanto a despesa existir.""",
            60,
        )],
        "quizes": [(
            "Quiz: Despesas",
            70,
            [
                ("Como o proprietario aprova uma despesa?",
                 ["Login no portal",
                  "Acessa /aprovar-despesa/:token (rota publica sem login)",
                  "Email com botao",
                  "Liga pra imobiliaria"],
                 1, "Token unico gera link publico que so funciona pra essa despesa.", 15),
                ("Quando uma despesa marcada como abater_em='aluguel' afeta o boleto?",
                 ["Imediatamente",
                  "Apenas quando status='aprovada' e a proxima cobranca for gerada",
                  "Apenas se quem_paga='locador'",
                  "Apenas no fim do contrato"],
                 1, "cobranca-gerar-mes le despesas APROVADAS sem cobranca_id e abate.", 15),
                ("Se uma despesa custa R$ 2000 mas o aluguel e R$ 1500, o que acontece?",
                 ["A cobranca e bloqueada",
                  "Abate R$ 1500 e R$ 500 vira saldo_pendente pro proximo mes",
                  "Ignora o que excede",
                  "Manda pro proprietario pagar a diferenca"],
                 1, "saldo_pendente persiste o que falta abater para os proximos meses.", 15),
                ("Despesas geradas a partir de vistoria sao vinculadas como?",
                 ["Por vistoria_id",
                  "Por vistorias_itens.despesa_id (item especifico)",
                  "Sem vinculo",
                  "Por imovel_id"],
                 1, "Item especifico fica linkado pra rastreabilidade e bloqueio de remocao.", 10),
                ("Qual e o status default ao criar despesa?",
                 ["aprovada", "executada", "orcamento", "paga"],
                 2, "Sempre comeca como orcamento - aguardando voce enviar pra aprovacao.", 15),
            ],
        )],
    },

    "vistorias": {
        "textos": [(
            "Vistorias - Entrada, Saida e Fotos",
            """# Vistorias

Laudo formal do estado do imovel na **entrada** (locatario pegando as
chaves) e na **saida** (devolvendo). Documento essencial juridicamente.

## Tipos

- entrada
- saida

## Vinculos

- `imovel_id` - **OBRIGATORIO** (vinculo primario)
- `contrato_id` - **OPCIONAL** (permite vistoria pre-locacao ou avulsa)

## Status

- rascunho
- aguardando_assinatura (apos enviar pra ZapSign)
- assinada (todos assinaram)
- contestada
- finalizada

## Editor (cards)

1. **Imovel & Contrato** - imovel obrigatorio, contrato opcional. Ao escolher contrato, auto-popula locador/locatario via `contratos_partes`.
2. **Tipo & Estado Geral** - inclui botao **Capturar localizacao GPS**
3. **Locador / Locatario** (snapshot editavel)
4. **Avariados detectados** (quando ha) - botao **Criar despesas em lote**
5. **Checklist por Comodo** - itens com estado: otimo / bom / regular / ruim / avariado
6. **Fotos da Vistoria** (galeria geral, separada de itens)

## Galeria de fotos com WebP

A galeria usa `<VistoriaFotosSection>`:

- Upload multiplo
- **Compressao WebP automatica** (max 1600px, qualidade 0.85)
- Reorder + legenda inline
- Preview lightbox
- Toast mostra economia: "5 fotos - economizou 12.3MB de 18.7MB"
- Bucket: `vistorias`

## Avariados -> Despesas

Quando um item tem estado **ruim** ou **avariado**:

- Botao "Criar despesa" individual (no item)
- Botao "Criar despesas em lote" (todos de uma vez no card)
- Pre-popula:
  - tipo='manutencao'
  - status='orcamento'
  - quem_paga: entrada->locador / saida->locatario

## ZapSign

Botao "Enviar pra Assinar" usa edge `vistoria-zapsign-send`:

- Signatarios: locatario + locador (sempre) + responsavel (opcional)
- PDF base64 gerado com `gerarPdfBase64Vistoria` (jsPDF)
- Apos envio: status='aguardando_assinatura'

## PDF impresso

`printVistoria()` gera HTML com identidade dos contratos
(`contratoStyle.css`), com fotos inline (32x24mm), badges de estado
e bloco de assinaturas.""",
            70,
        )],
        "quizes": [(
            "Quiz: Vistorias",
            80,
            [
                ("E obrigatorio ter contrato pra criar uma vistoria?",
                 ["Sim, sempre",
                  "Nao, contrato_id e opcional - imovel_id e o vinculo primario",
                  "So pra vistoria de saida",
                  "Sim, exceto pre-locacao"],
                 1, "imovel_id e obrigatorio; contrato_id e opcional para permitir vistoria pre-locacao/avulsa.", 15),
                ("Em que formato as fotos sao salvas?",
                 ["JPEG original", "PNG original",
                  "WebP comprimido (max 1600px, qualidade 0.85)", "RAW"],
                 2, "WebP economiza ~30% versus JPEG mantendo qualidade visual.", 15),
                ("O que acontece quando voce clica em 'Criar despesas em lote' no card de avariados?",
                 ["Cria 1 despesa por item avariado, vinculada via vistorias_itens.despesa_id",
                  "Cria 1 despesa total",
                  "Manda email pro locador",
                  "Abre o editor de contrato"],
                 0, "Cada item gera sua propria despesa rastreavel.", 15),
                ("Quem assina a vistoria via ZapSign por padrao?",
                 ["So o locatario",
                  "Locatario + locador (sempre) + responsavel (opcional)",
                  "Apenas o responsavel",
                  "Locador + sindico"],
                 1, "vistoria-zapsign-send adiciona os 2 signatarios principais + opcional responsavel.", 15),
                ("Em vistoria de SAIDA, despesas auto-criadas tem quem_paga = ?",
                 ["locador", "locatario", "imobiliaria", "depende"],
                 1, "Saida = locatario causou as avarias durante a locacao. Entrada = locador (estado anterior).", 10),
                ("Onde fica a opcao de excluir uma foto da galeria?",
                 ["Nao da pra excluir",
                  "Botao vermelho com icone de lixeira no canto superior direito da foto",
                  "So apaga o registro inteiro",
                  "Email pro suporte"],
                 1, "Botoes mover/excluir ficam visiveis no canto da thumbnail.", 10),
            ],
        )],
    },
}


# ----- INSERIR -----

count_aulas = 0
count_questoes = 0

for key, modulo_id in MODULOS.items():
    bloco = CONTEUDO.get(key)
    if not bloco:
        continue
    ordem = 1
    # Aulas de texto
    for titulo, conteudo, pontos in bloco.get("textos", []):
        sql = (
            "INSERT INTO aulas (modulo_id, titulo, tipo, conteudo, ordem, pontos, ativo) VALUES ("
            f"{sql_str(modulo_id)}, {sql_str(titulo)}, 'conteudo', {sql_str(conteudo)}, {ordem}, {pontos}, true) "
            "RETURNING id"
        )
        run_sql(sql)
        ordem += 1
        count_aulas += 1
    # Aulas de quiz
    for titulo, pontos, questoes in bloco.get("quizes", []):
        sql = (
            "INSERT INTO aulas (modulo_id, titulo, tipo, conteudo, ordem, pontos, ativo) VALUES ("
            f"{sql_str(modulo_id)}, {sql_str(titulo)}, 'avaliacao', '', {ordem}, {pontos}, true) "
            "RETURNING id"
        )
        ret = run_sql(sql)
        aula_id = json.loads(ret)[0]["id"]
        ordem += 1
        count_aulas += 1
        # Questoes
        q_ordem = 1
        for enun, opcoes, correta_idx, expl, pts in questoes:
            sql_q = (
                "INSERT INTO questoes (aula_id, tipo, enunciado, opcoes, resposta_correta, explicacao, pontos, ordem) VALUES ("
                f"{sql_str(aula_id)}, 'multipla_escolha', {sql_str(enun)}, {jsonb(opcoes)}::jsonb, {jsonb(correta_idx)}::jsonb, {sql_str(expl)}, {pts}, {q_ordem})"
            )
            run_sql(sql_q)
            q_ordem += 1
            count_questoes += 1

print(f"Aulas: {count_aulas} | Questoes: {count_questoes}")
