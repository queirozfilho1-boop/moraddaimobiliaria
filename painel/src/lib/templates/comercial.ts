export const TEMPLATE_COMERCIAL = `# CONTRATO DE LOCAÇÃO COMERCIAL

## NÃO-RESIDENCIAL — PADRÃO MORADDA

**Contrato nº {{contrato.numero}}**

---

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, o presente **Contrato de Locação Não-Residencial (Comercial)**, regido pelos **arts. 51 a 57 da Lei nº 8.245/1991** (Lei do Inquilinato), pelo **Código Civil Brasileiro**, pela **Lei nº 13.709/2018** (LGPD), pela **Lei Complementar nº 214/2025** (IBS/CBS), pela **MP nº 2.200-2/2001** e pela **Lei nº 14.063/2020** (assinatura eletrônica), mediante intermediação da **{{imobiliaria.nome}}**, sob as cláusulas e condições seguintes.

---

## DAS PARTES

**LOCADOR(A):** {{locador.nome}}, {{locador.nacionalidade}}, {{locador.estado_civil}}, {{locador.profissao}}, portador(a) do RG nº {{locador.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{locador.cpf_cnpj}}, residente e domiciliado(a) em {{locador.endereco_completo}}, e-mail {{locador.email}}, telefone {{locador.telefone}}.

**LOCATÁRIO(A) — PESSOA JURÍDICA:** **{{locatario.razao_social}}**{{#if locatario.nome_fantasia}} (nome fantasia: {{locatario.nome_fantasia}}){{/if}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{locatario.cpf_cnpj}}{{#if locatario.ie}}, inscrição estadual {{locatario.ie}}{{/if}}{{#if locatario.im}}, inscrição municipal {{locatario.im}}{{/if}}{{#if locatario.cnae}}, atividade principal sob CNAE {{locatario.cnae}}{{/if}}, com sede em {{locatario.endereco_completo}}, e-mail {{locatario.email}}, telefone {{locatario.telefone}}{{#if locatario.representante}}, neste ato representada por {{locatario.representante}}, CPF nº {{locatario.representante_cpf}}, na qualidade de {{locatario.representante_cargo}}{{/if}}.

{{#if fiador.nome}}**FIADOR(A):** {{fiador.nome}}, {{fiador.nacionalidade}}, {{fiador.estado_civil}}, {{fiador.profissao}}, RG nº {{fiador.rg}}, CPF/CNPJ nº {{fiador.cpf_cnpj}}, residente em {{fiador.endereco_completo}}{{#if fiador.email}}, e-mail {{fiador.email}}{{/if}}{{#if fiador.telefone}}, telefone {{fiador.telefone}}{{/if}}.{{/if}}

**INTERMEDIÁRIA / ADMINISTRADORA:** **{{imobiliaria.nome}}**, CNPJ nº {{imobiliaria.cnpj}}, **CRECI-PJ nº {{imobiliaria.creci}}**, com sede em {{imobiliaria.endereco_completo}}, e-mail {{imobiliaria.email}}, telefone {{imobiliaria.telefone}}.

---

## CLÁUSULA 1ª — DAS FONTES NORMATIVAS APLICÁVEIS

**1.1.** A presente locação rege-se, no que couber, pelas seguintes normas: **Lei nº 8.245/1991** (Lei do Inquilinato), em especial arts. 51 a 57; **Código Civil**, em especial arts. 565 a 578 e arts. 1.142 a 1.149 (estabelecimento empresarial); **Lei nº 8.009/1990**; **Lei nº 13.709/2018** (LGPD); **Lei Complementar nº 214/2025** (IBS/CBS); **MP nº 2.200-2/2001** e **Lei nº 14.063/2020** (assinatura eletrônica); **Código de Processo Civil**; e legislação específica das atividades exercidas no imóvel.

---

## CLÁUSULA 2ª — DO OBJETO DA LOCAÇÃO

**2.1.** O LOCADOR dá em locação ao LOCATÁRIO o imóvel **não-residencial** assim descrito:

**2.1.1.** Código interno: **{{imovel.codigo}}**; tipo: **{{imovel.tipo}}**; endereço: **{{imovel.endereco_completo}}**{{#if imovel.matricula}}; matrícula nº **{{imovel.matricula}}** do Cartório de Registro de Imóveis de **{{imovel.cartorio}}**{{/if}}{{#if imovel.inscricao_iptu}}; inscrição imobiliária (IPTU) nº **{{imovel.inscricao_iptu}}**{{/if}}{{#if imovel.area_construida}}; área construída **{{imovel.area_construida}}**{{/if}}{{#if imovel.area_total}}; área total **{{imovel.area_total}}**{{/if}}.

**2.2.** Acompanham o imóvel vagas de garagem, depósito, equipamentos fixos e mobiliário descritos no **Termo de Vistoria de Entrada (Anexo I)**.

**2.3.** O imóvel é entregue em condições de uso compatível com a destinação comercial pactuada, ressalvadas eventuais adaptações específicas a cargo do LOCATÁRIO (Cláusula 12).

---

## CLÁUSULA 3ª — DA DESTINAÇÃO E DO RAMO DE ATIVIDADE

**3.1.** O imóvel destina-se **EXCLUSIVAMENTE** ao exercício do seguinte ramo de atividade: **{{contrato.ramo_atividade}}**{{#if locatario.cnae}}, sob CNAE **{{locatario.cnae}}**{{/if}}, sendo **vedado** seu uso para fim diverso, residencial, ou para atividades incompatíveis com a destinação comercial.

**3.2.** Eventual alteração do ramo de atividade ou ampliação para atividades correlatas dependerá de **prévia anuência por escrito** do LOCADOR, que poderá negá-la motivadamente, especialmente se a nova atividade implicar maior risco, ônus tributário ou desvalorização do imóvel.

**3.3.** O descumprimento implicará rescisão imediata, multa de 3 (três) aluguéis e desocupação compulsória, conforme art. 9º, II, da Lei nº 8.245/1991.

---

## CLÁUSULA 4ª — DOS ALVARÁS, LICENÇAS E AVCB

**4.1.** É de **exclusiva responsabilidade do LOCATÁRIO** a obtenção, manutenção, renovação e custeio de todos os alvarás, licenças, autorizações e habilitações necessários ao funcionamento de seu estabelecimento comercial, incluindo:

**4.1.1.** Alvará de Funcionamento Municipal;

**4.1.2.** Alvará Sanitário (Vigilância Sanitária);

**4.1.3.** AVCB/CLCB (Auto de Vistoria do Corpo de Bombeiros){{#if locacao.avcb_status}} — **AVCB:** {{locacao.avcb_status}}{{/if}};

**4.1.4.** Licença Ambiental (CETESB ou órgão equivalente), quando aplicável;

**4.1.5.** Licenças setoriais (ANVISA, ANATEL, MAPA, Polícia Federal, ECAD, etc.);

**4.1.6.** Inscrição Estadual e Municipal e Cadastro de Atividades;

**4.1.7.** Habite-se específico para a atividade, se necessário.

**4.2.** O LOCATÁRIO declara ter realizado vistoria prévia no imóvel e que o mesmo é adequado à atividade pretendida, **eximindo o LOCADOR** de qualquer responsabilidade pela negativa, indeferimento, suspensão ou cassação de alvarás.

**4.3.** A negativa de alvará ou licença não constitui motivo para rescisão sem multa nem para suspensão dos pagamentos.

**4.4.** O LOCATÁRIO obriga-se a fornecer cópia dos alvarás obtidos à {{imobiliaria.nome}} em até 60 (sessenta) dias do início da locação, sob pena de notificação.

---

## CLÁUSULA 5ª — DO PRAZO

**5.1.** A locação vigorará pelo prazo de **{{contrato.prazo_meses}} ({{contrato.prazo_extenso}}) meses**, com início em **{{contrato.data_inicio}}** e término em **{{contrato.data_fim}}**.

**5.2.** Findo o prazo, sem oposição do LOCADOR após 30 (trinta) dias, presumir-se-á prorrogada por prazo indeterminado, podendo ser denunciada por qualquer das partes mediante aviso prévio de 30 (trinta) dias (art. 57, Lei nº 8.245/1991).

**5.3.** Para fins de **ação renovatória** (Cláusula 19), as partes desde já reconhecem o prazo mínimo de 5 (cinco) anos como elegível, somando-se eventuais contratos anteriores escritos entre as mesmas partes (*accessio temporis*).

---

## CLÁUSULA 6ª — DO VALOR DO ALUGUEL

**6.1.** O aluguel mensal é de **{{contrato.valor_aluguel_fmt}} ({{contrato.valor_aluguel_extenso}})**, pago **até o dia {{contrato.dia_vencimento}}** de cada mês subsequente.

**6.2.** Pagamento via boleto bancário emitido pela {{imobiliaria.nome}}{{#if contrato.chave_pix}} ou PIX na chave **{{contrato.chave_pix}}**{{/if}}, sendo válido apenas mediante comprovante.

**6.3.** Em caso de **aluguel percentual sobre faturamento** (locação em shopping center ou modalidade mista), serão observadas as regras dos arts. 52 e 54 da Lei nº 8.245/1991, com cláusula específica em aditivo.

---

## CLÁUSULA 7ª — DA MULTA E JUROS POR INADIMPLEMENTO

**7.1.** O atraso acarretará:

**7.1.1.** Multa moratória de **10%** sobre o valor;

**7.1.2.** Juros de mora de **1% ao mês** *pro rata die*;

**7.1.3.** Atualização monetária pelo IPCA/IBGE;

**7.1.4.** Honorários advocatícios de **20%** em caso de cobrança judicial.

**7.2.** Após 5 (cinco) dias úteis de atraso, fica autorizada a inscrição em SPC, SERASA, Boa Vista e órgãos de proteção ao crédito PJ (Serasa Experian Empresas).

**7.3.** Em caso de inadimplência superior a 30 dias, fica autorizada a propositura de ação de despejo por falta de pagamento cumulada com cobrança (art. 62, Lei nº 8.245/1991).

---

## CLÁUSULA 8ª — DO REAJUSTE

**8.1.** O valor do aluguel será **reajustado anualmente**, na menor periodicidade permitida em lei, pela variação acumulada do **{{locacao.indice_reajuste_fmt}}**, ou outro índice que vier a substituí-lo.

**8.2.** Em caso de extinção do índice, será adotado o **IPCA/IBGE**.

**8.3.** O reajuste anual **não se confunde nem prejudica o direito à ação revisional trienal** prevista na Cláusula 9ª, exercitável após 3 (três) anos de vigência ou do último acordo escrito de revisão.

---

## CLÁUSULA 9ª — DA REVISIONAL TRIENAL (ART. 19 DA LEI Nº 8.245/1991)

**9.1.** Decorridos **3 (três) anos** de vigência ou do último acordo escrito de revisão, qualquer das partes poderá pleitear **revisão judicial do aluguel** para ajustá-lo ao **preço de mercado**, conforme art. 19 da Lei nº 8.245/1991.

**9.2.** A propositura da ação revisional **não suspende** o pagamento dos aluguéis no valor vigente, e o **aluguel provisório** poderá ser fixado pelo juiz em até **80%** do valor pretendido (art. 68, Lei nº 8.245/1991).

**9.3.** As partes poderão, alternativamente, ajustar amigavelmente novo valor mediante **aditivo contratual**, dispensando-se a via judicial.

---

## CLÁUSULA 10 — DA GARANTIA LOCATÍCIA

**10.1.** Modalidade adotada (art. 37 da Lei nº 8.245/1991) **(marcar X na modalidade adotada — apenas uma)**:

**10.1.1. FIANÇA ( {{locacao.fianca}} )** — O FIADOR responde **solidariamente** com o LOCATÁRIO, com renúncia ao benefício de ordem (arts. 827/828 do CC) e até a efetiva entrega das chaves (art. 39 da Lei nº 8.245/1991), autorizando a penhora do imóvel em garantia, ainda que bem de família (art. 3º, VII, da Lei nº 8.009/1990).

**10.1.2. CAUÇÃO EM DINHEIRO ( {{locacao.caucao}} )** — Caução de até 3 (três) aluguéis em poupança vinculada (art. 38, §2º, Lei nº 8.245/1991).

**10.1.3. SEGURO-FIANÇA ( {{locacao.seguro}} )** — Apólice da seguradora indicada, com renovação obrigatória.

**10.1.4. TÍTULO DE CAPITALIZAÇÃO ( {{locacao.capitalizacao}} )** — Título em valor suficiente.

**10.1.5. CARTA DE FIANÇA BANCÁRIA ( {{locacao.fianca_bancaria}} )** — Específica para PJ, emitida por instituição financeira autorizada pelo BACEN, com renovação anual e cobertura de aluguéis e encargos.

---

## CLÁUSULA 11 — DAS DESPESAS, TRIBUTOS E SEGUROS

**11.1. Despesas ordinárias — LOCATÁRIO** (art. 23, XII, e art. 83 da Lei nº 8.245/1991):

**11.1.1.** Salários, encargos e benefícios de empregados de condomínio;

**11.1.2.** Consumo de água, esgoto, gás, energia das áreas comuns;

**11.1.3.** Limpeza, conservação e pintura interna das áreas comuns;

**11.1.4.** Manutenção de elevadores, equipamentos hidráulicos, elétricos e de segurança;

**11.1.5.** Pequenos reparos das áreas comuns;

**11.1.6.** Reposição do fundo de reserva (limites convencionais);

**11.1.7.** Rateios de saldos devedores do período de uso.

**11.2. Despesas extraordinárias — LOCADOR** (art. 22, X):

**11.2.1.** Reformas estruturais;

**11.2.2.** Pintura de fachadas, empenas e esquadrias externas;

**11.2.3.** Indenizações trabalhistas anteriores;

**11.2.4.** Instalação de equipamentos de segurança/lazer;

**11.2.5.** Constituição do fundo de reserva.

**11.3. Tributos e taxas comerciais** — responsabilidade do LOCATÁRIO:

**11.3.1.** **IPTU** integral, incluindo lançamentos progressivos e majorações;

**11.3.2.** IPTU progressivo decorrente de subutilização ou parcelamento (art. 7º da Lei nº 10.257/2001), salvo se decorrer de inação imputável ao LOCADOR;

**11.3.3.** Taxa de Coleta de Resíduos Sólidos Comerciais;

**11.3.4.** Taxa de Fiscalização de Estabelecimentos (TFE);

**11.3.5.** Taxa de Publicidade (anúncios, fachada, totens);

**11.3.6.** Contribuição de Iluminação Pública (COSIP);

**11.3.7.** Taxas e tarifas de concessionárias diretamente vinculadas ao consumo do estabelecimento;

**11.3.8.** Custos com SPDA e renovação de AVCB.

**11.4. Seguros:**

**11.4.1.** Seguro contra incêndio, raio e explosão — **LOCATÁRIO** (obrigatório, com indicação do LOCADOR como beneficiário);

**11.4.2.** Seguro de Responsabilidade Civil (RC) Comercial — **LOCATÁRIO** (recomendado, conforme volume de público){{#if locacao.seguro_rc_status}}; **Seguro RC:** {{locacao.seguro_rc_status}}{{/if}}.

---

## CLÁUSULA 12 — DAS BENFEITORIAS E ADAPTAÇÕES COMERCIAIS

**12.1.** O LOCATÁRIO poderá realizar adaptações comerciais (layout, fachada, iluminação, comunicação visual, instalações elétricas reforçadas, ar-condicionado central, divisórias, vitrines) **mediante prévia autorização por escrito** do LOCADOR.

**12.2.** As adaptações deverão respeitar a estrutura e segurança do imóvel; a convenção e regulamento condominial; as posturas municipais e normas técnicas (ABNT, NR); e a Lei de Acessibilidade (Lei nº 10.098/2000 e NBR 9050).

**12.3.** Ao final da locação, a critério do LOCADOR, as adaptações serão:

**12.3.1.** mantidas no imóvel, sem direito a indenização ou retenção; ou

**12.3.2.** removidas pelo LOCATÁRIO, com restauração do estado original às suas custas.

**12.4.** As **benfeitorias necessárias** serão indenizadas (art. 35 da Lei nº 8.245/1991); as **úteis e voluptuárias** somente serão indenizadas se houver **prévia autorização escrita** com previsão expressa de indenização.

**12.5.** O LOCATÁRIO é responsável pela regularização junto à Prefeitura de eventuais alterações estruturais e pela emissão de **ART/RRT** quando exigida.

---

## CLÁUSULA 13 — DA VISTORIA

**13.1.** Realizada vistoria de entrada com laudo fotográfico (Anexo I).

**13.2.** Será realizada vistoria de saída comparativa, ressalvado o desgaste natural compatível com a atividade comercial.

**13.3.** A {{imobiliaria.nome}} poderá realizar vistorias periódicas (a cada 6 meses), mediante agendamento prévio com 5 (cinco) dias úteis de antecedência.

---

## CLÁUSULA 14 — DA SUBLOCAÇÃO E CESSÃO COMERCIAL

**14.1.** Diferentemente da locação residencial, na locação comercial admite-se sublocação parcial ou total, cessão e empréstimo, **mediante prévia e expressa autorização escrita** do LOCADOR (art. 13 da Lei nº 8.245/1991).

**14.2.** Em caso de autorização, o **LOCATÁRIO permanece solidariamente responsável** por todas as obrigações do contrato, inclusive pelos atos do sublocatário ou cessionário.

**14.3.** A cessão da locação em virtude de **trespasse** (transferência do estabelecimento empresarial — arts. 1.142 a 1.149 do CC) também depende de anuência expressa, sendo obrigatória a comunicação prévia com 60 (sessenta) dias e a apresentação do contrato de trespasse registrado.

**14.4.** A fusão, cisão, incorporação ou alteração do controle societário do LOCATÁRIO PJ deverá ser comunicada à {{imobiliaria.nome}} em até 30 (trinta) dias, podendo o LOCADOR exigir reforço de garantia se houver alteração relevante na capacidade financeira.

---

## CLÁUSULA 15 — DO FUNDO DE COMÉRCIO E DO PONTO COMERCIAL

**15.1.** O LOCATÁRIO reconhece que o fundo de comércio (clientela, ponto, aviamento) é construído pelo seu próprio esforço empresarial, **não cabendo ao LOCADOR qualquer responsabilidade** por sua manutenção, valorização ou desvalorização.

**15.2.** O LOCATÁRIO **não terá direito** a indenização pela perda do ponto comercial ao final da locação, ressalvada a hipótese específica do **art. 52, §3º, da Lei nº 8.245/1991** (negativa indevida de renovatória com posterior uso pelo LOCADOR ou terceiro do mesmo ramo no prazo de 3 meses).

**15.3.** A proteção do ponto comercial dar-se-á pelo exercício tempestivo da **ação renovatória** (Cláusula 19).

---

## CLÁUSULA 16 — DO DIREITO DE PREFERÊNCIA NA AQUISIÇÃO

**16.1.** Em caso de alienação, o LOCATÁRIO terá direito de preferência em igualdade de condições (arts. 27 a 34 da Lei nº 8.245/1991), com prazo de **30 (trinta) dias** para manifestação.

**16.2.** A preferência **não se aplica** em caso de decisão judicial; permuta; doação; integralização de capital; cisão, fusão e incorporação; e venda entre cônjuges, ascendentes e descendentes (art. 32 da Lei nº 8.245/1991).

---

## CLÁUSULA 17 — DA MULTA POR RESCISÃO ANTECIPADA

**17.1.** Em caso de devolução antes do término, multa de **3 (três) aluguéis vigentes**, **proporcional** ao tempo restante (art. 4º da Lei nº 8.245/1991), salvo as exceções legais.

**17.2.** A regra de isenção por transferência (art. 4º, parágrafo único) **não se aplica** ao LOCATÁRIO PJ, salvo expressa pactuação.

---

## CLÁUSULA 18 — DAS HIPÓTESES DE RESCISÃO IMEDIATA

**18.1.** Considera-se rescindido de pleno direito (art. 9º da Lei nº 8.245/1991):

**18.1.1.** Mútuo acordo;

**18.1.2.** Infração legal ou contratual;

**18.1.3.** Inadimplência superior a 30 (trinta) dias;

**18.1.4.** Reparações urgentes determinadas pelo Poder Público;

**18.1.5.** Uso diverso da destinação;

**18.1.6.** Sublocação não autorizada;

**18.1.7.** Atos lesivos à segurança ou ao sossego;

**18.1.8.** Falência ou recuperação judicial do LOCATÁRIO sem oferecimento de garantia adicional;

**18.1.9.** Cassação ou indeferimento definitivo do alvará por causa imputável ao LOCATÁRIO.

---

## CLÁUSULA 19 — DO DIREITO À RENOVATÓRIA (ART. 51 DA LEI Nº 8.245/1991)

**19.1.** O LOCATÁRIO terá **direito à renovação compulsória** do contrato por igual prazo, mediante ação renovatória, desde que cumulativamente:

**19.1.1.** O contrato a renovar tenha sido celebrado por escrito e com prazo determinado;

**19.1.2.** O prazo mínimo do contrato a renovar ou a soma dos prazos ininterruptos dos contratos escritos seja de **5 (cinco) anos**;

**19.1.3.** O LOCATÁRIO esteja explorando seu comércio, no mesmo ramo, pelo prazo mínimo e ininterrupto de **3 (três) anos**;

**19.1.4.** Quitação dos tributos e encargos que recaiam sobre o imóvel.

**19.2.** A ação renovatória deverá ser proposta **no interregno de 1 (um) ano, no máximo, até 6 (seis) meses, no mínimo, anteriores à data do término** do prazo do contrato em vigor (art. 51, §5º), **sob pena de DECADÊNCIA**.

**19.3.** Cabe ao LOCATÁRIO acompanhar atentamente os prazos da renovatória, eximindo-se o LOCADOR e a {{imobiliaria.nome}} de qualquer responsabilidade por sua perda.

**19.4.** O LOCADOR poderá opor-se à renovação nas hipóteses do art. 52 da Lei nº 8.245/1991 (insuficiência da proposta, proposta de terceiro mais vantajosa, uso próprio, transferência de fundo de comércio existente há mais de 1 ano, ou obras determinadas pelo Poder Público).

**19.5.** Em caso de negativa indevida com posterior exploração do mesmo ramo pelo LOCADOR ou terceiro em até 3 (três) meses, devida indenização pela perda do ponto (art. 52, §3º).

---

## CLÁUSULA 20 — DA DEVOLUÇÃO DO IMÓVEL

**20.1.** Devolução com completa desocupação, retirada de mobiliário, equipamentos, comunicação visual e documentos, com pintura, limpeza profissional e em perfeito estado, salvo desgaste normal.

**20.2.** Eventuais débitos de tributos, taxas, condomínio, consumo e fornecedores referentes ao período de uso permanecem com o LOCATÁRIO mesmo após a entrega das chaves.

**20.3.** O LOCATÁRIO obriga-se a apresentar **certidões negativas** municipais e estaduais relativas ao imóvel (IPTU, taxas, ISS sobre eventual obra) na devolução.

**20.4.** Encerramento das obrigações com a entrega das chaves mediante Termo de Devolução firmado pela {{imobiliaria.nome}}.

---

## CLÁUSULA 21 — DAS OBRIGAÇÕES DO LOCATÁRIO

**21.1.** Além das previstas no art. 23 da Lei nº 8.245/1991:

**21.1.1.** Pagar pontualmente aluguel, encargos, tributos e taxas;

**21.1.2.** Manter o imóvel em perfeito estado de conservação e limpeza;

**21.1.3.** Cumprir convenções, regulamentos e posturas;

**21.1.4.** Permitir vistorias mediante agendamento;

**21.1.5.** Manter ativos os alvarás durante toda a vigência;

**21.1.6.** Comunicar imediatamente danos, vazamentos, infiltrações e turbações;

**21.1.7.** Não armazenar materiais inflamáveis, explosivos ou de natureza perigosa, salvo expressamente autorizado e com licenças específicas;

**21.1.8.** Cumprir as normas trabalhistas, previdenciárias e tributárias relativas ao seu negócio, eximindo o LOCADOR de qualquer responsabilização.

---

## CLÁUSULA 22 — DAS OBRIGAÇÕES DO LOCADOR

**22.1.** Conforme art. 22 da Lei nº 8.245/1991:

**22.1.1.** Entregar o imóvel em condições de uso à atividade pactuada;

**22.1.2.** Garantir o uso pacífico;

**22.1.3.** Responder por vícios anteriores;

**22.1.4.** Pagar despesas extraordinárias de condomínio;

**22.1.5.** Fornecer recibos discriminados;

**22.1.6.** Manter regularidade dominial do imóvel.

---

## CLÁUSULA 23 — DA CLÁUSULA TRIBUTÁRIA — REFORMA TRIBUTÁRIA (IBS/CBS)

**23.1.** As partes reconhecem a vigência da Reforma Tributária do Consumo (**EC nº 132/2023** e **LC nº 214/2025**), com a instituição do **IBS** e da **CBS**, e período de transição iniciado em 2026.

**23.2.** As alíquotas, regimes específicos e regras aqui pactuadas serão **automaticamente atualizadas** conforme cronograma da LC nº 214/2025 e normas infralegais subsequentes, sem necessidade de aditivo, salvo se a alteração afetar o **equilíbrio econômico-financeiro** de forma relevante (art. 478 do CC).

**23.3.** Tratando-se de locação **não-residencial**, regra geral haverá incidência do IBS/CBS sobre o aluguel, conforme regime específico de bens imóveis, com aplicação dos redutores de alíquota previstos na legislação para locações comerciais habituais.

**23.4. Repasse Tributário.** Caso o LOCADOR seja contribuinte regular do IBS/CBS:

**23.4.1.** O valor do aluguel previsto na Cláusula 6ª é considerado **líquido**, podendo o LOCADOR destacar IBS/CBS em documento fiscal próprio, com efetivo repasse ao LOCATÁRIO quando este for contribuinte e tiver direito ao crédito não cumulativo;

**23.4.2.** Quando o LOCATÁRIO for contribuinte do IBS/CBS, terá direito ao aproveitamento integral do crédito sobre o tributo destacado, na forma do art. 156-A, §1º, VIII, da CF/88;

**23.4.3.** Quando o LOCATÁRIO **não** for contribuinte ou for optante do Simples Nacional fora do regime regular, o tributo comporá o custo final, sem direito a crédito.

**23.5. Documentação fiscal.** O LOCADOR emitirá documento fiscal eletrônico (NFS-e Nacional ou padrão do Comitê Gestor do IBS) a cada competência, contendo o destaque do IBS, da CBS e eventuais retenções aplicáveis.

**23.6. Retenções.** O LOCATÁRIO obriga-se a efetuar as retenções tributárias eventualmente exigíveis na fonte, repassando o líquido ao LOCADOR e fornecendo comprovantes.

**23.7. ISS/ICMS Residual.** Durante a transição, na hipótese de manutenção residual de ISS ou ICMS sobre operações imobiliárias correlatas, sua responsabilidade observará a regra de cada tributo.

<!-- TODO: REVISAR JURÍDICO: parametrizar limites de receita/imóveis (atualmente R$ 240.000 / 3 imóveis) por placeholder, pois mudam com regulamentação infralegal. -->

---

## CLÁUSULA 24 — DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)

**24.1.** Tratamento conforme **Lei nº 13.709/2018** (LGPD).

**24.2. Papéis das partes.** A **{{imobiliaria.nome}}** atua como **OPERADORA** dos dados pessoais do LOCADOR e como **CONTROLADORA** dos dados de seus próprios funcionários, fornecedores e operações internas. O **LOCADOR** é o **CONTROLADOR** dos dados do imóvel e do LOCATÁRIO. As partes adotarão controles técnicos e administrativos compatíveis.

**24.3.** **Dados tratados:** identificação, contato, dados financeiros, fiscais e cadastrais do LOCATÁRIO, sócios, representantes legais, fiadores e empregados (estes na medida estritamente necessária à execução).

**24.4.** **Bases legais** (art. 7º da LGPD): execução do contrato; cumprimento de obrigação legal; exercício regular de direitos; análise de crédito; legítimo interesse para gestão da locação.

**24.5.** **Compartilhamento:** seguradoras, bancos, cartórios, plataformas de assinatura, bureaus de crédito (PF e PJ), prestadores contábeis e jurídicos, autoridades fiscais (SPED, CGI/IBS, RFB).

**24.6.** **Retenção** de dados pelo prazo de **5 anos** após o término, ou maior se exigido por legislação fiscal e civil.

**24.7.** **Direitos do titular** (art. 18 da LGPD): confirmação, acesso, correção, portabilidade, eliminação (após o prazo legal), revogação de consentimento (quando aplicável).

**24.8. DPO/Encarregado:** {{imobiliaria.dpo_nome}} — **{{imobiliaria.email_dpo}}**.

**24.9.** **Incidentes de segurança:** comunicação à ANPD e aos titulares afetados em prazo razoável (art. 48 da LGPD).

**24.10. Confidencialidade.** As partes obrigam-se a manter sigilo sobre informações comerciais, financeiras e operacionais a que tenham acesso em razão deste contrato, com vigência de 5 (cinco) anos após o encerramento.

---

## CLÁUSULA 25 — DA TOLERÂNCIA E NOVAÇÃO

**25.1.** Tolerância **não constitui novação ou renúncia**, podendo a parte exigir o cumprimento integral a qualquer tempo.

---

## CLÁUSULA 26 — DA SUCESSÃO E DA AVERBAÇÃO NA MATRÍCULA

**26.1.** Obrigações transmitem-se a herdeiros e sucessores.

**26.2.** Em caso de alienação, o adquirente poderá denunciar o contrato em **90 (noventa) dias**, **salvo se o contrato contiver cláusula de vigência em caso de alienação e estiver averbado** na matrícula (art. 8º da Lei nº 8.245/1991).

**26.3.** As partes **{{contrato.averbacao}}** o presente contrato no Registro de Imóveis, para fins do art. 8º.

---

## CLÁUSULA 27 — DAS COMUNICAÇÕES

**27.1.** Comunicações por e-mail e WhatsApp registrados no preâmbulo são consideradas válidas e eficazes.

**27.2.** Mudanças de endereço ou contato devem ser notificadas em até 5 (cinco) dias úteis.

---

## CLÁUSULA 28 — DA INTERMEDIAÇÃO IMOBILIÁRIA

**28.1.** Locação intermediada e administrada pela **{{imobiliaria.nome}}**, CNPJ **{{imobiliaria.cnpj}}**, CRECI **{{imobiliaria.creci}}**, com remuneração ajustada com o LOCADOR em instrumento próprio.

---

## CLÁUSULA 29 — DA ARBITRAGEM E MEDIAÇÃO (FACULTATIVA)

**29.1.** Conflitos de natureza patrimonial disponível poderão, a critério das partes e mediante aceite formal posterior, ser submetidos à **mediação** (Lei nº 13.140/2015) ou **arbitragem** (Lei nº 9.307/1996), perante a **Câmara {{contrato.camara_arbitral}}**, sem prejuízo da via judicial para questões possessórias e de despejo.

---

## CLÁUSULA 30 — DA ASSINATURA ELETRÔNICA

**30.1.** As partes reconhecem a **validade jurídica plena** da assinatura eletrônica deste contrato e seus aditivos, com fundamento na **MP nº 2.200-2/2001** (ICP-Brasil) e na **Lei nº 14.063/2020**.

**30.2.** Aplica-se assinatura **avançada ou qualificada**, conforme certificado e plataforma utilizada (DocuSign, Clicksign, D4Sign, Autentique, Gov.br, certificado ICP-Brasil A1/A3).

**30.3.** Para PJ, recomenda-se assinatura por certificado digital **e-CNPJ ICP-Brasil**, garantindo presunção legal de autenticidade e integridade (art. 10, §1º, da MP nº 2.200-2/2001).

**30.4.** As partes renunciam a impugnações baseadas exclusivamente na natureza eletrônica da assinatura (art. 10, §2º, da MP nº 2.200-2/2001).

**30.5.** A trilha de auditoria (IP, geolocalização, hash SHA-256, timestamp, dupla autenticação) é prova suficiente.

**30.6.** O presente instrumento constitui **título executivo extrajudicial**, na forma do **art. 784, III, do CPC** (instrumento particular assinado pelas partes e por duas testemunhas), ou do **art. 784, §4º**, do CPC, quando assinado por meio eletrônico em forma equivalente, dispensando-se nessa hipótese as testemunhas físicas.

---

## CLÁUSULA 31 — DO FORO

**31.1.** Foro da Comarca de **{{cidade.foro}}**, com exclusão de qualquer outro, para dirimir litígios oriundos deste contrato.

**31.2.** Aplicação subsidiária da Lei nº 8.245/1991, do Código Civil, do CPC e do Código de Defesa do Consumidor (quando aplicável conforme entendimento do STJ).

---

## CLÁUSULA 32 — DAS DISPOSIÇÕES FINAIS

**32.1.** Contrato firmado em caráter **irrevogável e irretratável**.

**32.2.** Nulidade parcial não afeta o todo (princípio da conservação contratual).

**32.3.** Constituem **anexos** integrantes deste contrato:

**32.3.1. Anexo I** — Termo de Vistoria de Entrada e laudo fotográfico;

**32.3.2. Anexo II** — Cópia do contrato/estatuto social do LOCATÁRIO PJ atualizado e procurações;

**32.3.3. Anexo III** — Convenção de condomínio e regulamento (se aplicável);

**32.3.4. Anexo IV** — Comprovantes de garantia;

**32.3.5. Anexo V** — Termo LGPD;

**32.3.6. Anexo VI** — Plantas, projeto de adaptação e ART/RRT (se houver).

---

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento, em forma física ou eletrônica, em via única de igual teor e forma.

**{{cidade.foro}}, {{contrato.data_emissao}}.**

---

## ASSINATURAS


_________________________________________
**LOCADOR(A):** {{locador.nome}}
CPF/CNPJ: {{locador.cpf_cnpj}}


_________________________________________
**LOCATÁRIO(A) — PESSOA JURÍDICA:** {{locatario.razao_social}}
CNPJ: {{locatario.cpf_cnpj}}
{{#if locatario.representante}}Por: {{locatario.representante}} · CPF: {{locatario.representante_cpf}} · Cargo: {{locatario.representante_cargo}}{{/if}}


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
