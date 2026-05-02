export const TEMPLATE_COMPRA_VENDA = `# CONTRATO DE COMPRA E VENDA DE BEM IMÓVEL

**Contrato nº {{venda.numero}}**

Pelo presente instrumento particular, na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, o presente **Contrato Particular de Compra e Venda de Bem Imóvel**, regido pelos arts. 481 a 532 do **Código Civil Brasileiro**, e pelas cláusulas e condições adiante estipuladas.

---

## DAS PARTES

**VENDEDOR(A):** {{vendedor.nome}}, {{vendedor.nacionalidade}}, {{vendedor.estado_civil}}, {{vendedor.profissao}}, portador(a) do RG nº {{vendedor.rg}} e inscrito(a) no CPF/CNPJ sob o nº {{vendedor.cpf_cnpj}}, residente e domiciliado(a) à {{vendedor.endereco_completo}}, e-mail {{vendedor.email}}, telefone {{vendedor.telefone}}.

**COMPRADOR(A):** {{comprador.nome}}, {{comprador.nacionalidade}}, {{comprador.estado_civil}}, {{comprador.profissao}}, portador(a) do RG nº {{comprador.rg}} e inscrito(a) no CPF/CNPJ sob o nº {{comprador.cpf_cnpj}}, residente e domiciliado(a) à {{comprador.endereco_completo}}, e-mail {{comprador.email}}, telefone {{comprador.telefone}}.

**INTERMEDIADORA:** {{imobiliaria.nome}}, inscrita no CNPJ sob o nº {{imobiliaria.cnpj}}, com sede em {{imobiliaria.endereco}}, registrada no CRECI competente, na qualidade de imobiliária responsável pela intermediação do presente negócio.

---

## CLÁUSULA 1ª — DO OBJETO

1.1. O VENDEDOR vende ao COMPRADOR, que adquire, livre e desembaraçado de quaisquer ônus, gravames, dívidas, hipotecas ou alienações fiduciárias, o imóvel cadastrado sob o código **{{imovel.codigo}}** ("{{imovel.titulo}}"), tipo **{{imovel.tipo}}**, situado à **{{imovel.endereco_completo}}**, com área total de {{imovel.area_total}} e área construída de {{imovel.area_construida}}, contendo {{imovel.quartos}} quartos, {{imovel.banheiros}} banheiros e {{imovel.vagas}} vagas de garagem.

1.2. O imóvel objeto deste contrato encontra-se devidamente registrado na **Matrícula nº {{imovel.matricula}}** do Cartório de Registro de Imóveis competente.

1.3. O VENDEDOR declara que o imóvel está quite de todos os tributos, taxas, condomínio e demais encargos até a data deste contrato, e se compromete a apresentar as respectivas certidões negativas de débitos.

## CLÁUSULA 2ª — DO PREÇO E FORMA DE PAGAMENTO

2.1. O preço total e definitivo da presente compra e venda é de **R$ {{venda.valor_venda_fmt}} ({{venda.valor_venda_extenso}})**, a ser pago pelo COMPRADOR na seguinte forma:

(a) **Sinal e princípio de pagamento:** R$ {{venda.valor_sinal_fmt}}, neste ato, mediante {{venda.forma_sinal}};

(b) **Saldo:** R$ {{venda.valor_saldo_fmt}}, na seguinte forma: {{venda.forma_saldo}}.

2.2. Em havendo financiamento bancário, este será obtido pelo COMPRADOR junto à instituição **{{venda.banco_financiamento}}**, no valor de **R$ {{venda.valor_financiado_fmt}}**, em **{{venda.parcelas_qtd}} parcelas**, sendo a aprovação do crédito **condição suspensiva** deste contrato.

2.3. Todos os pagamentos serão efetuados por meio de **boleto bancário, PIX ou transferência eletrônica** disponibilizados pela {{imobiliaria.nome}}, valendo o respectivo comprovante como recibo de quitação.

## CLÁUSULA 3ª — DA POSSE E IMISSÃO

3.1. A posse do imóvel será transmitida ao COMPRADOR na data de **{{venda.data_imissao}}**, mediante a quitação integral do preço ou conforme previamente pactuado em adendo.

3.2. A partir da imissão na posse, todas as despesas relacionadas ao imóvel (IPTU, condomínio, consumos, conservação) passam a ser de responsabilidade do COMPRADOR.

## CLÁUSULA 4ª — DA ESCRITURA DEFINITIVA E REGISTRO

4.1. Quitado integralmente o preço, ou aprovado o financiamento bancário, o VENDEDOR obriga-se a outorgar ao COMPRADOR a **Escritura Pública de Compra e Venda** em até **30 (trinta) dias**, comparecendo em Tabelionato de Notas previamente acordado.

4.2. Todas as despesas relativas à **Escritura, ITBI (Imposto sobre Transmissão de Bens Imóveis), Registro Imobiliário, Certidões e demais emolumentos** ficam a cargo do **COMPRADOR**, salvo disposição em contrário neste contrato.

4.3. O COMPRADOR obriga-se a providenciar o **registro da Escritura** junto ao Cartório de Registro de Imóveis competente, em até **30 (trinta) dias** da assinatura do título translativo, sob pena de não produzir efeitos contra terceiros.

## CLÁUSULA 5ª — DAS DECLARAÇÕES DO VENDEDOR

5.1. O VENDEDOR declara, sob as penas da lei, que:

(a) é o legítimo proprietário do imóvel objeto deste contrato;
(b) o imóvel está livre e desembaraçado de todo e qualquer ônus, gravame, hipoteca, alienação fiduciária, penhora, arresto ou litígio;
(c) está em dia com todos os tributos e taxas incidentes sobre o imóvel;
(d) não há ações reais ou pessoais reipersecutórias que possam comprometer o domínio do imóvel;
(e) compromete-se a entregar, no ato da escritura, as **Certidões Negativas Pessoais** (Justiça Federal, Estadual, Trabalhista, Receita Federal) e do **Imóvel** (matrícula atualizada, IPTU quitado, certidão de não débitos condominiais), com prazo de validade não superior a 30 dias.

## CLÁUSULA 6ª — DAS CONDIÇÕES DO IMÓVEL

6.1. O COMPRADOR declara ter **vistoriado pessoalmente** o imóvel, conhecendo suas atuais condições de conservação, acabamentos e instalações, recebendo-o no estado em que se encontra, sem direito a futuras reclamações.

6.2. Móveis, eletrodomésticos e demais bens que permanecem ou não no imóvel estão descritos no **Anexo I — Inventário**, parte integrante deste contrato.

## CLÁUSULA 7ª — DA INTERMEDIAÇÃO E COMISSÃO

7.1. O presente negócio jurídico foi intermediado pela **{{imobiliaria.nome}}**, mediante autorização de venda outorgada pelo VENDEDOR.

7.2. A **comissão de corretagem** de **{{venda.comissao_total_pct}}%** sobre o valor total da venda, equivalente a **R$ {{venda.comissao_total_valor_fmt}}**, é devida pelo **{{venda.comissao_pago_por}}** à intermediadora, e será paga {{venda.condicao_comissao}}.

7.3. As partes reconhecem que a comissão é devida ainda que, após a aceitação da proposta, qualquer das partes se arrependa, nos termos do art. 725 do Código Civil.

## CLÁUSULA 8ª — DA RESCISÃO E PENALIDADES

8.1. A rescisão do presente contrato por inadimplemento de qualquer das partes sujeitará a parte inadimplente ao pagamento de **multa equivalente a 20% (vinte por cento) do valor total** da operação, sem prejuízo de perdas e danos efetivamente comprovados.

8.2. Não aprovado o financiamento bancário previsto na Cláusula 2.2, e desde que o COMPRADOR tenha agido com diligência razoável na obtenção do crédito, o presente contrato resolver-se-á sem aplicação da multa do item 8.1, devolvendo-se ao COMPRADOR os valores já pagos, atualizados monetariamente, com retenção de até 10% a título de despesas administrativas.

8.3. Constituem também causas de rescisão imediata: (a) descobrimento de ônus, gravame ou irregularidade não declarada que impeça a transferência de propriedade; (b) inadimplência reiterada do COMPRADOR no cumprimento das parcelas pactuadas; (c) recusa injustificada do VENDEDOR em outorgar a escritura definitiva quando preenchidas as condições contratuais.

## CLÁUSULA 9ª — DA REFORMA TRIBUTÁRIA

9.1. As partes reconhecem que, a partir de **1º de janeiro de 2026**, em razão da Lei Complementar nº 214/2025 e da EC 132/2023, as operações imobiliárias podem ser objeto de **IBS e CBS**, observado o regime de transição. Eventuais tributos incidentes sobre a presente operação serão suportados conforme **regra geral**: o **VENDEDOR** suporta tributos sobre o ganho de capital (IR), e o **COMPRADOR** suporta tributos relacionados à transmissão (ITBI e novos tributos sobre aquisição, se devidos), salvo estipulação diversa.

9.2. As partes obrigam-se a renegociar de boa-fé, mediante aditivo, qualquer alteração relevante da carga tributária supervenente que afete o equilíbrio econômico-financeiro originalmente pactuado.

## CLÁUSULA 10 — DA ASSINATURA ELETRÔNICA

10.1. As partes reconhecem expressamente, com fundamento na **MP nº 2.200-2/2001** e na **Lei nº 14.063/2020**, a plena validade jurídica e força probante da assinatura deste contrato e seus aditivos por meio eletrônico, em quaisquer das modalidades legais.

10.2. Os logs de auditoria da plataforma utilizada pela {{imobiliaria.nome}} (data, hora, IP, hash, geolocalização) constituem prova suficiente da manifestação de vontade.

## CLÁUSULA 11 — DA PROTEÇÃO DE DADOS (LGPD)

11.1. As partes obrigam-se ao tratamento dos dados pessoais e empresariais relativos a este contrato em conformidade com a **Lei nº 13.709/2018 (LGPD)**, restringindo seu uso às finalidades de execução, registro, cobrança e cumprimento de obrigações legais.

## CLÁUSULA 12 — DAS DISPOSIÇÕES GERAIS

12.1. O presente contrato e seus aditivos constituem **título executivo extrajudicial** (art. 784, II, do CPC).

12.2. O presente contrato vincula as partes, seus herdeiros e sucessores, a qualquer título.

12.3. A nulidade de qualquer cláusula não prejudicará as demais.

12.4. Eventuais comunicações entre as partes serão consideradas válidas quando enviadas aos endereços físicos ou eletrônicos constantes do preâmbulo.

## CLÁUSULA 13 — DO FORO

13.1. Fica eleito o **Foro da Comarca de {{cidade.foro}}**, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir as questões oriundas deste contrato.

---

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento, de forma física ou eletrônica, em via única de igual teor e forma, com as testemunhas abaixo.

**{{cidade.foro}}, {{venda.data_assinatura}}.**


_________________________________________
**VENDEDOR(A):** {{vendedor.nome}}
CPF/CNPJ: {{vendedor.cpf_cnpj}}


_________________________________________
**COMPRADOR(A):** {{comprador.nome}}
CPF/CNPJ: {{comprador.cpf_cnpj}}


_________________________________________
**INTERMEDIADORA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}}


**TESTEMUNHAS:**

1. ____________________________  Nome: __________________  CPF: __________________

2. ____________________________  Nome: __________________  CPF: __________________
`
