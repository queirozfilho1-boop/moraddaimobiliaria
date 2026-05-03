export const TEMPLATE_RESIDENCIAL = `# CONTRATO DE LOCAÇÃO RESIDENCIAL

## PADRÃO MORADDA — LEI Nº 8.245/1991

**Contrato nº {{contrato.numero}}**

---

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, o presente **Contrato de Locação Residencial**, regido pela **Lei nº 8.245/1991** (Lei do Inquilinato), pelo **Código Civil Brasileiro (Lei nº 10.406/2002)**, pela **Lei nº 13.709/2018** (LGPD), pela **Lei Complementar nº 214/2025** (Reforma Tributária — IBS/CBS), pela **MP nº 2.200-2/2001** e pela **Lei nº 14.063/2020** (assinatura eletrônica), mediante intermediação da **{{imobiliaria.nome}}**, sob as cláusulas e condições seguintes.

---

## DAS PARTES

**LOCADOR(A):** {{locador.nome}}, {{locador.nacionalidade}}, {{locador.estado_civil}}, {{locador.profissao}}, portador(a) do RG nº {{locador.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{locador.cpf_cnpj}}, residente e domiciliado(a) em {{locador.endereco_completo}}, e-mail {{locador.email}}, telefone {{locador.telefone}}.

**LOCATÁRIO(A):** {{locatario.nome}}, {{locatario.nacionalidade}}, {{locatario.estado_civil}}, {{locatario.profissao}}, portador(a) do RG nº {{locatario.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{locatario.cpf_cnpj}}, residente e domiciliado(a) em {{locatario.endereco_completo}}, e-mail {{locatario.email}}, telefone {{locatario.telefone}}.

{{#if fiador.nome}}**FIADOR(A):** {{fiador.nome}}, {{fiador.nacionalidade}}, {{fiador.estado_civil}}, {{fiador.profissao}}, RG nº {{fiador.rg}}, CPF nº {{fiador.cpf_cnpj}}, residente em {{fiador.endereco_completo}}{{#if fiador.email}}, e-mail {{fiador.email}}{{/if}}{{#if fiador.telefone}}, telefone {{fiador.telefone}}{{/if}}.{{/if}}

**INTERMEDIÁRIA / ADMINISTRADORA:** **{{imobiliaria.nome}}**, pessoa jurídica de direito privado, CNPJ nº {{imobiliaria.cnpj}}, **CRECI-PJ nº {{imobiliaria.creci}}**, com sede em {{imobiliaria.endereco_completo}}, e-mail {{imobiliaria.email}}, telefone {{imobiliaria.telefone}}.

---

## CLÁUSULA 1ª — DAS FONTES NORMATIVAS APLICÁVEIS

**1.1.** A presente locação rege-se, no que couber, pelas seguintes normas: **Lei nº 8.245/1991** (Lei do Inquilinato); **Código Civil**, em especial arts. 565 a 578; **Lei nº 8.009/1990** (impenhorabilidade do bem de família, com a exceção do art. 3º, VII); **Lei nº 13.709/2018** (LGPD); **Lei Complementar nº 214/2025** (IBS/CBS); **MP nº 2.200-2/2001** e **Lei nº 14.063/2020** (assinatura eletrônica); e **Código de Processo Civil** quanto aos efeitos executórios e processuais.

---

## CLÁUSULA 2ª — DO OBJETO DA LOCAÇÃO

**2.1.** O LOCADOR, sendo legítimo proprietário e/ou possuidor do imóvel, dá em locação ao LOCATÁRIO o imóvel **residencial** assim descrito:

**2.1.1.** Código interno: **{{imovel.codigo}}**; tipo: **{{imovel.tipo}}**; endereço: **{{imovel.endereco_completo}}**; matrícula nº **{{imovel.matricula}}** do Cartório de Registro de Imóveis de **{{imovel.cartorio}}**; inscrição imobiliária (IPTU) nº **{{imovel.inscricao_iptu}}**.

**2.2.** O imóvel é entregue em perfeitas condições de uso, habitabilidade, higiene e segurança, conforme **Termo de Vistoria de Entrada** (Anexo I), parte integrante e indissociável deste contrato, na forma do art. 22, V, da Lei nº 8.245/1991.

**2.3.** Acompanham o imóvel os móveis, equipamentos e benfeitorias descritos no Anexo I.

---

## CLÁUSULA 3ª — DA DESTINAÇÃO

**3.1.** O imóvel destina-se **EXCLUSIVAMENTE** à **moradia residencial** do LOCATÁRIO e de seu núcleo familiar, sendo expressamente vedado uso comercial, industrial, profissional, religioso ou para fins diversos da residência habitual.

**3.2.** O descumprimento da destinação implicará rescisão imediata, nos termos do art. 9º, II, da Lei nº 8.245/1991, sem prejuízo das demais cominações legais.

---

## CLÁUSULA 4ª — DO PRAZO

**4.1.** O prazo da locação é de **{{contrato.prazo_meses}} ({{contrato.prazo_extenso}}) meses**, com início em **{{contrato.data_inicio}}** e término em **{{contrato.data_fim}}**, independentemente de aviso, notificação ou interpelação judicial ou extrajudicial.

**4.2.** Findo o prazo contratual, caso o LOCATÁRIO permaneça no imóvel por mais de 30 (trinta) dias sem oposição do LOCADOR, presumir-se-á prorrogada a locação por **prazo indeterminado**, mantidas as demais cláusulas, na forma do art. 46, §1º, da Lei nº 8.245/1991.

**4.3.** Durante a vigência por prazo indeterminado, poderá o LOCADOR denunciar o contrato concedendo prazo de **30 (trinta) dias** para desocupação (art. 46, §2º).

---

## CLÁUSULA 5ª — DO VALOR DO ALUGUEL E FORMA DE PAGAMENTO

**5.1.** O valor mensal do aluguel é de **{{contrato.valor_aluguel_fmt}} ({{contrato.valor_aluguel_extenso}})**, a ser pago **até o dia {{contrato.dia_vencimento}}** de cada mês subsequente ao vencido.

**5.2.** O pagamento será efetuado mediante **boleto bancário** emitido pela {{imobiliaria.nome}} em favor do LOCADOR{{#if contrato.chave_pix}}, ou via **PIX** na chave **{{contrato.chave_pix}}**{{/if}}.

**5.3.** O pagamento somente será considerado quitado mediante comprovante bancário ou recibo expedido pela imobiliária, não se admitindo quitação verbal.

**5.4.** Constitui obrigação do LOCATÁRIO o pagamento pontual, independentemente de envio do boleto, devendo, em caso de não recebimento, solicitar a 2ª via à imobiliária com antecedência mínima de 3 (três) dias úteis do vencimento.

---

## CLÁUSULA 6ª — DA MULTA E JUROS POR INADIMPLEMENTO

**6.1.** O atraso no pagamento de aluguel e/ou encargos acarretará:

**6.1.1.** multa moratória de **10% (dez por cento)** sobre o valor do débito;

**6.1.2.** juros de mora de **1% (um por cento) ao mês**, calculados *pro rata die*;

**6.1.3.** atualização monetária pelo **IPCA/IBGE** ou índice substitutivo;

**6.1.4.** honorários advocatícios de **20% (vinte por cento)** em caso de cobrança judicial.

**6.2.** Após o terceiro dia útil de atraso, fica autorizada a inscrição do nome do LOCATÁRIO em cadastros restritivos de crédito (SPC/SERASA), na forma da Lei nº 12.414/2011.

---

## CLÁUSULA 7ª — DO REAJUSTE

**7.1.** O valor do aluguel será **reajustado anualmente**, na menor periodicidade permitida em lei, pela variação acumulada do **{{locacao.indice_reajuste}}** (IGP-M/FGV ou IPCA/IBGE), ou outro índice que vier a substituí-lo.

**7.2.** Em caso de extinção do índice pactuado, será aplicado o **IPCA/IBGE** como índice substitutivo.

**7.3.** O reajuste é aplicado automaticamente, independentemente de aviso ou notificação prévia, e **não se confunde nem prejudica** o direito eventual à ação revisional do art. 19 da Lei nº 8.245/1991, exercitável após 3 (três) anos de vigência ou do último acordo escrito de reajuste.

---

## CLÁUSULA 8ª — DA GARANTIA LOCATÍCIA

**8.1.** Em conformidade com o **art. 37 da Lei nº 8.245/1991**, o LOCATÁRIO oferece como garantia a modalidade abaixo assinalada **(marcar X na modalidade adotada — apenas uma)**:

**8.1.1. FIANÇA ( {{locacao.fianca}} )** — O FIADOR acima qualificado, juntamente com seu cônjuge, declara-se **fiador e principal pagador**, **solidariamente** responsável por todas as obrigações assumidas pelo LOCATÁRIO, com expressa **renúncia ao benefício de ordem** (arts. 827 e 828 do Código Civil). A fiança subsiste até a **efetiva entrega das chaves**, nos termos do art. 39 da Lei nº 8.245/1991, abrangendo eventual prorrogação por prazo indeterminado. O FIADOR autoriza a penhora do imóvel oferecido em garantia, ainda que bem de família, conforme art. 3º, VII, da Lei nº 8.009/1990.

**8.1.2. CAUÇÃO EM DINHEIRO ( {{locacao.caucao}} )** — Caução equivalente a **3 (três) meses** de aluguel, depositada em **caderneta de poupança** vinculada ao contrato (art. 38, §2º, Lei nº 8.245/1991). Os rendimentos pertencerão ao LOCATÁRIO e a devolução ocorrerá em até 30 (trinta) dias após a entrega das chaves, descontados eventuais débitos.

**8.1.3. SEGURO-FIANÇA ( {{locacao.seguro}} )** — Seguro-fiança contratado pelo LOCATÁRIO, com cobertura de aluguéis, encargos, multa e indenizações; renovação anual obrigatória, sob pena de rescisão.

**8.1.4. TÍTULO DE CAPITALIZAÇÃO ( {{locacao.capitalizacao}} )** — Título em valor suficiente para garantir o contrato (art. 37, IV, Lei nº 8.245/1991, incluído pela Lei nº 11.196/2005).

---

## CLÁUSULA 9ª — DAS DESPESAS ORDINÁRIAS

**9.1.** Cabe ao **LOCATÁRIO** o pagamento das **despesas ordinárias de condomínio**, conforme art. 23, XII, e art. 83 da Lei nº 8.245/1991, incluindo:

**9.1.1.** Salários, encargos trabalhistas e previdenciários dos empregados;

**9.1.2.** Consumo de água, esgoto, gás, luz e força das áreas comuns;

**9.1.3.** Limpeza, conservação e pintura das instalações e áreas comuns;

**9.1.4.** Manutenção e conservação de elevadores, porteiro eletrônico, antenas, instalações hidráulicas, elétricas, mecânicas e de segurança;

**9.1.5.** Pequenos reparos nas dependências e instalações de uso comum;

**9.1.6.** Rateios de saldos devedores, salvo se referentes a período anterior à locação;

**9.1.7.** Reposição do fundo de reserva, observado o limite previsto em convenção.

**9.2.** São também de responsabilidade do LOCATÁRIO as contas de **água, esgoto, energia elétrica, gás, internet, TV por assinatura, telefone**, **TRSD/Taxa de Lixo** e demais consumos individualizados do imóvel.

---

## CLÁUSULA 10 — DAS DESPESAS EXTRAORDINÁRIAS E DO IPTU

**10.1.** Cabe ao **LOCADOR** o pagamento das **despesas extraordinárias de condomínio**, conforme art. 22, X, e art. 22, parágrafo único, da Lei nº 8.245/1991, especialmente:

**10.1.1.** Obras de reforma ou acréscimos que interessem à estrutura integral do imóvel;

**10.1.2.** Pintura das fachadas, empenas, poços de aeração, iluminação e esquadrias externas;

**10.1.3.** Obras destinadas a repor as condições de habitabilidade do edifício;

**10.1.4.** Indenizações trabalhistas e previdenciárias por dispensa de empregados anteriores ao início da locação;

**10.1.5.** Instalação de equipamentos de segurança, incêndio, telefonia, intercomunicação, esporte e lazer;

**10.1.6.** Despesas de decoração e paisagismo nas partes de uso comum;

**10.1.7.** Constituição do fundo de reserva.

**10.2.** **IPTU — atribuição opcional.** O **IPTU** e o **prêmio de seguro contra incêndio** ficam, neste contrato, a cargo do **{{locacao.iptu_responsavel}}**, conforme expressa pactuação das partes (admite-se atribuição ao LOCATÁRIO ou ao LOCADOR, na forma do art. 22, VIII, c/c art. 25, da Lei nº 8.245/1991, e da jurisprudência consolidada).

---

## CLÁUSULA 11 — DAS BENFEITORIAS

**11.1.** O LOCATÁRIO somente poderá realizar **benfeitorias úteis ou voluptuárias** mediante **prévia e expressa autorização por escrito** do LOCADOR, não cabendo qualquer indenização ou direito de retenção, ainda que autorizadas, salvo estipulação em contrário (art. 35 da Lei nº 8.245/1991).

**11.2.** As **benfeitorias necessárias** introduzidas pelo LOCATÁRIO, ainda que não autorizadas, serão indenizáveis e permitirão o exercício do direito de retenção, conforme art. 35 c/c art. 578 do Código Civil.

**11.3.** Quaisquer benfeitorias realizadas, inclusive instalações fixas (ar-condicionado split, armários planejados, papel de parede, pisos especiais), aderem ao imóvel ao final da locação, salvo retirada autorizada e desde que sem danos.

---

## CLÁUSULA 12 — DA VISTORIA

**12.1.** Foi realizada **vistoria de entrada**, descrita em laudo fotográfico (Anexo I), que estabelece o estado de conservação do imóvel no início da locação.

**12.2.** Por ocasião da entrega das chaves, será realizada **vistoria de saída**, comparando-se o estado do imóvel com o laudo de entrada, ressalvados os desgastes naturais decorrentes do uso normal.

**12.3.** Eventuais danos, faltas ou avarias serão orçados pela {{imobiliaria.nome}} mediante **3 (três) orçamentos**, ficando o LOCATÁRIO responsável pelo ressarcimento integral.

---

## CLÁUSULA 13 — DA SUBLOCAÇÃO E CESSÃO

**13.1.** É **expressamente vedada** a sublocação total ou parcial, a cessão e o empréstimo do imóvel, ainda que a título gratuito, sem prévio e expresso consentimento por escrito do LOCADOR, sob pena de rescisão imediata, conforme art. 13 da Lei nº 8.245/1991.

**13.2.** O eventual consentimento para sublocação não dispensa a obtenção de novo consentimento para sublocações posteriores.

---

## CLÁUSULA 14 — DO DIREITO DE PREFERÊNCIA

**14.1.** Em caso de **alienação** do imóvel, o LOCATÁRIO terá direito de preferência para adquiri-lo, em **igualdade de condições** com terceiros, devendo o LOCADOR notificá-lo formalmente, nos termos dos arts. 27 a 34 da Lei nº 8.245/1991.

**14.2.** O LOCATÁRIO terá prazo de **30 (trinta) dias** para manifestar, por escrito, seu interesse na aquisição.

**14.3.** O não exercício da preferência, ou a alienação a terceiros em condições mais vantajosas, autoriza o LOCATÁRIO a haver para si o imóvel mediante depósito do preço, sob pena de perdas e danos (art. 33).

---

## CLÁUSULA 15 — DA MULTA POR RESCISÃO ANTECIPADA

**15.1.** Em caso de devolução do imóvel antes do término do prazo contratual, o LOCATÁRIO pagará multa equivalente a **3 (três) aluguéis vigentes**, **proporcional ao período faltante**, conforme art. 4º da Lei nº 8.245/1991.

**15.2.** Fica isento da multa o LOCATÁRIO transferido pelo empregador, **público ou privado**, para prestar serviços em **localidade diversa** da do início do contrato, mediante notificação por escrito ao LOCADOR com antecedência mínima de 30 (trinta) dias, juntando comprovação da transferência (art. 4º, parágrafo único).

---

## CLÁUSULA 16 — DAS HIPÓTESES DE RESCISÃO IMEDIATA

**16.1.** O presente contrato será considerado rescindido de pleno direito, independentemente de notificação ou interpelação, nas seguintes hipóteses (art. 9º da Lei nº 8.245/1991):

**16.1.1.** Por mútuo acordo entre as partes;

**16.1.2.** Por infração legal ou contratual de qualquer das partes;

**16.1.3.** Por inadimplência do aluguel ou encargos por mais de 30 (trinta) dias;

**16.1.4.** Para realização de reparações urgentes determinadas pelo Poder Público que não possam ser executadas com a permanência do LOCATÁRIO;

**16.1.5.** Pelo uso diverso da destinação contratada;

**16.1.6.** Pela sublocação não autorizada;

**16.1.7.** Pela prática de atos que prejudiquem a moralidade, a segurança, o sossego ou a saúde dos vizinhos;

**16.1.8.** Pelo perecimento ou destruição do imóvel.

---

## CLÁUSULA 17 — DA DEVOLUÇÃO DO IMÓVEL

**17.1.** Findo o contrato, o LOCATÁRIO devolverá o imóvel completamente desocupado de pessoas e bens, **limpo, pintado e em perfeito estado**, conforme recebido (Termo de Vistoria de Entrada).

**17.2.** A devolução das **chaves**, mediante Termo de Entrega de Chaves firmado pela {{imobiliaria.nome}}, marca o encerramento das obrigações locatícias, salvo débitos pendentes.

**17.3.** Permanece o LOCATÁRIO responsável pelo pagamento dos aluguéis e encargos até a efetiva entrega das chaves, ainda que tenha desocupado o imóvel anteriormente.

**17.4.** Eventuais débitos de consumo (água, energia, gás, condomínio) vencidos após a entrega das chaves, mas referentes ao período de uso pelo LOCATÁRIO, são de sua inteira responsabilidade.

---

## CLÁUSULA 18 — DAS OBRIGAÇÕES DO LOCATÁRIO

**18.1.** Constituem obrigações do LOCATÁRIO, além das previstas no art. 23 da Lei nº 8.245/1991:

**18.1.1.** Pagar pontualmente o aluguel e encargos;

**18.1.2.** Servir-se do imóvel para o uso convencionado;

**18.1.3.** Restituir o imóvel no estado em que o recebeu, salvo desgastes do uso normal;

**18.1.4.** Levar imediatamente ao conhecimento do LOCADOR turbações de terceiros;

**18.1.5.** Realizar reparos de danos decorrentes de seu uso ou de seus dependentes;

**18.1.6.** Não modificar a forma interna ou externa do imóvel sem autorização;

**18.1.7.** Cumprir integralmente a convenção de condomínio e o regulamento interno;

**18.1.8.** Permitir a vistoria do imóvel pelo LOCADOR ou seu preposto, mediante combinação prévia.

---

## CLÁUSULA 19 — DAS OBRIGAÇÕES DO LOCADOR

**19.1.** São obrigações do LOCADOR (art. 22 da Lei nº 8.245/1991):

**19.1.1.** Entregar o imóvel em estado de servir ao uso a que se destina;

**19.1.2.** Garantir o uso pacífico do imóvel locado;

**19.1.3.** Manter, durante a locação, a forma e o destino do imóvel;

**19.1.4.** Responder pelos vícios ou defeitos anteriores à locação;

**19.1.5.** Fornecer recibos discriminados das importâncias pagas;

**19.1.6.** Pagar as despesas extraordinárias de condomínio;

**19.1.7.** Pagar os impostos e taxas que incidam sobre o imóvel, ressalvada a atribuição contratual prevista na Cláusula 10.2.

---

## CLÁUSULA 20 — DO SEGURO CONTRA INCÊNDIO E SEGURO DE RC (OPCIONAL)

**20.1.** O LOCATÁRIO obriga-se a contratar e manter, durante toda a vigência do contrato, **seguro contra incêndio, raio e explosão** do imóvel locado, em valor compatível com o valor de reconstrução, indicando o LOCADOR como beneficiário.

**20.2.** A apólice deverá ser apresentada à {{imobiliaria.nome}} em até 30 (trinta) dias da assinatura, sob pena de rescisão.

**20.3. AVCB e Seguro de Responsabilidade Civil — facultativo.** Quando o imóvel se localizar em condomínio com **AVCB** vigente exigível, fica o LOCATÁRIO obrigado a observar as regras correspondentes (extintores, sinalização, rotas de fuga). Status atual: **{{locacao.avcb_status}}**. A contratação de **Seguro de Responsabilidade Civil** complementar (RC familiar) é **facultativa**, com status **{{locacao.seguro_rc_status}}**.

<!-- TODO: REVISAR JURÍDICO: avaliar se faz sentido tornar AVCB/RC obrigatório por padrão em residências dentro de condomínios verticais. -->

---

## CLÁUSULA 21 — DA CLÁUSULA TRIBUTÁRIA — REFORMA TRIBUTÁRIA (IBS/CBS)

**21.1.** As partes reconhecem que, com o advento da **Emenda Constitucional nº 132/2023** e da **Lei Complementar nº 214/2025**, foi instituída a **Reforma Tributária do Consumo**, criando-se o **IBS** e a **CBS**, com transição iniciada em 2026.

**21.2.** As alíquotas, regimes específicos, redutores sociais e regras aqui pactuadas serão **automaticamente atualizadas** conforme cronograma da LC nº 214/2025 e normas infralegais subsequentes, **sem necessidade de aditivo**, salvo se a alteração afetar o **equilíbrio econômico-financeiro** de forma relevante, hipótese em que se aplicará o art. 478 do Código Civil (resolução por onerosidade excessiva).

**21.3.** Tratando-se de locação **residencial** habitual, observar-se-á o regime específico de bens imóveis, com aplicação de **redutor social** e demais benefícios previstos na legislação para locações residenciais.

**21.4.** Caso o LOCADOR seja **pessoa jurídica** ou esteja enquadrado como **contribuinte regular** do IBS/CBS, eventuais tributos incidentes sobre a locação serão suportados pelo LOCADOR, sendo vedado o repasse direto ao LOCATÁRIO sem expressa repactuação por aditivo.

**21.5.** O LOCADOR compromete-se a fornecer, sempre que solicitado, os **comprovantes fiscais** exigidos pela legislação tributária vigente.

---

## CLÁUSULA 22 — DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)

**22.1.** O tratamento de dados pessoais observará a **Lei nº 13.709/2018** (LGPD).

**22.2. Papéis das partes.** A **{{imobiliaria.nome}}** atua como **OPERADORA** dos dados pessoais do LOCADOR e como **CONTROLADORA** dos dados de seus próprios funcionários, fornecedores e operações internas. O **LOCADOR** é o **CONTROLADOR** dos dados do imóvel e do LOCATÁRIO no contexto da locação. As partes adotarão controles técnicos e administrativos compatíveis para proteção dos dados.

**22.3.** Os dados pessoais coletados (nome, CPF, RG, endereço, telefone, e-mail, dados financeiros, comprovantes de renda) serão tratados para as seguintes finalidades, com base nos arts. 7º e 11 da LGPD:

**22.3.1.** execução do contrato (art. 7º, V);

**22.3.2.** cumprimento de obrigação legal ou regulatória (art. 7º, II);

**22.3.3.** exercício regular de direitos em processo judicial, administrativo ou arbitral (art. 7º, VI);

**22.3.4.** análise de crédito e idoneidade financeira (art. 7º, X).

**22.4.** Os dados serão armazenados pelo prazo legal (mínimo de 5 anos após o término do contrato) e poderão ser compartilhados com seguradoras, bancos, cartórios, plataformas de assinatura eletrônica, autoridades públicas e bureaus de crédito (SPC/SERASA/Boa Vista).

**22.5.** Ficam asseguradas ao titular as prerrogativas do art. 18 da LGPD: confirmação, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamento e revogação de consentimento.

**22.6. Encarregado/DPO.** O canal de exercício de direitos é o e-mail **{{imobiliaria.email_dpo}}**, indicado o(a) **Encarregado(a)** {{imobiliaria.dpo_nome}}.

**22.7.** As partes obrigam-se a comunicar incidentes de segurança que possam acarretar risco ou dano relevante aos titulares, em conformidade com o art. 48 da LGPD.

---

## CLÁUSULA 23 — DA TOLERÂNCIA E NOVAÇÃO

**23.1.** A eventual tolerância de uma das partes quanto ao descumprimento de cláusula contratual constituirá mera liberalidade, **não implicando novação, renúncia ou alteração** dos termos pactuados.

---

## CLÁUSULA 24 — DA SUCESSÃO

**24.1.** As obrigações deste contrato transmitem-se aos herdeiros, sucessores e cessionários das partes, observadas as disposições da Lei nº 8.245/1991 quanto à morte do LOCATÁRIO (art. 11) e à alienação do imóvel (art. 8º).

---

## CLÁUSULA 25 — DAS COMUNICAÇÕES

**25.1.** Toda e qualquer comunicação relacionada a este contrato, inclusive notificações, avisos e interpelações, poderá ser feita por meio eletrônico (e-mail e WhatsApp registrados no preâmbulo), considerando-se válida e eficaz independentemente de aviso de recebimento, conforme art. 10 do CC e art. 422 do CPC.

**25.2.** Mudanças de endereço, e-mail ou telefone deverão ser comunicadas por escrito, com antecedência de 5 (cinco) dias úteis.

---

## CLÁUSULA 26 — DA INTERMEDIAÇÃO IMOBILIÁRIA

**26.1.** A locação foi intermediada pela **{{imobiliaria.nome}}**, CNPJ **{{imobiliaria.cnpj}}**, CRECI **{{imobiliaria.creci}}**, que prestará serviços de administração da locação, cobrança, repasse e suporte durante toda a vigência contratual, mediante remuneração ajustada com o LOCADOR em instrumento próprio.

---

## CLÁUSULA 27 — DA AVERBAÇÃO NA MATRÍCULA

**27.1.** As partes **{{contrato.averbacao}}** o presente contrato no Registro de Imóveis competente, para fins do art. 8º da Lei nº 8.245/1991. A averbação é faculdade do LOCATÁRIO e, quando realizada, **assegura a continuidade da locação** em caso de alienação do imóvel a terceiros, vedando ao adquirente a denúncia em 90 dias prevista no caput do art. 8º.

---

## CLÁUSULA 28 — DA ARBITRAGEM E MEDIAÇÃO (FACULTATIVA)

**28.1.** Conflitos de natureza patrimonial disponível poderão, a critério das partes e mediante aceite formal posterior, ser submetidos à **mediação** (Lei nº 13.140/2015) ou **arbitragem** (Lei nº 9.307/1996), perante a **Câmara {{contrato.camara_arbitral}}**, sem prejuízo da via judicial para as questões possessórias e de despejo, que permanecem reservadas ao Poder Judiciário.

---

## CLÁUSULA 29 — DA ASSINATURA ELETRÔNICA

**29.1.** As partes reconhecem expressamente, com fundamento na **MP nº 2.200-2/2001** (ICP-Brasil) e na **Lei nº 14.063/2020**, a plena validade jurídica e força probante da assinatura deste contrato e seus aditivos por meio eletrônico, em quaisquer das modalidades legais.

**29.2.** Para os fins do art. 4º da Lei nº 14.063/2020, considera-se utilizada **assinatura eletrônica avançada** ou **qualificada**, conforme classificação técnica do certificado e da plataforma utilizada.

**29.3.** As partes renunciam expressamente ao direito de impugnar a autenticidade, integridade e validade jurídica deste instrumento sob alegação de assinatura não-presencial, manuscrita ou em meio físico (art. 10, §2º, da MP nº 2.200-2/2001).

**29.4.** A trilha de auditoria gerada pela plataforma de assinatura eletrônica (IP, geolocalização, hash do documento, timestamp e dados biométricos quando aplicável) é considerada **prova suficiente** da autoria e integridade.

**29.5.** O presente contrato e seus aditivos constituem **título executivo extrajudicial**, na forma do **art. 784, III, do Código de Processo Civil** (instrumento particular assinado pelas partes e por duas testemunhas), ou do **art. 784, §4º**, do CPC, quando assinado eletronicamente em forma equivalente, dispensando-se nessa hipótese as testemunhas físicas.

---

## CLÁUSULA 30 — DO FORO

**30.1.** Fica eleito o **Foro da Comarca de {{cidade.foro}}**, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer dúvidas, controvérsias ou litígios decorrentes deste contrato.

---

## CLÁUSULA 31 — DAS DISPOSIÇÕES FINAIS

**31.1.** Este contrato é firmado em caráter **irrevogável e irretratável**, obrigando as partes, herdeiros e sucessores.

**31.2.** Eventual nulidade ou ineficácia de qualquer cláusula não afetará as demais, que permanecerão em plena vigência.

**31.3.** Constituem **anexos** integrantes deste contrato:

**31.3.1. Anexo I** — Termo de Vistoria de Entrada com laudo fotográfico;

**31.3.2. Anexo II** — Cópia da convenção de condomínio e regulamento interno;

**31.3.3. Anexo III** — Comprovantes de garantia locatícia;

**31.3.4. Anexo IV** — Termo de Ciência e Consentimento LGPD.

---

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento, de forma física ou eletrônica, em via única de igual teor e forma.

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
**INTERMEDIÁRIA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}} · CRECI: {{imobiliaria.creci}}


### TESTEMUNHAS

**1.** _________________________________________
Nome: {{testemunha1.nome}}{{#if testemunha1.cpf_cnpj}} · CPF: {{testemunha1.cpf_cnpj}}{{/if}}


**2.** _________________________________________
Nome: {{testemunha2.nome}}{{#if testemunha2.cpf_cnpj}} · CPF: {{testemunha2.cpf_cnpj}}{{/if}}
`
