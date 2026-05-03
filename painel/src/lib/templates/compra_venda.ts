export const TEMPLATE_COMPRA_VENDA = `# CONTRATO DE COMPRA E VENDA DE BEM IMÓVEL

## PADRÃO MORADDA — INSTRUMENTO PARTICULAR

**Contrato nº {{contrato.numero}}**

---

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, o presente **Contrato Particular de Compra e Venda de Bem Imóvel**, regido pelos **arts. 481 a 532 do Código Civil**, pelos **arts. 417 a 420 do Código Civil** (arras), pelo **art. 447 e seguintes do Código Civil** (evicção), pela **Lei nº 6.015/1973** (Registros Públicos), pela **Lei nº 13.709/2018** (LGPD), pela **Lei Complementar nº 214/2025** (Reforma Tributária — IBS/CBS), pela **MP nº 2.200-2/2001** e pela **Lei nº 14.063/2020** (assinatura eletrônica), mediante intermediação da **{{imobiliaria.nome}}**, sob as cláusulas e condições seguintes.

---

## DAS PARTES

**VENDEDOR(A):** {{vendedor.nome}}, {{vendedor.nacionalidade}}, {{vendedor.estado_civil}}, {{vendedor.profissao}}, portador(a) do RG nº {{vendedor.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{vendedor.cpf_cnpj}}, residente e domiciliado(a) em {{vendedor.endereco_completo}}, e-mail {{vendedor.email}}, telefone {{vendedor.telefone}}.

**COMPRADOR(A):** {{comprador.nome}}, {{comprador.nacionalidade}}, {{comprador.estado_civil}}, {{comprador.profissao}}, portador(a) do RG nº {{comprador.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{comprador.cpf_cnpj}}, residente e domiciliado(a) em {{comprador.endereco_completo}}, e-mail {{comprador.email}}, telefone {{comprador.telefone}}.

**INTERMEDIADORA:** **{{imobiliaria.nome}}**, pessoa jurídica de direito privado, CNPJ nº {{imobiliaria.cnpj}}, **CRECI-PJ nº {{imobiliaria.creci}}**, com sede em {{imobiliaria.endereco_completo}}, e-mail {{imobiliaria.email}}, telefone {{imobiliaria.telefone}}, na qualidade de imobiliária responsável pela intermediação do presente negócio.

---

## CLÁUSULA 1ª — DAS FONTES NORMATIVAS APLICÁVEIS

**1.1.** O presente contrato rege-se, no que couber, pelas seguintes normas: **Código Civil**, em especial arts. 481 a 532 (compra e venda), 417 a 420 (arras confirmatórias e penitenciais), 447 a 457 (evicção) e 722 a 729 (corretagem); **Lei nº 6.015/1973** (Registros Públicos); **Lei nº 8.078/1990** (CDC, quando aplicável a relação de consumo); **Lei nº 13.709/2018** (LGPD); **Lei Complementar nº 214/2025** (IBS/CBS); **MP nº 2.200-2/2001** e **Lei nº 14.063/2020** (assinatura eletrônica); **Código de Processo Civil**.

---

## CLÁUSULA 2ª — DO OBJETO

**2.1.** O VENDEDOR vende ao COMPRADOR, que adquire, livre e desembaraçado de quaisquer ônus, gravames, dívidas, hipotecas ou alienações fiduciárias, o imóvel cadastrado sob o código **{{imovel.codigo}}** ("**{{imovel.titulo}}**"), tipo **{{imovel.tipo}}**, situado em **{{imovel.endereco_completo}}**, com área total **{{imovel.area_total}}** e área construída **{{imovel.area_construida}}**, contendo **{{imovel.quartos}}** quartos, **{{imovel.banheiros}}** banheiros e **{{imovel.vagas}}** vagas de garagem.

**2.2.** O imóvel objeto deste contrato encontra-se devidamente registrado na **Matrícula nº {{imovel.matricula}}** do Cartório de Registro de Imóveis de **{{imovel.cartorio}}**, com inscrição imobiliária (IPTU) nº **{{imovel.inscricao_iptu}}**.

**2.3.** O VENDEDOR declara que o imóvel está quite de todos os tributos, taxas, condomínio e demais encargos até a data deste contrato, e se compromete a apresentar as respectivas certidões negativas de débitos.

---

## CLÁUSULA 3ª — DO PREÇO E FORMA DE PAGAMENTO

**3.1.** O preço total e definitivo da presente compra e venda é de **{{contrato.valor_venda_fmt}} ({{contrato.valor_venda_extenso}})**, a ser pago pelo COMPRADOR na seguinte forma:

**3.1.1.** **Sinal e princípio de pagamento:** **{{contrato.valor_sinal_fmt}}**, neste ato, mediante **{{contrato.forma_sinal}}**;

**3.1.2.** **Saldo:** **{{contrato.valor_saldo_fmt}}**, na seguinte forma: **{{contrato.forma_saldo}}**.

**3.2.** Em havendo financiamento bancário, este será obtido pelo COMPRADOR junto à instituição **{{contrato.banco_financiamento}}**, no valor de **{{contrato.valor_financiado_fmt}}**, em **{{contrato.parcelas_qtd}} parcelas**, sendo a aprovação do crédito **condição suspensiva** deste contrato.

**3.3.** Todos os pagamentos serão efetuados por meio de **boleto bancário, PIX ou transferência eletrônica** disponibilizados pela {{imobiliaria.nome}}, valendo o respectivo comprovante como recibo de quitação.

---

## CLÁUSULA 4ª — DAS ARRAS (SINAL)

**4.1. Natureza das arras.** O sinal pago no item 3.1.1 é considerado, para todos os fins, **arras CONFIRMATÓRIAS**, nos termos do **art. 417 do Código Civil**, salvo se as partes ajustarem expressamente em sentido contrário, hipótese em que serão tratadas como **arras penitenciais** (art. 420 do CC), com efeitos do direito de arrependimento. A natureza pactuada para este contrato é: **{{contrato.arras_natureza}}**.

**4.2. Efeitos das arras confirmatórias** (regra deste contrato, salvo pactuação em contrário):

**4.2.1.** Constituem princípio de pagamento e **reforçam o vínculo obrigacional**, descontadas do preço total na conclusão do negócio;

**4.2.2.** Em caso de inexecução pelo COMPRADOR, o VENDEDOR poderá reter as arras (art. 418 do CC);

**4.2.3.** Em caso de inexecução pelo VENDEDOR, o COMPRADOR poderá exigir a devolução em dobro das arras, mais correção monetária e juros (art. 418 do CC);

**4.2.4.** A parte inocente poderá, alternativamente, exigir **execução do contrato** com indenização pelos prejuízos efetivamente comprovados, com fundamento no art. 419 do CC.

**4.3. Efeitos das arras penitenciais** (somente quando expressamente ajustadas — quando "{{contrato.arras_natureza}}" estiver expresso como **penitenciais**):

**4.3.1.** Constituem **direito de arrependimento** convencional, ao preço de perda do sinal pelo COMPRADOR ou devolução em dobro pelo VENDEDOR (art. 420 do CC);

**4.3.2.** Não cabe, neste caso, indenização suplementar.

---

## CLÁUSULA 5ª — DA POSSE E IMISSÃO

**5.1.** A posse do imóvel será transmitida ao COMPRADOR na data de **{{contrato.data_imissao}}**, mediante a quitação integral do preço ou conforme previamente pactuado em adendo.

**5.2.** A partir da imissão na posse, todas as despesas relacionadas ao imóvel (IPTU, condomínio, consumos, conservação) passam a ser de responsabilidade do COMPRADOR.

---

## CLÁUSULA 6ª — DA ESCRITURA DEFINITIVA, REGISTRO E AVERBAÇÃO

**6.1.** Quitado integralmente o preço, ou aprovado o financiamento bancário, o VENDEDOR obriga-se a outorgar ao COMPRADOR a **Escritura Pública de Compra e Venda** em até **30 (trinta) dias**, comparecendo em Tabelionato de Notas previamente acordado, na data prevista de **{{contrato.data_escritura}}**.

**6.2.** Todas as despesas relativas à **Escritura, ITBI, Registro Imobiliário, Certidões e demais emolumentos** ficam a cargo do **COMPRADOR**, salvo disposição em contrário neste contrato. Estimativas: ITBI **{{contrato.valor_itbi}}**, Cartório **{{contrato.valor_cartorio}}**.

**6.3.** O COMPRADOR obriga-se a providenciar o **registro da Escritura** junto ao Cartório de Registro de Imóveis competente, em até **30 (trinta) dias** da assinatura do título translativo, sob pena de não produzir efeitos contra terceiros (art. 1.245 do CC).

**6.4. Averbação na matrícula em pagamento parcelado.** Sempre que o pagamento for parcelado e ainda não totalmente quitado, o presente contrato — e, quando cabível, eventual **promessa de compra e venda irretratável e irrevogável** — poderá ser **averbado na matrícula** do imóvel, junto ao Cartório de Registro de Imóveis competente, na forma do art. 167, II, da Lei nº 6.015/1973, conferindo ao COMPRADOR direito real à aquisição (art. 1.417 do CC) e oponibilidade *erga omnes*. As despesas de averbação correm por conta do **COMPRADOR**.

---

## CLÁUSULA 7ª — DAS DECLARAÇÕES DO VENDEDOR

**7.1.** O VENDEDOR declara, sob as penas da lei, que:

**7.1.1.** é o legítimo proprietário do imóvel objeto deste contrato;

**7.1.2.** o imóvel está livre e desembaraçado de todo e qualquer ônus, gravame, hipoteca, alienação fiduciária, penhora, arresto ou litígio;

**7.1.3.** está em dia com todos os tributos e taxas incidentes sobre o imóvel;

**7.1.4.** não há ações reais ou pessoais reipersecutórias que possam comprometer o domínio do imóvel;

**7.1.5.** compromete-se a entregar, no ato da escritura, as **Certidões Negativas Pessoais** (Justiça Federal, Estadual, Trabalhista, Receita Federal) e do **Imóvel** (matrícula atualizada, IPTU quitado, certidão de não débitos condominiais), com prazo de validade não superior a 30 (trinta) dias.

---

## CLÁUSULA 8ª — DA EVICÇÃO (ART. 447 E SEGUINTES DO CC)

**8.1.** O **VENDEDOR responde pela evicção** (art. 447 do Código Civil), garantindo ao COMPRADOR a posse e o domínio do imóvel ora alienado contra qualquer pretensão fundada em direito anterior à venda.

**8.2.** Verificada a evicção, total ou parcial, o COMPRADOR fará jus, na forma dos arts. 450 a 453 do Código Civil, à restituição integral do preço pago, à indenização dos frutos restituídos, das despesas dos contratos e prejuízos resultantes da evicção e das custas judiciais e honorários do advogado.

**8.3.** A garantia da evicção é da essência deste contrato e **não pode ser excluída**, salvo cláusula expressa, conhecimento pelo COMPRADOR do risco e assunção formal do mesmo (art. 448 do CC), o que **não se verifica** no presente caso.

**8.4.** O COMPRADOR obriga-se a **denunciar a lide ao VENDEDOR** (art. 125 do CPC) caso seja demandado por terceiro, sob pena de perda do direito à garantia da evicção (art. 456, parágrafo único, do CC).

---

## CLÁUSULA 9ª — DAS CONDIÇÕES DO IMÓVEL

**9.1.** O COMPRADOR declara ter **vistoriado pessoalmente** o imóvel, conhecendo suas atuais condições de conservação, acabamentos e instalações, recebendo-o no estado em que se encontra, sem direito a futuras reclamações por **vícios aparentes**.

**9.2.** Quanto a **vícios ocultos** (arts. 441 a 446 do CC), o VENDEDOR responde nos termos da lei, conferindo-se ao COMPRADOR o prazo legal para o exercício dos direitos correspondentes (redibição ou abatimento do preço).

**9.3.** Móveis, eletrodomésticos e demais bens que permanecem ou não no imóvel estão descritos no **Anexo I — Inventário**, parte integrante deste contrato.

---

## CLÁUSULA 10 — DA INTERMEDIAÇÃO E COMISSÃO

**10.1.** O presente negócio jurídico foi intermediado pela **{{imobiliaria.nome}}**, mediante autorização de venda outorgada pelo VENDEDOR.

**10.2.** A **comissão de corretagem** de **{{contrato.comissao_total_pct}}%** sobre o valor total da venda, equivalente a **{{contrato.comissao_total_valor_fmt}}**, é devida pelo **{{contrato.comissao_pago_por}}** à intermediadora, e será paga **{{contrato.condicao_comissao}}**.

**10.3.** As partes reconhecem que a comissão é devida ainda que, após a aceitação da proposta, qualquer das partes se arrependa, nos termos do **art. 725 do Código Civil**.

---

## CLÁUSULA 11 — DA RESCISÃO E PENALIDADES

**11.1.** A rescisão do presente contrato por inadimplemento de qualquer das partes sujeitará a parte inadimplente ao pagamento de **multa equivalente a 20% (vinte por cento) do valor total** da operação, sem prejuízo de perdas e danos efetivamente comprovados, observado o disposto na Cláusula 4ª (arras).

**11.2.** Não aprovado o financiamento bancário previsto no item 3.2, e desde que o COMPRADOR tenha agido com diligência razoável na obtenção do crédito, o presente contrato resolver-se-á sem aplicação da multa do item 11.1, devolvendo-se ao COMPRADOR os valores já pagos, atualizados monetariamente, com retenção de até **10%** a título de despesas administrativas.

**11.3.** Constituem também causas de rescisão imediata:

**11.3.1.** descobrimento de ônus, gravame ou irregularidade não declarada que impeça a transferência de propriedade;

**11.3.2.** inadimplência reiterada do COMPRADOR no cumprimento das parcelas pactuadas;

**11.3.3.** recusa injustificada do VENDEDOR em outorgar a escritura definitiva quando preenchidas as condições contratuais.

---

## CLÁUSULA 12 — DA CLÁUSULA TRIBUTÁRIA — REFORMA TRIBUTÁRIA (IBS/CBS) E TRANSMISSÃO DE IMÓVEIS

**12.1.** As partes reconhecem que, a partir de **1º de janeiro de 2026**, em razão da **EC nº 132/2023** e da **LC nº 214/2025**, as operações imobiliárias podem ser objeto de **IBS** e **CBS**, observado o regime de transição.

**12.2.** As alíquotas, regimes específicos e regras aqui pactuadas serão **automaticamente atualizadas** conforme cronograma da LC nº 214/2025 e normas infralegais subsequentes, **sem necessidade de aditivo**, salvo se a alteração afetar o **equilíbrio econômico-financeiro** de forma relevante (art. 478 do CC).

**12.3. Regra geral de transmissão de imóveis** (distinta da locação):

**12.3.1.** O **VENDEDOR** suporta tributos sobre o **ganho de capital** (IRPF/IRPJ) e, quando contribuinte regular do IBS/CBS na atividade de incorporação/parcelamento/intermediação imobiliária habitual, o tributo correspondente sobre a operação;

**12.3.2.** O **COMPRADOR** suporta o **ITBI** (tributo municipal incidente sobre a transmissão *inter vivos*) e os emolumentos cartorários;

**12.3.3.** Tratando-se de **alienação eventual** de imóvel **por pessoa física que não seja contribuinte habitual** das atividades imobiliárias, observar-se-ão as **regras específicas** e os **redutores** previstos na LC nº 214/2025 e regulamentação infralegal para operações com bens imóveis.

**12.4.** As partes obrigam-se a renegociar de boa-fé, mediante aditivo, qualquer alteração relevante da carga tributária superveniente que afete o equilíbrio econômico-financeiro originalmente pactuado.

<!-- TODO: REVISAR JURÍDICO: confirmar com o tributarista o tratamento exato de IBS/CBS sobre venda eventual de imóvel por PF — varia conforme regulamentação e cronograma. Cláusula mantida em formulação genérica. -->

---

## CLÁUSULA 13 — DA PROTEÇÃO DE DADOS (LGPD)

**13.1.** As partes obrigam-se ao tratamento dos dados pessoais e empresariais relativos a este contrato em conformidade com a **Lei nº 13.709/2018** (LGPD), restringindo seu uso às finalidades de execução, registro, cobrança e cumprimento de obrigações legais.

**13.2. Papéis das partes.** A **{{imobiliaria.nome}}** atua como **OPERADORA** dos dados pessoais do VENDEDOR no contexto da intermediação e como **CONTROLADORA** dos dados de seus próprios funcionários, fornecedores e operações internas. O **VENDEDOR** é o **CONTROLADOR** dos dados próprios e do COMPRADOR. As partes adotarão controles técnicos e administrativos compatíveis.

**13.3.** Encarregado(a)/DPO: **{{imobiliaria.dpo_nome}}** — e-mail **{{imobiliaria.email_dpo}}**.

---

## CLÁUSULA 14 — DA ASSINATURA ELETRÔNICA

**14.1.** As partes reconhecem expressamente, com fundamento na **MP nº 2.200-2/2001** e na **Lei nº 14.063/2020**, a plena validade jurídica e força probante da assinatura deste contrato e seus aditivos por meio eletrônico, em quaisquer das modalidades legais.

**14.2.** Os logs de auditoria da plataforma utilizada pela {{imobiliaria.nome}} (data, hora, IP, hash, geolocalização) constituem prova suficiente da manifestação de vontade.

---

## CLÁUSULA 15 — DAS DISPOSIÇÕES GERAIS

**15.1. Título executivo extrajudicial.** O presente contrato e seus aditivos constituem **título executivo extrajudicial**, na forma do **art. 784, III, do CPC** (instrumento particular assinado pelas partes e por duas testemunhas), ou do **art. 784, §4º**, do CPC, quando assinado por meio eletrônico em forma equivalente, dispensando-se nessa hipótese as testemunhas físicas.

**15.2.** O presente contrato vincula as partes, seus herdeiros e sucessores, a qualquer título.

**15.3.** A nulidade de qualquer cláusula não prejudicará as demais, observando-se o princípio da conservação contratual.

**15.4.** Eventuais comunicações entre as partes serão consideradas válidas quando enviadas aos endereços físicos ou eletrônicos constantes do preâmbulo.

---

## CLÁUSULA 16 — DO FORO

**16.1.** Fica eleito o **Foro da Comarca de {{cidade.foro}}**, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir as questões oriundas deste contrato.

---

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento, de forma física ou eletrônica, em via única de igual teor e forma.

**{{cidade.foro}}, {{contrato.data_emissao}}.**

---

## ASSINATURAS


_________________________________________
**VENDEDOR(A):** {{vendedor.nome}}
CPF/CNPJ: {{vendedor.cpf_cnpj}}


_________________________________________
**COMPRADOR(A):** {{comprador.nome}}
CPF/CNPJ: {{comprador.cpf_cnpj}}


_________________________________________
**INTERMEDIADORA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}} · CRECI: {{imobiliaria.creci}}


### TESTEMUNHAS

**1.** _________________________________________
Nome: {{testemunha1.nome}} · CPF: {{testemunha1.cpf_cnpj}}


**2.** _________________________________________
Nome: {{testemunha2.nome}} · CPF: {{testemunha2.cpf_cnpj}}
`
