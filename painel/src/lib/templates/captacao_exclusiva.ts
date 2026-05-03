export const TEMPLATE_CAPTACAO_EXCLUSIVA = `# CONTRATO DE CORRETAGEM IMOBILIÁRIA COM EXCLUSIVIDADE

## AUTORIZAÇÃO DE {{captacao.modalidade}} — PADRÃO MORADDA

**Contrato nº {{contrato.numero}}**

---

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, o presente **Contrato de Prestação de Serviços de Corretagem Imobiliária com Cláusula de Exclusividade**, regido pelos **arts. 722 a 729 do Código Civil**, pela **Lei nº 6.530/1978** e **Decreto nº 81.871/1978** (profissão de Corretor de Imóveis), pela **Resolução COFECI nº 1.504/2023**, pela **Lei nº 9.610/1998** (Direitos Autorais), pela **Lei nº 13.709/2018** (LGPD), pela **Lei Complementar nº 214/2025** (Reforma Tributária — IBS/CBS), pela **MP nº 2.200-2/2001** e pela **Lei nº 14.063/2020** (assinatura eletrônica), e pelo **Termo de Compromisso de Cessação de Prática firmado entre o CADE e o COFECI em 14/03/2018**, sob as cláusulas e condições seguintes.

*(Onde se lê {{captacao.modalidade}}: VENDA, LOCAÇÃO ou VENDA E LOCAÇÃO.)*

---

## DAS PARTES

**PROPRIETÁRIO(A) / CONTRATANTE:** {{proprietario.nome}}, {{proprietario.nacionalidade}}, {{proprietario.estado_civil}}, {{proprietario.profissao}}, portador(a) do RG nº {{proprietario.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{proprietario.cpf_cnpj}}, residente e domiciliado(a) em {{proprietario.endereco_completo}}, e-mail {{proprietario.email}}, telefone {{proprietario.telefone}}; e cônjuge {{proprietario.conjuge_nome}}, CPF nº {{proprietario.conjuge_cpf}}, quando exigida outorga conjugal nos termos do art. 1.647 do Código Civil.

**IMOBILIÁRIA / CONTRATADA:** **{{imobiliaria.nome}}**, pessoa jurídica de direito privado, CNPJ nº {{imobiliaria.cnpj}}, **CRECI-PJ nº {{imobiliaria.creci}}**, sediada em {{imobiliaria.endereco_completo}}, e-mail {{imobiliaria.email}}, telefone {{imobiliaria.telefone}}, neste ato representada por **{{imobiliaria.responsavel_tecnico}}**, **CRECI-F nº {{imobiliaria.responsavel_creci}}**.

---

## CLÁUSULA 1ª — DAS FONTES NORMATIVAS APLICÁVEIS

**1.1.** O presente contrato rege-se, no que couber, pelas seguintes normas: **Código Civil**, em especial arts. 412, 722 a 729 (corretagem) e 1.647 (outorga conjugal); **Lei nº 6.530/1978** e **Decreto nº 81.871/1978** (profissão de Corretor); **Lei nº 9.610/1998** (direitos autorais sobre material de divulgação); **Lei nº 13.709/2018** (LGPD); **Lei Complementar nº 214/2025** (IBS/CBS); **Resolução COFECI nº 1.504/2023**; e **Termo de Compromisso de Cessação CADE/COFECI**, de 14/03/2018, sobre a facultatividade da exclusividade.

---

## CLÁUSULA 2ª — DO OBJETO E DA AUTORIZAÇÃO

**2.1.** O(A) PROPRIETÁRIO(A), por sua livre e exclusiva vontade, **autoriza a IMOBILIÁRIA**, em caráter de **EXCLUSIVIDADE**, a promover a **{{captacao.modalidade}}** do imóvel adiante descrito, conferindo-lhe os poderes necessários à plena divulgação, intermediação e negociação:

**2.1.1.** Código interno: **{{imovel.codigo}}**; tipo: **{{imovel.tipo}}**; endereço completo: **{{imovel.endereco_completo}}**; matrícula nº **{{imovel.matricula}}** do Cartório de Registro de Imóveis de **{{imovel.cartorio}}**; inscrição imobiliária (IPTU) nº **{{imovel.inscricao_iptu}}**; área privativa **{{imovel.area_privativa}}**; vagas de garagem **{{imovel.vagas_garagem}}**.

**2.2. Valores autorizados de oferta:**

**2.2.1.** Valor de venda: **R$ {{captacao.valor_venda}} ({{captacao.valor_venda_extenso}})**;

**2.2.2.** Valor de locação mensal: **R$ {{captacao.valor_locacao}}**;

**2.2.3.** Margem de negociação autorizada: até **{{captacao.margem_negociacao_percentual}}%** sobre os valores de oferta.

**2.3.** A cláusula de exclusividade é firmada de forma **livre, voluntária e facultativa**, em conformidade com o **Termo de Compromisso de Cessação de Prática firmado entre o CADE e o COFECI em 14/03/2018**, sendo expressamente reconhecida pelas partes como medida adequada à eficiência da intermediação.

---

## CLÁUSULA 3ª — DO PRAZO DE EXCLUSIVIDADE

**3.1.** A presente autorização vigora pelo prazo de **{{captacao.prazo_exclusividade_meses}} ({{captacao.prazo_exclusividade_extenso}}) meses**, com início em **{{contrato.data_inicio}}** e término em **{{contrato.data_fim}}**.

**3.2.** O prazo poderá ser prorrogado mediante **aditivo escrito** assinado por ambas as partes, com no mínimo 15 (quinze) dias de antecedência ao termo final.

**3.3.** Findo o prazo sem a concretização do negócio, a exclusividade extingue-se de pleno direito, ressalvado o disposto na Cláusula 10 (período de proteção pós-contratual).

---

## CLÁUSULA 4ª — DA COMISSÃO

**4.1.** Pela intermediação bem-sucedida, será devida à IMOBILIÁRIA, a título de comissão:

**4.1.1.** **Em caso de VENDA:** **{{contrato.comissao_venda_pct}}%** sobre o valor efetivo da transação, observado o piso da tabela CRECI da respectiva região;

**4.1.2.** **Em caso de LOCAÇÃO:** o equivalente a **1 (um) aluguel mensal**, sem prejuízo da taxa de administração se contratada em separado a gestão da locação;

**4.1.3.** **Em caso de PERMUTA:** **{{contrato.comissao_venda_pct}}%** sobre o valor de cada bem permutado, devida por cada parte à respectiva imobiliária intermediadora.

**4.2.** A comissão será paga pelo(a) PROPRIETÁRIO(A) à IMOBILIÁRIA da seguinte forma:

**4.2.1.** **Venda:** no ato do recebimento do **sinal/arras** (ou na assinatura da escritura pública, caso não haja sinal), conforme art. 725 do Código Civil;

**4.2.2.** **Locação:** retida do **primeiro aluguel** efetivamente pago pelo locatário.

**4.3. Direito à comissão integral.** Nos termos do **art. 725 c/c art. 726 do Código Civil**, a comissão será integralmente devida sempre que:

**4.3.1.** o resultado útil for alcançado por meio dos esforços da IMOBILIÁRIA;

**4.3.2.** o negócio deixar de se concretizar por arrependimento de qualquer das partes após a aceitação da proposta;

**4.3.3.** o(a) PROPRIETÁRIO(A) celebrar diretamente o negócio, durante a vigência da exclusividade, com cliente apresentado pela IMOBILIÁRIA — caso em que a comissão é devida ainda que sem a mediação direta da IMOBILIÁRIA, salvo comprovada inércia ou ociosidade desta.

---

## CLÁUSULA 5ª — DAS OBRIGAÇÕES DA IMOBILIÁRIA

**5.1.** Constituem obrigações da IMOBILIÁRIA, em diligência compatível com a natureza da intermediação (art. 723 do CC):

**5.1.1.** realizar sessão fotográfica profissional do imóvel, com no mínimo **{{captacao.numero_minimo_fotos}}** imagens em alta resolução, e tour virtual 360º quando aplicável;

**5.1.2.** anunciar e divulgar o imóvel nos seguintes canais, no mínimo: site próprio da {{imobiliaria.nome}}, portais ZAP Imóveis, Viva Real, OLX Imóveis, ImovelWeb, redes sociais (Instagram, Facebook), e mídia segmentada local;

**5.1.3.** instalar placa ou totem de identificação no imóvel, observada a legislação municipal e o regulamento condominial;

**5.1.4.** promover visitas agendadas, acompanhando pessoalmente o(s) interessado(s) e mantendo registro das visitas;

**5.1.5.** apresentar e analisar propostas ao(à) PROPRIETÁRIO(A) por escrito, no prazo máximo de 48 (quarenta e oito) horas do recebimento;

**5.1.6.** conduzir as negociações com lealdade, transparência e sigilo;

**5.1.7.** verificar a regularidade documental dos eventuais compradores ou locatários (art. 723, parágrafo único, do CC);

**5.1.8.** prestar contas das gestões realizadas, sempre que solicitado;

**5.1.9.** manter sigilo quanto a informações pessoais e patrimoniais do(a) PROPRIETÁRIO(A) (LGPD).

---

## CLÁUSULA 6ª — DAS OBRIGAÇÕES DO(A) PROPRIETÁRIO(A)

**6.1.** Constituem obrigações do(a) PROPRIETÁRIO(A):

**6.1.1.** não negociar paralelamente, direta ou indiretamente, durante a vigência da exclusividade, com qualquer interessado, seja por conta própria, parente, preposto ou outra imobiliária;

**6.1.2.** encaminhar imediatamente à IMOBILIÁRIA quaisquer interessados que o procurem diretamente;

**6.1.3.** fornecer e manter atualizada toda a documentação necessária à transação, em especial: matrícula atualizada (até 30 dias); certidões negativas de ônus reais e ações reipersecutórias; certidão negativa de débitos do imóvel (IPTU); declaração de quitação condominial; Habite-se, planta aprovada e ART/RRT (quando aplicável); documentos pessoais do(a) proprietário(a) e cônjuge, certidões pessoais;

**6.1.4.** declarar veracidade das informações sobre o imóvel, inexistência de vícios ocultos, ônus, gravames, litígios, leilões ou qualquer restrição;

**6.1.5.** manter o imóvel apresentável e disponibilizá-lo para visitas em horários razoáveis, mediante agendamento prévio;

**6.1.6.** comunicar previamente qualquer alteração no preço, condições ou disponibilidade;

**6.1.7.** pagar a comissão nos termos da Cláusula 4ª;

**6.1.8.** não retirar de circulação as fotos, vídeos e materiais produzidos pela IMOBILIÁRIA durante a vigência, ressalvado o término do contrato.

---

## CLÁUSULA 7ª — DOS DIREITOS AUTORAIS DO MATERIAL DE DIVULGAÇÃO

**7.1.** Todo o material de divulgação (fotografias, vídeos, tour virtual, plantas humanizadas, descritivos, anúncios) é de **propriedade intelectual exclusiva da IMOBILIÁRIA**, nos termos da **Lei nº 9.610/1998**.

**7.2.** Em caso de não fechamento do negócio ou rescisão deste contrato, a IMOBILIÁRIA compromete-se a:

**7.2.1.** retirar de circulação o material em até 5 (cinco) dias úteis;

**7.2.2.** disponibilizar ao(à) PROPRIETÁRIO(A) cópia digital das fotografias produzidas, em resolução padrão (não comercial), mediante reembolso simbólico de **R$ {{captacao.taxa_devolucao_material}}** referente ao custo de produção, quando assim acordado.

**7.3.** Fica vedado ao(à) PROPRIETÁRIO(A) ceder o material a outras imobiliárias ou utilizá-lo para divulgação comercial sem autorização escrita da IMOBILIÁRIA.

---

## CLÁUSULA 8ª — DA EXCLUSIVIDADE — DEVER DE NÃO CONCORRÊNCIA

**8.1.** Durante toda a vigência deste contrato, o(a) PROPRIETÁRIO(A) **obriga-se a não outorgar autorização similar** a outro corretor ou imobiliária, nem a praticar diretamente atos de venda ou locação, conforme **art. 726 do Código Civil**.

**8.2. Reconhecimento expresso.** A exclusividade é juridicamente válida quando livremente pactuada, conforme jurisprudência consolidada e Termo CADE/COFECI de 14/03/2018, vedando-se apenas a sua imposição compulsória ou unilateral.

---

## CLÁUSULA 9ª — DA MULTA POR QUEBRA DE EXCLUSIVIDADE

**9.1. Hipóteses cumulativas.** O descumprimento da exclusividade pelo(a) PROPRIETÁRIO(A) — caracterizado por (i) celebração direta de venda/locação durante a vigência, (ii) outorga simultânea a outra imobiliária, ou (iii) recusa injustificada de proposta dentro dos parâmetros autorizados — implicará as consequências cumulativas a seguir:

**9.1.1.** **Pagamento integral da comissão** prevista na Cláusula 4ª, calculada sobre o valor de oferta autorizado, ainda que o negócio se faça sem a mediação direta da IMOBILIÁRIA (art. 726 do CC); E

**9.1.2.** **Cláusula penal compensatória adicional**, **destinada a indenizar danos diversos** (despesas comprovadas de marketing, fotografia, divulgação e oportunidade perdida), equivalente a **{{captacao.multa_quebra_percentual}}%** sobre o valor de oferta, observado o teto previsto no art. 412 do Código Civil.

**9.1.3. Reembolso** das despesas extrajudiciais e judiciais de cobrança, inclusive **honorários advocatícios** fixados em 20% sobre o valor cobrado.

**9.2.** As verbas dos itens 9.1.1 e 9.1.2 **não configuram bis in idem**, eis que a primeira remunera o resultado útil obtido (corretagem ex art. 725 c/c 726 do CC) e a segunda indeniza danos materiais distintos da própria comissão. Caso a IMOBILIÁRIA opte por uma das verbas em detrimento da outra, deverá fazê-lo expressamente em manifestação escrita, sob pena de presumir-se a cumulação.

**9.3. Rescisão antecipada sem justa causa pelo(a) PROPRIETÁRIO(A)**, antes do término do prazo de exclusividade, ensejará o pagamento da cláusula penal prevista no item 9.1.2, salvo comprovada inércia ou ociosidade da IMOBILIÁRIA.

---

## CLÁUSULA 10 — DA PROTEÇÃO PÓS-CONTRATUAL (TAIL PERIOD)

**10.1.** Caso, no prazo de **{{captacao.prazo_protecao_dias}} ({{captacao.prazo_protecao_extenso}}) dias** subsequentes ao término ou rescisão deste contrato, o(a) PROPRIETÁRIO(A) celebre venda ou locação com **interessado anteriormente apresentado pela IMOBILIÁRIA** — comprovado por registro de visita, troca de e-mails, propostas escritas, mensagens ou cadastro —, será integralmente devida a comissão prevista na Cláusula 4ª, à luz do art. 725 do Código Civil.

**10.2.** A IMOBILIÁRIA fornecerá, ao término deste contrato, **lista escrita** dos interessados apresentados durante a vigência, para ciência do(a) PROPRIETÁRIO(A).

---

## CLÁUSULA 11 — DAS DECLARAÇÕES E GARANTIAS DO(A) PROPRIETÁRIO(A)

**11.1.** O(A) PROPRIETÁRIO(A) declara, sob as penas da lei:

**11.1.1.** ser legítimo titular do domínio do imóvel, com plena capacidade de aliená-lo ou alugá-lo;

**11.1.2.** estar o imóvel livre e desembaraçado de ônus, hipotecas, penhoras, ações reipersecutórias, restrições judiciais ou administrativas;

**11.1.3.** inexistirem débitos de IPTU, condomínio ou tributos vinculados;

**11.1.4.** não haver vícios ocultos que comprometam o uso ou o valor do imóvel;

**11.1.5.** estar regular a posse e a documentação, sob exclusiva responsabilidade civil e criminal.

---

## CLÁUSULA 12 — DA CLÁUSULA TRIBUTÁRIA — REFORMA TRIBUTÁRIA (IBS/CBS)

**12.1.** A comissão é serviço sujeito a **IBS/CBS**, que serão destacados em separado na **NFS-e Nacional** emitida pela IMOBILIÁRIA, observado o cronograma de obrigatoriedade vigente.

**12.2.** As alíquotas e regras aqui pactuadas serão **automaticamente atualizadas** conforme cronograma da **LC nº 214/2025** e normas infralegais subsequentes, **sem necessidade de aditivo**, salvo se a alteração afetar o **equilíbrio econômico-financeiro** de forma relevante (art. 478 do CC).

**12.3.** Os tributos integram o valor da comissão pactuada (gross-up), salvo previsão em contrário ajustada por escrito.

---

## CLÁUSULA 13 — DA PROTEÇÃO DE DADOS (LGPD)

**13.1.** As partes observarão a **Lei nº 13.709/2018** (LGPD), autorizando o tratamento de dados estritamente para a execução deste contrato, prospecção de interessados e cumprimento de obrigações legais.

**13.2. Papéis das partes.** A **{{imobiliaria.nome}}** atua como **OPERADORA** dos dados pessoais do(a) PROPRIETÁRIO(A) (no contexto da intermediação) e como **CONTROLADORA** dos dados de seus próprios funcionários, fornecedores e operações internas. O(A) **PROPRIETÁRIO(A)** é o(a) **CONTROLADOR(A)** dos seus próprios dados e dos dados do imóvel. As partes adotarão controles técnicos e administrativos compatíveis.

**13.3.** Encarregado(a)/DPO: **{{imobiliaria.dpo_nome}}** — e-mail **{{imobiliaria.email_dpo}}**.

---

## CLÁUSULA 14 — DA ASSINATURA ELETRÔNICA

**14.1.** As partes adotam a **assinatura eletrônica** como forma válida de manifestação de vontade, nos termos da **MP nº 2.200-2/2001** e da **Lei nº 14.063/2020**, dispensando-se reconhecimento de firma e testemunhas físicas, conforme art. 784, §4º, do CPC.

**14.2.** O presente contrato e seus aditivos constituem **título executivo extrajudicial**, na forma do **art. 784, III, do CPC** (instrumento particular assinado pelas partes e por duas testemunhas), ou do **art. 784, §4º**, do CPC, quando assinado por meio eletrônico em forma equivalente.

---

## CLÁUSULA 15 — DAS DISPOSIÇÕES GERAIS

**15.1.** Eventuais alterações dependerão de aditivo escrito assinado por ambas as partes.

**15.2.** A nulidade de qualquer cláusula não afetará a validade das demais.

**15.3.** Este contrato obriga as partes, seus herdeiros e sucessores, a qualquer título.

**15.4.** Constituem **anexos** integrantes deste contrato:

**15.4.1. Anexo I** — Documentação do imóvel (matrícula, IPTU, certidões);

**15.4.2. Anexo II** — Termo de Vistoria fotográfica para captação;

**15.4.3. Anexo III** — Termo LGPD.

---

## CLÁUSULA 16 — DO FORO

**16.1.** Fica eleito o **Foro da Comarca de {{cidade.foro}}**, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir dúvidas e controvérsias decorrentes deste contrato.

---

E, por estarem assim, justas e contratadas, as partes firmam o presente instrumento, de forma física ou eletrônica, em via única de igual teor e forma.

**{{cidade.foro}}, {{contrato.data_emissao}}.**

---

## ASSINATURAS


_________________________________________
**PROPRIETÁRIO(A):** {{proprietario.nome}}
CPF/CNPJ: {{proprietario.cpf_cnpj}}


_________________________________________
**CÔNJUGE:** {{proprietario.conjuge_nome}}
CPF: {{proprietario.conjuge_cpf}}
*(quando exigida outorga conjugal — art. 1.647 do CC)*


_________________________________________
**IMOBILIÁRIA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}} · CRECI-PJ: {{imobiliaria.creci}}
Resp. Téc.: {{imobiliaria.responsavel_tecnico}} · CRECI-F: {{imobiliaria.responsavel_creci}}


### TESTEMUNHAS

**1.** _________________________________________
Nome: {{testemunha1.nome}} · CPF: {{testemunha1.cpf_cnpj}}


**2.** _________________________________________
Nome: {{testemunha2.nome}} · CPF: {{testemunha2.cpf_cnpj}}
`
