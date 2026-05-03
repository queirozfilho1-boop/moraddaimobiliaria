export const TEMPLATE_TEMPORADA = `# CONTRATO DE LOCAÇÃO POR TEMPORADA

## ARTS. 48 A 50 DA LEI Nº 8.245/1991 — PADRÃO MORADDA

**Contrato nº {{contrato.numero}}**

---

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, o presente **Contrato de Locação por Temporada**, regido pela **Lei nº 8.245/1991**, em especial seus arts. 48 a 50, pela **Lei nº 11.771/2008** (Lei Geral do Turismo), pelo **Código Civil Brasileiro**, pela **Lei nº 13.709/2018** (LGPD), pela **Lei Complementar nº 214/2025** (Reforma Tributária — IBS/CBS), pela **MP nº 2.200-2/2001** e pela **Lei nº 14.063/2020** (assinatura eletrônica), mediante intermediação e administração da **{{imobiliaria.nome}}**, sob as cláusulas e condições seguintes.

---

## DAS PARTES

**LOCADOR(A):** {{locador.nome}}, {{locador.nacionalidade}}, {{locador.estado_civil}}, {{locador.profissao}}, portador(a) do RG nº {{locador.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{locador.cpf_cnpj}}, residente e domiciliado(a) em {{locador.endereco_completo}}, e-mail {{locador.email}}, telefone {{locador.telefone}}, neste ato representado(a), por força de Contrato de Administração, pela imobiliária **{{imobiliaria.nome}}**, CNPJ nº {{imobiliaria.cnpj}}, CRECI-PJ nº {{imobiliaria.creci}}, com sede em {{imobiliaria.endereco_completo}}.

**LOCATÁRIO(A) / HÓSPEDE TITULAR:** {{locatario.nome}}, {{locatario.nacionalidade}}, {{locatario.estado_civil}}, {{locatario.profissao}}, portador(a) do RG nº {{locatario.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{locatario.cpf_cnpj}}, residente e domiciliado(a) em {{locatario.endereco_completo}}, e-mail {{locatario.email}}, telefone {{locatario.telefone}}.

{{#if fiador.nome}}**FIADOR(A):** {{fiador.nome}}, {{fiador.nacionalidade}}, {{fiador.estado_civil}}, {{fiador.profissao}}, RG nº {{fiador.rg}}, CPF nº {{fiador.cpf_cnpj}}, residente em {{fiador.endereco_completo}}{{#if fiador.email}}, e-mail {{fiador.email}}{{/if}}.{{/if}}

---

## CLÁUSULA 1ª — DAS FONTES NORMATIVAS APLICÁVEIS

**1.1.** A presente locação rege-se, no que couber, pela **Lei nº 8.245/1991** (arts. 22, 23, 37, 48, 49 e 50); pela **Lei nº 11.771/2008** (Turismo); pelo **Código Civil**; pela **Lei nº 13.709/2018** (LGPD); pela **Lei Complementar nº 214/2025** (IBS/CBS); pela **MP nº 2.200-2/2001** e **Lei nº 14.063/2020** (assinatura eletrônica); e pela **Resolução COFECI nº 1.504/2023**.

---

## CLÁUSULA 2ª — DO OBJETO

**2.1.** Constitui objeto do presente contrato a **locação por temporada**, para fins exclusivamente residenciais transitórios, do imóvel de propriedade do(a) LOCADOR(A), assim descrito:

**2.1.1.** Código interno: **{{imovel.codigo}}**; tipo: **{{imovel.tipo}}**; endereço completo: **{{imovel.endereco_completo}}**{{#if imovel.matricula}}; matrícula nº **{{imovel.matricula}}** do Cartório de Registro de Imóveis de **{{imovel.cartorio}}**{{/if}}{{#if imovel.inscricao_iptu}}; inscrição imobiliária (IPTU) nº **{{imovel.inscricao_iptu}}**{{/if}}{{#if imovel.area_privativa}}; área privativa **{{imovel.area_privativa}}**{{/if}}{{#if imovel.vagas_garagem}}; vagas de garagem **{{imovel.vagas_garagem}}**{{/if}}.

**2.2.** A locação destina-se à residência transitória do(a) LOCATÁRIO(A) e seus acompanhantes nominalmente identificados no **Anexo I — Termo de Hóspedes**, em decorrência de fato transitório (lazer, tratamento de saúde, curso, reforma de imóvel próprio ou outro motivo análogo), nos exatos termos do art. 48 da Lei nº 8.245/1991.

**2.3.** É vedada a sublocação, cessão, empréstimo, comodato ou qualquer outra forma de transferência da posse do imóvel a terceiros, no todo ou em parte, sob pena de rescisão imediata e aplicação da cláusula penal prevista na Cláusula 12.

---

## CLÁUSULA 3ª — DO PRAZO

**3.1.** O prazo da locação é de **{{contrato.prazo_meses}} ({{contrato.prazo_extenso}}) meses** ou fração equivalente em dias, com início em **{{contrato.data_inicio}}** (check-in) e término em **{{contrato.data_fim}}** (check-out), observado o limite legal **máximo de 90 (noventa) dias** previsto no art. 48 da Lei nº 8.245/1991.

**3.2.** O presente contrato **não admite prorrogação automática** nem renovatória, conforme art. 50 da Lei do Inquilinato. Findo o prazo ajustado, o(a) LOCATÁRIO(A) deverá restituir o imóvel imediatamente, nas mesmas condições em que o recebeu.

**3.3.** A permanência do(a) LOCATÁRIO(A) por prazo superior a 30 (trinta) dias após o termo final, sem oposição do(a) LOCADOR(A), implicará prorrogação por prazo indeterminado regida pelo regime residencial comum (art. 50, parágrafo único, da Lei nº 8.245/1991), sem prejuízo de o LOCADOR exigir a desocupação a qualquer tempo, mediante notificação com antecedência mínima de 30 (trinta) dias.

---

## CLÁUSULA 4ª — DO VALOR E DA FORMA DE PAGAMENTO

**4.1.** O valor total da locação por temporada é de **{{contrato.valor_aluguel_fmt}} ({{contrato.valor_aluguel_extenso}})**.

**4.2.** O pagamento será efetuado da seguinte forma, conforme faculta o art. 49 da Lei nº 8.245/1991, que autoriza o recebimento de uma única vez e antecipadamente:

**4.2.1.** **Sinal/Reserva** no ato da assinatura, conforme proposta aceita;

**4.2.2.** **Saldo** até a data do check-in, no ato da entrega das chaves.

**4.3.** O pagamento será realizado mediante **PIX, transferência bancária, boleto ou cartão**, em favor do LOCADOR ou da {{imobiliaria.nome}} (na qualidade de administradora), valendo o respectivo comprovante como recibo de quitação.

**4.4.** O atraso no pagamento de qualquer parcela ensejará a incidência de:

**4.4.1.** multa moratória de **10% (dez por cento)** sobre o valor em atraso;

**4.4.2.** juros de mora de **1% (um por cento) ao mês**, *pro rata die*;

**4.4.3.** correção monetária pelo IGP-M/FGV ou, na sua falta, pelo IPCA/IBGE.

---

## CLÁUSULA 5ª — DA GARANTIA LOCATÍCIA (CAUÇÃO)

**5.1.** Em garantia das obrigações assumidas, em conformidade com o art. 37, I, c/c art. 49 da Lei nº 8.245/1991, o(a) LOCATÁRIO(A) presta **caução em dinheiro** equivalente a parcela do valor total ajustada em proposta, depositada na conta indicada no item 4.3.

**5.2.** A caução responderá por: (i) eventuais danos ao imóvel, mobiliário e utensílios; (ii) débitos de consumo (energia, água, gás, internet) apurados após o check-out; (iii) multas contratuais; e (iv) qualquer outra obrigação inadimplida pelo(a) LOCATÁRIO(A).

**5.3.** Não havendo pendências, a caução será devolvida ao(à) LOCATÁRIO(A), corrigida pelo índice da poupança, no prazo de até **15 (quinze) dias** contados da vistoria final de saída.

---

## CLÁUSULA 6ª — DA MOBÍLIA, UTENSÍLIOS E INVENTÁRIO

**6.1.** O imóvel é entregue **mobiliado e equipado**, conforme exigência do parágrafo único do art. 48 da Lei nº 8.245/1991, sendo parte integrante e indissociável deste contrato o **Anexo II — Termo de Vistoria e Inventário de Móveis e Utensílios**, no qual constam, item a item, o estado de conservação de cada bem.

**6.2.** Os bens inventariados deverão ser restituídos no mesmo estado em que foram recebidos, ressalvado o desgaste natural pelo uso regular. Avarias, extravios ou substituições serão objeto de ressarcimento integral mediante a caução, sem prejuízo de cobrança suplementar caso o valor seja insuficiente.

**6.3.** É vedado ao(à) LOCATÁRIO(A) remover, deslocar permanentemente ou alterar a disposição original dos móveis, bem como introduzir bens próprios de caráter fixo (pregos, parafusos, adesivos em paredes etc.) sem prévia e expressa autorização escrita do(a) LOCADOR(A).

---

## CLÁUSULA 7ª — DOS ENCARGOS, DESPESAS E TRIBUTOS

**7.1.** Por conta do(a) **LOCADOR(A)** correrão exclusivamente:

**7.1.1.** IPTU e Taxa de Coleta de Lixo;

**7.1.2.** cota condominial ordinária referente ao período da locação;

**7.1.3.** despesas extraordinárias de condomínio (art. 22, X, e art. 23, §1º, da Lei nº 8.245/1991);

**7.1.4.** seguro contra incêndio do imóvel.

**7.2.** Por conta do(a) **LOCATÁRIO(A)** correrão:

**7.2.1.** energia elétrica, água, esgoto, gás, internet e TV por assinatura consumidos durante a estada (medidos por leitura inicial e final ou rateados);

**7.2.2.** taxa de limpeza final indicada na proposta;

**7.2.3.** eventuais multas condominiais decorrentes de conduta sua ou de seus acompanhantes;

**7.2.4.** pequenos reparos decorrentes do uso (art. 23, V, da Lei do Inquilinato).

---

## CLÁUSULA 8ª — DA CLÁUSULA TRIBUTÁRIA — REFORMA TRIBUTÁRIA (IBS/CBS)

**8.1.** As partes reconhecem que, a partir de **1º de janeiro de 2026**, a locação de imóveis passou a integrar o campo de incidência do **IBS** e da **CBS**, nos termos da **EC nº 132/2023** e da **LC nº 214/2025**.

**8.2.** As alíquotas, regimes específicos e regras aqui pactuadas serão **automaticamente atualizadas** conforme cronograma da LC nº 214/2025 e normas infralegais subsequentes, **sem necessidade de aditivo**, salvo se a alteração afetar o **equilíbrio econômico-financeiro** de forma relevante (art. 478 do CC).

**8.3.** Caso o(a) LOCADOR(A), pessoa física, seja **contribuinte** do IBS/CBS — observados os critérios cumulativos definidos na regulamentação infralegal vigente quanto a número de imóveis e receita anual de locação —, fica desde já estabelecido que os tributos serão calculados com os **redutores** previstos em lei e os respectivos **redutores sociais por imóvel residencial**, sendo destacados em separado no documento fiscal.

**8.4.** IPTU, taxa de lixo e cotas condominiais **não integram** a base de cálculo do IBS/CBS, conforme LC nº 214/2025.

**8.5.** Os valores eventualmente devidos a título de IBS/CBS serão de responsabilidade do(a) LOCADOR(A), salvo se a legislação determinar de modo diverso, sendo vedada sua repercussão econômica direta sobre o(a) LOCATÁRIO(A) sem prévia repactuação.

**8.6.** A **{{imobiliaria.nome}}**, na qualidade de administradora, emitirá **NFS-e** referente aos seus honorários, observada a obrigatoriedade nacional vigente.

<!-- TODO: REVISAR JURÍDICO: parametrizar limites de receita/imóveis (mudam por norma infralegal) — aqui mantemos formulação genérica. -->

---

## CLÁUSULA 9ª — DA VISTORIA E ENTREGA DAS CHAVES

**9.1.** As chaves serão entregues ao(à) LOCATÁRIO(A) no dia e hora pactuados, mediante:

**9.1.1.** confirmação da quitação integral do valor;

**9.1.2.** assinatura do **Termo de Vistoria de Entrada (Anexo II)**, com fotografias datadas;

**9.1.3.** leitura dos relógios de água, gás e energia.

**9.2.** Ao término do prazo, será realizada **Vistoria de Saída**, em data e horário previamente agendados, oportunidade em que serão verificadas as condições do imóvel, do mobiliário e dos consumos, lavrando-se o competente Termo.

---

## CLÁUSULA 10 — DAS REGRAS DE USO E CONVIVÊNCIA

**10.1.** O(A) LOCATÁRIO(A) e seus acompanhantes obrigam-se a:

**10.1.1.** observar o **Regulamento Interno e a Convenção de Condomínio** (Anexo III), em especial quanto a horários de silêncio, uso de áreas comuns, descarte de lixo e segurança;

**10.1.2.** respeitar o **limite máximo de hóspedes** indicado na proposta;

**10.1.3.** observar a política de pets (permissão ou proibição) constante da proposta;

**10.1.4.** observar a política de fumo (permissão ou proibição) constante da proposta;

**10.1.5.** não realizar festas, eventos ou reuniões com som amplificado;

**10.1.6.** comunicar imediatamente qualquer dano, defeito ou pane que demande reparo.

**10.2.** As partes reconhecem expressamente — **conforme entendimento jurisprudencial consolidado em diversos julgados do STJ** — que **convenções condominiais podem restringir ou vedar a locação por curta temporada**, prevalecendo, na hipótese, as deliberações do condomínio.

---

## CLÁUSULA 11 — DAS OBRIGAÇÕES DAS PARTES

**11.1.** Compete ao(à) **LOCADOR(A)**, nos termos do art. 22 da Lei nº 8.245/1991:

**11.1.1.** entregar o imóvel em perfeitas condições de uso, higiene e segurança;

**11.1.2.** garantir, durante a locação, o uso pacífico do imóvel;

**11.1.3.** manter, durante a locação, a forma e o destino do imóvel;

**11.1.4.** responder pelos vícios ou defeitos anteriores à locação;

**11.1.5.** pagar as despesas extraordinárias de condomínio.

**11.2.** Compete ao(à) **LOCATÁRIO(A)**, nos termos do art. 23 da Lei nº 8.245/1991:

**11.2.1.** pagar pontualmente o aluguel e encargos;

**11.2.2.** servir-se do imóvel para o uso convencionado, com cuidado de proprietário;

**11.2.3.** restituir o imóvel, finda a locação, no estado em que recebeu, salvo deteriorações decorrentes do uso normal;

**11.2.4.** levar imediatamente ao conhecimento do(a) LOCADOR(A) o surgimento de qualquer dano ou defeito;

**11.2.5.** realizar a imediata reparação dos danos provocados por si, seus dependentes, familiares, visitantes ou prepostos;

**11.2.6.** não modificar a forma interna ou externa do imóvel sem consentimento prévio e por escrito do(a) LOCADOR(A);

**11.2.7.** permitir a vistoria do imóvel pelo(a) LOCADOR(A) ou seu preposto, mediante combinação prévia.

---

## CLÁUSULA 12 — DO CANCELAMENTO E DA RESCISÃO

**12.1.** **Cancelamento pelo(a) LOCATÁRIO(A) antes do início da locação:**

**12.1.1.** Com mais de **30 (trinta) dias** de antecedência: devolução de percentual previsto na proposta;

**12.1.2.** Entre **30 e 15 dias** de antecedência: devolução de percentual reduzido previsto na proposta;

**12.1.3.** Com menos de **15 dias** ou no-show: **retenção integral** do valor pago, a título de cláusula penal compensatória.

**12.2. Desocupação antecipada pelo(a) LOCATÁRIO(A).** Caso o(a) LOCATÁRIO(A) deixe o imóvel antes do término do prazo, **não fará jus à devolução proporcional** do aluguel pago antecipadamente, dada a natureza específica e indivisível da locação por temporada (art. 49 da Lei nº 8.245/1991).

**12.3. Rescisão por inadimplemento ou descumprimento** de qualquer cláusula confere à parte inocente o direito de exigir o cumprimento forçado ou rescindir o contrato, com aplicação de **cláusula penal compensatória** definida na proposta, sem prejuízo das perdas e danos.

**12.4.** Conforme entendimento jurisprudencial consolidado em diversos julgados do STJ, **a multa compensatória é devida ainda que a desocupação decorra de ordem judicial de despejo**, respondendo solidariamente eventual fiador, e podendo o juiz reduzi-la equitativamente quando excessiva.

---

{{#if fiador.nome}}## CLÁUSULA 13 — DO FIADOR

**13.1.** Figura como **FIADOR(A) e PRINCIPAL PAGADOR(A)**, solidariamente responsável por todas as obrigações deste contrato, inclusive eventual prorrogação legal: {{fiador.nome}}, qualificado(a) no preâmbulo.

**13.2.** O(A) FIADOR(A) renuncia expressamente aos benefícios de ordem, divisão e excussão, nos termos dos arts. 827 e 828 do Código Civil, respondendo até a efetiva entrega das chaves.

---

{{/if}}

## CLÁUSULA 14 — DA PROTEÇÃO DE DADOS (LGPD)

**14.1.** As partes declaram observar a **Lei nº 13.709/2018** (LGPD), autorizando o tratamento dos dados pessoais estritamente para a execução deste contrato, cobrança, prestação de contas e cumprimento de obrigações legais e fiscais.

**14.2. Papéis das partes.** A **{{imobiliaria.nome}}** atua como **OPERADORA** dos dados pessoais do LOCADOR e como **CONTROLADORA** dos dados de seus próprios funcionários, fornecedores e operações internas. O **LOCADOR** é o **CONTROLADOR** dos dados do imóvel e do LOCATÁRIO. As partes adotarão controles técnicos e administrativos compatíveis.

**14.3.** O(A) LOCATÁRIO(A) poderá, a qualquer tempo, exercer os direitos previstos no art. 18 da LGPD junto ao Encarregado(a) {{imobiliaria.dpo_nome}}, pelo e-mail **{{imobiliaria.email_dpo}}**.

---

## CLÁUSULA 15 — DA ASSINATURA ELETRÔNICA E DA VALIDADE DIGITAL

**15.1.** As partes acordam que o presente contrato será **assinado eletronicamente** por meio de plataforma idônea (DocuSign, ClickSign, D4Sign, GovBR ou equivalente), na forma da **MP nº 2.200-2/2001** e da **Lei nº 14.063/2020**, reconhecendo desde já a integral validade jurídica e eficácia probatória da assinatura eletrônica avançada ou qualificada.

**15.2.** Constituem provas válidas das manifestações de vontade os logs, hashes, certificados e relatórios gerados pela plataforma, que ficarão arquivados pela {{imobiliaria.nome}} pelo prazo legal.

**15.3.** O presente instrumento constitui **título executivo extrajudicial**, na forma do **art. 784, III, do CPC** (instrumento particular assinado pelas partes e por duas testemunhas), ou do **art. 784, §4º**, do CPC, quando assinado por meio eletrônico em forma equivalente, dispensando-se nessa hipótese as testemunhas físicas.

---

## CLÁUSULA 16 — DAS DISPOSIÇÕES FINAIS

**16.1.** As comunicações entre as partes serão validamente realizadas pelos e-mails e telefones declarados no preâmbulo, presumindo-se entregues quando enviadas.

**16.2.** A tolerância de qualquer das partes quanto ao descumprimento de cláusulas deste contrato não constituirá novação, renúncia ou alteração das obrigações pactuadas.

**16.3.** Este contrato obriga as partes, seus herdeiros e sucessores, a qualquer título.

**16.4.** Constituem **anexos** integrantes deste contrato:

**16.4.1. Anexo I** — Termo de Hóspedes (rol nominal de acompanhantes);

**16.4.2. Anexo II** — Termo de Vistoria e Inventário de Móveis e Utensílios;

**16.4.3. Anexo III** — Regulamento Interno e Convenção do Condomínio (quando aplicável);

**16.4.4. Anexo IV** — Comprovantes de pagamento e caução.

---

## CLÁUSULA 17 — DO FORO

**17.1.** Fica eleito o **Foro da Comarca de {{imovel.cidade}}-{{imovel.estado}}**, lugar do imóvel locado (art. 47 do CPC), com expressa renúncia a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer controvérsias decorrentes do presente contrato.

---

E, por estarem assim, justas e contratadas, as partes firmam o presente instrumento por meio eletrônico, em via única de igual teor e forma.

**{{cidade.foro}}, {{contrato.data_emissao}}.**

---

## ASSINATURAS


_________________________________________
**LOCADOR(A):** {{locador.nome}}
CPF/CNPJ: {{locador.cpf_cnpj}}


_________________________________________
**LOCATÁRIO(A):** {{locatario.nome}}
CPF/CNPJ: {{locatario.cpf_cnpj}}


{{#if fiador.nome}}_________________________________________
**FIADOR(A):** {{fiador.nome}}
CPF/CNPJ: {{fiador.cpf_cnpj}}


{{/if}}_________________________________________
**ADMINISTRADORA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}} · CRECI-PJ: {{imobiliaria.creci}}


### TESTEMUNHAS

**1.** _________________________________________
Nome: {{testemunha1.nome}}{{#if testemunha1.cpf_cnpj}} · CPF: {{testemunha1.cpf_cnpj}}{{/if}}


**2.** _________________________________________
Nome: {{testemunha2.nome}}{{#if testemunha2.cpf_cnpj}} · CPF: {{testemunha2.cpf_cnpj}}{{/if}}
`
