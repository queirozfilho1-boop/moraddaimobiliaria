# Dicionário-Mestre de Placeholders — Templates de Contrato Moradda

Este documento lista **todos** os placeholders (`{{entidade.campo}}`) utilizados pelos
templates de contrato da Moradda Imobiliária. Seu objetivo é garantir **nomenclatura
unificada** entre os 6 contratos (Residencial, Comercial, Temporada, Compra & Venda,
Captação Exclusiva, Administração) e o template de Associação com Corretor.

## Regras gerais de nomenclatura

1. **Sempre** use prefixo da entidade. Nunca use placeholder solto (ex.: `{{nome}}` é
   inválido — use `{{locador.nome}}`, `{{vendedor.nome}}`, etc.).
2. **Nunca** use `{{papel.cpf}}` solto — sempre `{{papel.cpf_cnpj}}`. O motor de merge
   resolve ambos para o mesmo valor por compatibilidade reversa, mas o nome canônico
   é `cpf_cnpj`.
3. **Nunca** use `{{imobiliaria.endereco}}` ou `{{papel.endereco}}` (sem qualificação) —
   sempre `{{imobiliaria.endereco_completo}}` / `{{papel.endereco_completo}}`. O
   primeiro é alias mantido para compatibilidade, mas seu uso em templates novos é
   desencorajado.
4. **Tudo** que é específico do contrato (valores, datas, prazos) vai sob o
   prefixo `contrato.*`. Não há `venda.*`, `locacao.*` (exceto quando se trata de
   parâmetros operacionais especificamente locatícios — IPTU, índice etc.) nem
   `temporada.*` na nomenclatura canônica. Aliases reversos existem (ver §
   "Aliases").

---

## 1. Contrato (`contrato.*`)

| Placeholder | Tipo | Exemplo |
|---|---|---|
| `{{contrato.numero}}` | string | `2026-0042` |
| `{{contrato.data_emissao}}` | data PT-BR | `02/05/2026` |
| `{{contrato.data_inicio}}` | data PT-BR | `01/06/2026` |
| `{{contrato.data_fim}}` | data PT-BR | `31/05/2027` |
| `{{contrato.prazo_meses}}` | número | `12` |
| `{{contrato.prazo_extenso}}` | string | `doze` |
| `{{contrato.dia_vencimento}}` | número 1-31 | `5` |

### 1.1. Locação (subset)

| Placeholder | Exemplo |
|---|---|
| `{{contrato.valor_aluguel}}` | `2.500,00` |
| `{{contrato.valor_aluguel_fmt}}` | `R$ 2.500,00` |
| `{{contrato.valor_aluguel_extenso}}` | `R$ 2.500 reais` |
| `{{contrato.valor_condominio}}` | `350,00` |
| `{{contrato.valor_iptu}}` | `120,00` |
| `{{contrato.valor_outros}}` | `0,00` |
| `{{contrato.indice_reajuste}}` | `IGP-M` |
| `{{contrato.multa_atraso_pct}}` | `2` |
| `{{contrato.juros_dia_pct}}` | `0.033` |
| `{{contrato.multa_rescisao_meses}}` | `3` |
| `{{contrato.ramo_atividade}}` | `Comércio varejista` (apenas comercial) |

### 1.2. Compra & Venda (subset)

| Placeholder | Exemplo |
|---|---|
| `{{contrato.valor_venda_fmt}}` | `R$ 450.000,00` |
| `{{contrato.valor_venda_extenso}}` | `R$ 450.000 reais` |
| `{{contrato.valor_sinal_fmt}}` | `R$ 45.000,00` |
| `{{contrato.valor_sinal_extenso}}` | `R$ 45.000 reais` |
| `{{contrato.valor_saldo_fmt}}` | `R$ 405.000,00` |
| `{{contrato.valor_financiado_fmt}}` | `R$ 405.000,00` |
| `{{contrato.banco_financiamento}}` | `Banco do Brasil` |
| `{{contrato.parcelas_qtd}}` | `360` |
| `{{contrato.valor_itbi}}` | `R$ 9.000,00` |
| `{{contrato.valor_cartorio}}` | `R$ 4.500,00` |
| `{{contrato.data_escritura}}` | `01/07/2026` |
| `{{contrato.data_registro}}` | `15/07/2026` |
| `{{contrato.data_imissao}}` | `01/06/2026` |
| `{{contrato.forma_sinal}}` | `transferência PIX em favor do VENDEDOR` |
| `{{contrato.forma_saldo}}` | `30 (trinta) parcelas mensais via boleto` |
| `{{contrato.comissao_total_pct}}` | `6` |
| `{{contrato.comissao_total_valor_fmt}}` | `R$ 27.000,00` |
| `{{contrato.comissao_pago_por}}` | `VENDEDOR` |
| `{{contrato.condicao_comissao}}` | `no ato da assinatura da escritura` |
| `{{contrato.arras_natureza}}` | `confirmatórias` (ou `penitenciais`) |

