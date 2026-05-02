export const TEMPLATE_ASSOCIACAO_CORRETOR = `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CORRETAGEM IMOBILIÁRIA / ASSOCIAÇÃO PROFISSIONAL

**Contrato nº {{contrato.numero}}**

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas, têm entre si, justo e contratado, o presente **Contrato de Prestação de Serviços de Corretagem Imobiliária**, regido pelos arts. 722 a 729 do **Código Civil Brasileiro**, pela **Lei nº 6.530/1978** (regulamenta a profissão de Corretor de Imóveis) e pelo **Decreto nº 81.871/1978**, **sem qualquer caráter de vínculo empregatício**, nas seguintes cláusulas:

---

## DAS PARTES

**IMOBILIÁRIA / CONTRATANTE:** {{imobiliaria.nome}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{imobiliaria.cnpj}}, com sede em {{imobiliaria.endereco}}, devidamente registrada no **CRECI nº {{imobiliaria.creci}}**, neste ato representada na forma de seu contrato social.

**CORRETOR(A) / CONTRATADO(A):** {{corretor.nome}}, {{corretor.nacionalidade}}, {{corretor.estado_civil}}, **profissional autônomo**, devidamente inscrito(a) no **CRECI nº {{corretor.creci}}**, portador(a) do RG nº {{corretor.rg}}, inscrito(a) no CPF sob o nº {{corretor.cpf_cnpj}}, residente e domiciliado(a) à {{corretor.endereco_completo}}, e-mail {{corretor.email}}, telefone {{corretor.telefone}}.

---

## CLÁUSULA 1ª — DO OBJETO

1.1. O CORRETOR obriga-se a prestar à IMOBILIÁRIA, em caráter **autônomo, eventual, sem subordinação, sem habitualidade e sem onerosidade prévia**, **serviços de mediação imobiliária**, consistentes em aproximação útil de partes interessadas em compra, venda, locação, permuta ou administração de bens imóveis, nos termos do art. 722 do Código Civil.

1.2. O CORRETOR atuará exclusivamente na **captação, divulgação, intermediação e fechamento** de negócios imobiliários sob a estrutura, marca e gestão da IMOBILIÁRIA, observando o **Código de Ética Profissional dos Corretores de Imóveis** (Resolução COFECI nº 326/1992) e as normas dos Conselhos Federal e Regional.

## CLÁUSULA 2ª — DA NATUREZA JURÍDICA E DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO

2.1. As partes reconhecem expressamente que o presente contrato é regido pela legislação **civil**, não havendo entre as partes **qualquer relação trabalhista, previdenciária ou hierárquica**, nos exatos termos do art. 6º da Lei nº 6.530/1978 e do art. 4º, parágrafo único, da CLT, ressalvando-se a profissão regulamentada do CORRETOR.

2.2. O CORRETOR declara expressamente que:
(a) atua **por conta própria**, com **liberdade de horários, organização da agenda, escolha dos imóveis e clientes**, sem subordinação a chefia ou a controle de jornada;
(b) é **responsável pelos próprios tributos** (ISS sobre comissão, IRPF/IRPJ, INSS na qualidade de contribuinte autônomo);
(c) **arca com as próprias despesas** de combustível, telefone, alimentação, vestuário e materiais de divulgação;
(d) reconhece que **não tem direito** a 13º salário, férias remuneradas, FGTS, repouso semanal remunerado ou quaisquer verbas trabalhistas, declaração que é da essência deste contrato e fundamento dele.

2.3. A eventual **utilização de espaço físico, ferramentas de TI, sistemas de gestão, leads e plantões** disponibilizados pela IMOBILIÁRIA não descaracteriza a autonomia do CORRETOR, sendo mera estrutura colocada à disposição dos profissionais associados, podendo ser cobrada taxa de uso conforme política interna.

## CLÁUSULA 3ª — DAS OBRIGAÇÕES DO CORRETOR

3.1. Constituem obrigações do CORRETOR:
(a) Manter regular o registro no **CRECI** durante toda a vigência deste contrato, inclusive com o pagamento das anuidades;
(b) **Captar** imóveis para venda e locação, mediante outorga regular de **Autorização de Venda/Locação** (com ou sem exclusividade) pelos proprietários;
(c) **Divulgar** os imóveis somente sob a marca, padrões visuais e canais oficiais da IMOBILIÁRIA, **vedada divulgação concorrente em nome próprio ou de terceiros**;
(d) Atender, com diligência, ética, urbanidade e tempestividade, todos os leads e clientes encaminhados pela IMOBILIÁRIA;
(e) **Realizar visitas** acompanhadas, vistorias, avaliações e demais atos materiais necessários ao fechamento dos negócios;
(f) Apresentar **propostas, contraprostas e fechamentos** de forma documentada, mantendo registro em sistema indicado pela IMOBILIÁRIA;
(g) **Cumprir o sigilo** sobre dados de clientes, imóveis, condições negociais, bases de leads e estratégia comercial da IMOBILIÁRIA;
(h) Observar a **Lei Geral de Proteção de Dados (LGPD)** no tratamento dos dados pessoais a que tiver acesso;
(i) **Repassar integralmente à IMOBILIÁRIA** quaisquer valores recebidos diretamente em razão de negócios da IMOBILIÁRIA (sinais, taxas, comissões), sob pena de apropriação indébita.

## CLÁUSULA 4ª — DAS OBRIGAÇÕES DA IMOBILIÁRIA

4.1. Constituem obrigações da IMOBILIÁRIA:
(a) Disponibilizar ao CORRETOR estrutura, sistemas, marca e leads, conforme política interna;
(b) **Pagar pontualmente** as comissões devidas, observada a cláusula 5ª;
(c) Fornecer os meios e a documentação necessários ao desempenho da intermediação;
(d) Recolher os tributos de sua responsabilidade (não incidentes sobre a remuneração do CORRETOR autônomo);
(e) Tratar com transparência os processos de avaliação de desempenho, hierarquia de equipe e distribuição de leads.

## CLÁUSULA 5ª — DA REMUNERAÇÃO POR COMISSÃO

5.1. A remuneração do CORRETOR consiste **exclusivamente em comissões** sobre os negócios efetivamente fechados e adimplidos, calculadas conforme a tabela abaixo, **sobre o valor líquido recebido pela IMOBILIÁRIA** após deduzidos os repasses devidos a terceiros:

### **VENDA**
A IMOBILIÁRIA cobra do vendedor **{{contrato.comissao_venda_pct}}%** sobre o valor da venda.

(a) **Override do Líder** de equipe: **0,5% direto sobre o valor da venda**, descontado do total antes do split.

(b) Do valor restante (99,5%), aplica-se a seguinte distribuição:
- **CAPTADOR ≠ CORRETOR DA VENDA:** 20% pro CAPTADOR, 30% pro CORRETOR DA VENDA, 50% pra IMOBILIÁRIA;
- **CAPTADOR = CORRETOR DA VENDA:** 50% pro CORRETOR, 50% pra IMOBILIÁRIA;
- **SEM CAPTADOR INTERNO** (cliente trazido pelo Cliente Final): 30% pro CORRETOR, 70% pra IMOBILIÁRIA.

### **LOCAÇÃO**

(a) **Bônus de fechamento** (1 vez, equivalente ao valor de **1 (um) aluguel mensal** cobrado do locatário):
- Líder: 5% sobre o total
- Distribuição do restante (95%): mesma regra do split de venda (20/30/50 ou 50/50).

(b) **Recorrente mensal** sobre a **taxa de administração** cobrada do proprietário:
- **40%** pro CORRETOR responsável
- **5%** override pro LÍDER
- **55%** pra IMOBILIÁRIA

### **TEMPORADA**
30% sobre o total recebido no período, com a mesma estrutura de split aplicável a Vendas.

## CLÁUSULA 6ª — DO PAGAMENTO DAS COMISSÕES

6.1. **Vendas:** a comissão é devida **na proporção do recebimento** pela IMOBILIÁRIA, sendo paga ao CORRETOR em até **5 (cinco) dias úteis** do crédito efetivo.

6.2. **Locação:** o **bônus de fechamento** é pago em até **5 dias úteis** após o recebimento integral pela IMOBILIÁRIA. As comissões **mensais recorrentes** são pagas até o dia **{{contrato.dia_pagamento_comissao}}** de cada mês subsequente ao do vencimento da taxa de administração.

6.3. **Estorno e devolução:** caso a IMOBILIÁRIA seja obrigada, por qualquer motivo, a estornar comissão recebida ou indenizar o cliente, o CORRETOR obriga-se a **devolver, na mesma proporção**, os valores recebidos a título da operação, podendo a IMOBILIÁRIA compensar com comissões futuras.

6.4. O CORRETOR obriga-se a emitir **Recibo de Pagamento Autônomo (RPA)** ou **NFS-e** das comissões recebidas, conforme exigências fiscais aplicáveis.

## CLÁUSULA 7ª — DA CARTEIRA DE IMÓVEIS E LEADS

7.1. Os imóveis captados pelo CORRETOR e os leads recebidos por meio dos canais da IMOBILIÁRIA pertencem à **carteira da IMOBILIÁRIA**, ainda que registrados sob a responsabilidade direta do CORRETOR.

7.2. Em caso de rescisão deste contrato, **os imóveis e os clientes permanecem com a IMOBILIÁRIA**, sendo vedado ao CORRETOR levá-los para outra estrutura ou utilizá-los em proveito próprio durante e após a vigência deste instrumento.

## CLÁUSULA 8ª — DA EXCLUSIVIDADE E NÃO CONCORRÊNCIA

8.1. Durante a vigência deste contrato, o CORRETOR atuará com **exclusividade** sob a marca e estrutura da IMOBILIÁRIA, sendo-lhe vedado:
(a) intermediar negócios imobiliários para si ou para outras imobiliárias concorrentes;
(b) **captar imóveis ou clientes da IMOBILIÁRIA** em proveito próprio ou de terceiros;
(c) divulgar imóveis em nome próprio fora dos canais oficiais.

8.2. **Cláusula de não-concorrência (pós-rescisão):** por **6 (seis) meses** após o término deste contrato, o CORRETOR obriga-se a **não intermediar** negócios envolvendo imóveis ou clientes da carteira da IMOBILIÁRIA, sob pena de multa equivalente a **3 (três) vezes** o valor da comissão indevidamente captada, sem prejuízo de perdas e danos.

## CLÁUSULA 9ª — DA CONFIDENCIALIDADE E LGPD

9.1. O CORRETOR obriga-se a manter **sigilo absoluto** sobre todas as informações da IMOBILIÁRIA, dos imóveis, dos proprietários, dos clientes, das estratégias comerciais, dos preços de aquisição/venda, dos contatos e dos sistemas de gestão.

9.2. O tratamento de dados pessoais a que o CORRETOR tiver acesso fica restrito às finalidades de **execução do contrato**, sendo-lhe vedado: (a) compartilhar dados com terceiros; (b) utilizar dados após o término do contrato; (c) extrair, copiar ou manter cópias de bases de leads.

9.3. O descumprimento desta cláusula sujeita o CORRETOR a indenização por perdas e danos e a multa de **R$ 10.000,00** por evento de violação, sem prejuízo de medidas penais e civis cabíveis.

## CLÁUSULA 10 — DO PRAZO E DA RESCISÃO

10.1. O presente contrato vigora por **prazo indeterminado**, a contar da data de sua assinatura, podendo ser rescindido por qualquer das partes mediante **aviso prévio escrito de 30 (trinta) dias**, sem necessidade de justificativa.

10.2. Constituem causas de **rescisão imediata**, com justa causa e sem aviso prévio:
(a) descumprimento de cláusula contratual;
(b) violação do dever de exclusividade ou de sigilo;
(c) prática de ato que macule a imagem da IMOBILIÁRIA;
(d) suspensão ou cassação do registro CRECI do CORRETOR;
(e) prática de improbidade ou ilícito penal;
(f) reiterada inércia profissional ou descumprimento de metas mínimas previamente acordadas.

10.3. Após a rescisão, eventuais comissões pendentes referentes a negócios já fechados e em curso de pagamento permanecem devidas e serão pagas conforme cláusula 6ª.

## CLÁUSULA 11 — DAS COMUNICAÇÕES

11.1. As comunicações oficiais entre as partes serão consideradas válidas quando enviadas para os endereços físicos ou eletrônicos do preâmbulo, cabendo às partes manter atualizados tais dados.

## CLÁUSULA 12 — DA ASSINATURA ELETRÔNICA

12.1. As partes reconhecem expressamente, com fundamento na **MP nº 2.200-2/2001** e na **Lei nº 14.063/2020**, a plena validade jurídica e força probante da assinatura deste contrato e seus aditivos por meio eletrônico, em quaisquer das modalidades legais.

## CLÁUSULA 13 — DA TOLERÂNCIA E DAS DISPOSIÇÕES GERAIS

13.1. A eventual tolerância de uma parte quanto ao descumprimento de obrigações pela outra não constitui novação ou renúncia, mas mera liberalidade.

13.2. O presente contrato e seus aditivos constituem **título executivo extrajudicial** (art. 784, II, do CPC), vinculam as partes e seus sucessores.

13.3. A nulidade de qualquer cláusula não invalida as demais.

## CLÁUSULA 14 — DO FORO

14.1. Fica eleito o **Foro da Comarca de {{cidade.foro}}**, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir as questões oriundas deste contrato.

---

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento, de forma física ou eletrônica, em via única de igual teor e forma, com as testemunhas abaixo.

**{{cidade.foro}}, {{contrato.data_emissao}}.**


_________________________________________
**IMOBILIÁRIA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}}


_________________________________________
**CORRETOR(A):** {{corretor.nome}}
CPF: {{corretor.cpf_cnpj}} · CRECI: {{corretor.creci}}


**TESTEMUNHAS:**

1. ____________________________  Nome: __________________  CPF: __________________

2. ____________________________  Nome: __________________  CPF: __________________
`