### 1.3. Captação Exclusiva (subset)

| Placeholder | Exemplo |
|---|---|
| `{{captacao.modalidade}}` | `VENDA` / `LOCAÇÃO` / `VENDA E LOCAÇÃO` |
| `{{captacao.valor_venda}}` | `450.000,00` |
| `{{captacao.valor_venda_extenso}}` | `quatrocentos e cinquenta mil reais` |
| `{{captacao.valor_locacao}}` | `2.500,00` |
| `{{captacao.margem_negociacao_percentual}}` | `5` |
| `{{captacao.prazo_exclusividade_meses}}` | `6` |
| `{{captacao.prazo_exclusividade_extenso}}` | `seis` |
| `{{captacao.prazo_exclusividade_dias}}` | `180` |
| `{{captacao.numero_minimo_fotos}}` | `15` |
| `{{captacao.taxa_devolucao_material}}` | `200,00` |
| `{{captacao.multa_quebra_percentual}}` | `30` |
| `{{captacao.prazo_protecao_dias}}` | `180` |
| `{{captacao.prazo_protecao_extenso}}` | `cento e oitenta` ← **NOVO** |

### 1.4. Associação com Corretor (subset)

| Placeholder | Exemplo |
|---|---|
| `{{contrato.comissao_venda_pct}}` | `6` |
| `{{contrato.comissao_temporada_pct}}` | `30` |
| `{{contrato.dia_pagamento_comissao}}` | `10` |
| `{{contrato.aviso_previo_dias}}` | `30` |
| `{{contrato.multa_lgpd_valor}}` | `10.000,00` |

### 1.5. Comuns Locação (`locacao.*`) — apenas parâmetros operacionais

| Placeholder | Exemplo / Domínio |
|---|---|
| `{{locacao.iptu_responsavel}}` | `LOCATÁRIO` ou `LOCADOR` ← **NOVO** |
| `{{locacao.indice_reajuste}}` | `IGP-M` (alias de `contrato.indice_reajuste`) |
| `{{locacao.multa_atraso_pct}}` | `10` (alias de `contrato.multa_atraso_pct`) |
| `{{locacao.juros_dia_pct}}` | `0.033` |
| `{{locacao.multa_rescisao_meses}}` | `3` |
| `{{locacao.avcb_status}}` | `regular` / `pendente` / `dispensado` ← **NOVO/Comercial e Residencial opcional** |
| `{{locacao.seguro_rc_status}}` | `contratado` / `não contratado` ← **NOVO/opcional** |

---

## 2. Imóvel (`imovel.*`)

| Placeholder | Exemplo |
|---|---|
| `{{imovel.codigo}}` | `MOR-0042` |
| `{{imovel.titulo}}` | `Apartamento 2 quartos no Paraíso` |
| `{{imovel.tipo}}` | `Apartamento` |
| `{{imovel.endereco_completo}}` | `R Dom Bosco, nº 163, ap. 201, bairro Paraíso, Resende/RJ, CEP 27535-070` |
| `{{imovel.matricula}}` | `12.345` |
| `{{imovel.cartorio}}` | `1º Ofício de Registro de Imóveis de Resende` |
| `{{imovel.inscricao_iptu}}` | `01.234.567.8` *(canônico — substitui `imovel.iptu`)* |
| `{{imovel.area_total}}` | `120 m²` |
| `{{imovel.area_construida}}` | `90 m²` |
| `{{imovel.area_privativa}}` | `78 m²` |
| `{{imovel.quartos}}` | `2` |
| `{{imovel.suites}}` | `1` |
| `{{imovel.banheiros}}` | `2` |
| `{{imovel.vagas}}` | `1` |
| `{{imovel.vagas_garagem}}` | alias de `imovel.vagas` |
| `{{imovel.descricao_caracteristicas}}` | texto livre |
| `{{imovel.itens_inclusos}}` | texto livre |

> **Atenção:** o nome canônico do IPTU é `{{imovel.inscricao_iptu}}`. O alias
> `{{imovel.iptu}}` continua resolvido pelo merge para compatibilidade com
> contratos antigos, mas templates novos devem usar o nome canônico.

---

## 3. Imobiliária (`imobiliaria.*`)

| Placeholder | Exemplo |
|---|---|
| `{{imobiliaria.nome}}` | `Moradda Empreendimentos Imobiliários LTDA` |
| `{{imobiliaria.cnpj}}` | `47.527.793/0001-65` |
| `{{imobiliaria.creci}}` | `RJ 10404` |
| `{{imobiliaria.endereco_completo}}` | endereço da sede |
| `{{imobiliaria.email}}` | `contato@moraddaimobiliaria.com.br` |
| `{{imobiliaria.telefone}}` | `(24) 99857-1528` |
| `{{imobiliaria.email_dpo}}` | `dpo@moraddaimobiliaria.com.br` |
| `{{imobiliaria.dpo_nome}}` | `Sebastião Queiroz` |
| `{{imobiliaria.responsavel_tecnico}}` | `Sebastião Queiroz` |
| `{{imobiliaria.responsavel_creci}}` | `RJ 10404-F` |

> O alias `{{imobiliaria.endereco}}` é mantido por compatibilidade, mas templates
> novos devem usar `endereco_completo`.

---

## 4. Partes (papéis)

Cada papel abaixo expõe o **mesmo conjunto de subcampos**:

- `nome`, `cpf_cnpj`, `cpf` (alias reverso de `cpf_cnpj`), `rg`, `creci` (quando aplicável)
- `nacionalidade`, `estado_civil`, `profissao`
- `email`, `telefone`, `endereco_completo`
- `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep` (componentes brutos)

### Papéis disponíveis

| Papel | Uso típico |
|---|---|
| `locador` | Locação Residencial / Comercial / Temporada |
| `locatario` | idem |
| `fiador` | idem (quando há fiança) |
| `vendedor` | Compra & Venda |
| `comprador` | Compra & Venda |
| `proprietario` | Captação Exclusiva, Administração (alias de `locador` quando este for o proprietário) |
| `corretor` | Associação Profissional, Captação |
| `hospede` | Temporada |
| `testemunha1`, `testemunha2` | Todos |

### Subcampos extras de `proprietario.*` (Captação)

| Placeholder | Exemplo |
|---|---|
| `{{proprietario.conjuge_nome}}` | exigida outorga conjugal |
| `{{proprietario.conjuge_cpf}}` | idem |

### Subcampos extras de `locatario.*` (Comercial — PJ)

| Placeholder | Exemplo |
|---|---|
| `{{locatario.razao_social}}` | `Acme S.A.` |
| `{{locatario.nome_fantasia}}` | `Acme Store` |
| `{{locatario.cnpj}}` | alias de `cpf_cnpj` |
| `{{locatario.ie}}` | inscrição estadual |
| `{{locatario.im}}` | inscrição municipal |
| `{{locatario.cnae}}` | atividade |
| `{{locatario.representante}}` | nome do representante legal |
| `{{locatario.representante_cpf}}` | CPF do representante |
| `{{locatario.representante_cargo}}` | cargo |

---

## 5. Cidade / Foro

| Placeholder | Exemplo |
|---|---|
| `{{cidade.foro}}` | `Resende-RJ` |

---

## 6. Aliases reversos (compatibilidade)

Para não quebrar contratos antigos já gerados/armazenados, o motor de merge
(`contratoMerge.ts`) aceita os seguintes aliases que **resolvem para o nome
canônico**:

| Alias antigo | Resolve para |
|---|---|
| `{{venda.numero}}` | `{{contrato.numero}}` |
| `{{venda.valor_venda_fmt}}` | `{{contrato.valor_venda_fmt}}` |
| `{{venda.valor_venda_extenso}}` | `{{contrato.valor_venda_extenso}}` |
| `{{venda.valor_sinal_fmt}}` | `{{contrato.valor_sinal_fmt}}` |
| `{{venda.valor_saldo_fmt}}` | `{{contrato.valor_saldo_fmt}}` |
| `{{venda.valor_financiado_fmt}}` | `{{contrato.valor_financiado_fmt}}` |
| `{{venda.banco_financiamento}}` | `{{contrato.banco_financiamento}}` |
| `{{venda.parcelas_qtd}}` | `{{contrato.parcelas_qtd}}` |
| `{{venda.data_imissao}}` | `{{contrato.data_imissao}}` |
| `{{venda.data_assinatura}}` | `{{contrato.data_emissao}}` |
| `{{venda.forma_sinal}}` | `{{contrato.forma_sinal}}` |
| `{{venda.forma_saldo}}` | `{{contrato.forma_saldo}}` |
| `{{venda.comissao_total_pct}}` | `{{contrato.comissao_total_pct}}` |
| `{{venda.comissao_total_valor_fmt}}` | `{{contrato.comissao_total_valor_fmt}}` |
| `{{venda.comissao_pago_por}}` | `{{contrato.comissao_pago_por}}` |
| `{{venda.condicao_comissao}}` | `{{contrato.condicao_comissao}}` |
| `{{contrato.data_assinatura}}` | `{{contrato.data_emissao}}` |
| `{{contrato.data_termino}}` | `{{contrato.data_fim}}` |
| `{{contrato.prazo_exclusividade_dias}}` | derivado de `prazo_exclusividade_meses` |
| `{{contrato.prazo_exclusividade_extenso}}` | derivado |
| `{{imovel.iptu}}` | `{{imovel.inscricao_iptu}}` |
| `{{imobiliaria.endereco}}` | `{{imobiliaria.endereco_completo}}` |
| `{{papel.cpf}}` | `{{papel.cpf_cnpj}}` |
