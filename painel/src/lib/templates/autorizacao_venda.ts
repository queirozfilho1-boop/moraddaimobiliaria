export const TEMPLATE_AUTORIZACAO_VENDA = `# AUTORIZAÇÃO DE VENDA DE IMÓVEL

## CORRETAGEM IMOBILIÁRIA SEM EXCLUSIVIDADE — PADRÃO MORADDA

**Contrato nº {{contrato.numero}}**

---

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, a presente **Autorização de {{captacao.modalidade}} com Prestação de Serviços de Corretagem Imobiliária, em caráter NÃO EXCLUSIVO**, regida pelos **arts. 722 a 729 do Código Civil**, pela **Lei nº 6.530/1978** e **Decreto nº 81.871/1978** (profissão de Corretor de Imóveis), pela **Resolução COFECI nº 1.504/2023**, pela **Lei nº 9.610/1998** (Direitos Autorais), pela **Lei nº 13.709/2018** (LGPD), pela **Lei Complementar nº 214/2025** (Reforma Tributária — IBS/CBS), pela **MP nº 2.200-2/2001** e pela **Lei nº 14.063/2020** (assinatura eletrônica), sob as cláusulas e condições seguintes.

*(Onde se lê {{captacao.modalidade}}: VENDA, LOCAÇÃO ou VENDA E LOCAÇÃO.)*

---

## DAS PARTES

**PROPRIETÁRIO(A) / CONTRATANTE:** {{proprietario.nome}}, {{proprietario.nacionalidade}}, {{proprietario.estado_civil}}, {{proprietario.profissao}}, portador(a) do RG nº {{proprietario.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{proprietario.cpf_cnpj}}, residente e domiciliado(a) em {{proprietario.endereco_completo}}, e-mail {{proprietario.email}}, telefone {{proprietario.telefone}}{{#if proprietario.conjuge_nome}}; e cônjuge **{{proprietario.conjuge_nome}}**, CPF nº {{proprietario.conjuge_cpf}}, na forma da outorga conjugal exigida pelo art. 1.647 do Código Civil{{/if}}.

**IMOBILIÁRIA / CONTRATADA:** **{{imobiliaria.nome}}**, pessoa jurídica de direito privado, CNPJ nº {{imobiliaria.cnpj}}, **CRECI-PJ nº {{imobiliaria.creci}}**, sediada em {{imobiliaria.endereco_completo}}, e-mail {{imobiliaria.email}}, telefone {{imobiliaria.telefone}}, neste ato representada por **{{imobiliaria.responsavel_tecnico}}**, **CRECI-F nº {{imobiliaria.responsavel_creci}}**.

---

## CLÁUSULA 1ª — DAS FONTES NORMATIVAS APLICÁVEIS

**1.1.** A presente autorização rege-se, no que couber, pelas seguintes normas: **Código Civil**, em especial arts. 722 a 729 (corretagem) e 1.647 (outorga conjugal); **Lei nº 6.530/1978** e **Decreto nº 81.871/1978** (profissão de Corretor); **Lei nº 9.610/1998** (direitos autorais sobre material de divulgação); **Lei nº 13.709/2018** (LGPD); **Lei Complementar nº 214/2025** (IBS/CBS); e **Resolução COFECI nº 1.504/2023**.

---

## CLÁUSULA 2ª — DO OBJETO E DA AUTORIZAÇÃO (SEM EXCLUSIVIDADE)

**2.1.** O(A) PROPRIETÁRIO(A), por sua livre vontade, **autoriza a IMOBILIÁRIA**, em caráter **NÃO EXCLUSIVO**, a promover a **{{captacao.modalidade}}** do imóvel adiante descrito, conferindo-lhe os poderes necessários à divulgação, intermediação e negociação:

**2.1.1.** Código interno: **{{imovel.codigo}}**; tipo: **{{imovel.tipo}}**; endereço completo: **{{imovel.endereco_completo}}**{{#if imovel.matricula}}; matrícula nº **{{imovel.matricula}}** do Cartório de Registro de Imóveis de **{{imovel.cartorio}}**{{/if}}{{#if imovel.inscricao_iptu}}; inscrição imobiliária (IPTU) nº **{{imovel.inscricao_iptu}}**{{/if}}{{#if imovel.area_privativa}}; área privativa **{{imovel.area_privativa}}**{{/if}}{{#if imovel.vagas_garagem}}; vagas de garagem **{{imovel.vagas_garagem}}**{{/if}}.

**2.2. Valores autorizados de oferta:**

{{#if captacao.valor_venda}}**2.2.1.** Valor de venda: **R$ {{captacao.valor_venda}} ({{captacao.valor_venda_extenso}})**;
{{/if}}{{#if contrato.valor_aluguel}}**2.2.2.** Valor de locação mensal: **{{contrato.valor_aluguel_fmt}}**;
{{/if}}**2.2.3.** Margem de negociação autorizada: até **{{captacao.margem_negociacao_percentual}}%** sobre os valores de oferta.

**2.3. Ausência de exclusividade.** Esta autorização **não impede** o(a) PROPRIETÁRIO(A) de negociar o imóvel diretamente ou por meio de outros corretores/imobiliárias, observado, porém, o disposto nas Cláusulas 4ª (comissão por resultado da intermediação da IMOBILIÁRIA) e 8ª (comunicação e clientes apresentados).

---

## CLÁUSULA 3ª — DO PRAZO DE VIGÊNCIA

**3.1.** A presente autorização vigora pelo prazo de **{{captacao.prazo_exclusividade_meses}} ({{captacao.prazo_exclusividade_extenso}}) meses**, com início em **{{contrato.data_inicio}}** e término em **{{contrato.data_fim}}**.

**3.2.** O prazo poderá ser prorrogado mediante **aditivo escrito**, e a autorização poderá ser **revogada a qualquer tempo** pelo(a) PROPRIETÁRIO(A), mediante comunicação escrita, respeitados os negócios em andamento e o disposto na Cláusula 9ª (proteção dos clientes apresentados).

---

## CLÁUSULA 4ª — DA COMISSÃO

**4.1.** Pela intermediação bem-sucedida **realizada pela IMOBILIÁRIA**, será devida a comissão:

**4.1.1.** **Em caso de VENDA:** **{{contrato.comissao_venda_pct}}% ({{contrato.comissao_venda_pct_extenso}})** sobre o valor efetivo da transação, observado o piso da tabela CRECI da respectiva região;

**4.1.2.** **Em caso de LOCAÇÃO:** o equivalente a **1 (um) aluguel mensal**, sem prejuízo da taxa de administração se contratada em separado a gestão da locação;

**4.1.3.** **Em caso de PERMUTA:** **{{contrato.comissao_venda_pct}}% ({{contrato.comissao_venda_pct_extenso}})** sobre o valor de cada bem permutado, devida por cada parte à respectiva imobiliária intermediadora.

**4.2.** A comissão será paga pelo(a) PROPRIETÁRIO(A) à IMOBILIÁRIA da seguinte forma:

**4.2.1.** **Venda:** no ato do recebimento do **sinal/arras** (ou na assinatura da escritura pública, caso não haja sinal), conforme art. 725 do Código Civil;

**4.2.2.** **Locação:** retida do **primeiro aluguel** efetivamente pago pelo locatário.

**4.3. Devida a comissão** (arts. 725 e 726, primeira parte, do Código Civil) sempre que:

**4.3.1.** o resultado útil for alcançado por meio dos esforços da IMOBILIÁRIA;

**4.3.2.** o negócio deixar de se concretizar por arrependimento de qualquer das partes após a aceitação de proposta obtida pela IMOBILIÁRIA;

**4.3.3.** o(a) PROPRIETÁRIO(A) celebrar o negócio, ainda que diretamente, com **cliente apresentado pela IMOBILIÁRIA** (registro de visita, propostas, mensagens ou cadastro), durante a vigência ou no período de proteção da Cláusula 9ª.

**4.4.** **Não será devida comissão** quando o negócio for celebrado com interessado que **não tenha sido apresentado** pela IMOBILIÁRIA, seja diretamente pelo(a) PROPRIETÁRIO(A), seja por outro intermediador.

---

## CLÁUSULA 5ª — DAS OBRIGAÇÕES DA IMOBILIÁRIA

**5.1.** Constituem obrigações da IMOBILIÁRIA, em diligência compatível com a natureza da intermediação (art. 723 do CC):

**5.1.1.** produzir material de divulgação do imóvel (fotografias e, quando aplicável, vídeo e tour virtual);

**5.1.2.** anunciar e divulgar o imóvel em seu site, portais imobiliários e redes sociais;

**5.1.3.** instalar placa de identificação no imóvel, **mediante autorização do(a) PROPRIETÁRIO(A)** e observada a legislação municipal e o regulamento condominial;

**5.1.4.** promover visitas agendadas, acompanhando pessoalmente o(s) interessado(s) e mantendo registro das visitas;

**5.1.5.** apresentar e analisar propostas ao(à) PROPRIETÁRIO(A) por escrito, no prazo máximo de 48 (quarenta e oito) horas do recebimento;

**5.1.6.** conduzir as negociações com lealdade, transparência e sigilo;

**5.1.7.** verificar a regularidade documental dos eventuais compradores ou locatários (art. 723, parágrafo único, do CC);

**5.1.8.** prestar contas das gestões realizadas, sempre que solicitado;

**5.1.9.** manter sigilo quanto a informações pessoais e patrimoniais do(a) PROPRIETÁRIO(A) (LGPD).

---

## CLÁUSULA 6ª — DAS OBRIGAÇÕES DO(A) PROPRIETÁRIO(A)

**6.1.** Constituem obrigações do(a) PROPRIETÁRIO(A):

**6.1.1.** fornecer e manter atualizada a documentação necessária à transação, em especial: matrícula atualizada, certidões do imóvel (IPTU) e declaração de quitação condominial, documentos pessoais do(a) proprietário(a) e cônjuge;

**6.1.2.** declarar veracidade das informações sobre o imóvel, inexistência de vícios ocultos, ônus, gravames, litígios ou qualquer restrição;

**6.1.3.** manter o imóvel apresentável e disponibilizá-lo para visitas em horários razoáveis, mediante agendamento prévio;

**6.1.4.** comunicar previamente qualquer alteração no preço, condições ou disponibilidade;

**6.1.5.** **comunicar imediatamente** à IMOBILIÁRIA a venda ou locação do imóvel realizada por conta própria ou por terceiros, para a retirada dos anúncios;

**6.1.6.** pagar a comissão nos termos da Cláusula 4ª, quando devida.

---

## CLÁUSULA 7ª — DOS DIREITOS AUTORAIS DO MATERIAL DE DIVULGAÇÃO

**7.1.** Todo o material de divulgação produzido pela IMOBILIÁRIA (fotografias, vídeos, tour virtual, plantas humanizadas, descritivos, anúncios) é de **propriedade intelectual exclusiva da IMOBILIÁRIA**, nos termos da **Lei nº 9.610/1998**.

**7.2.** Encerrada a autorização, a IMOBILIÁRIA retirará o material de circulação em até 5 (cinco) dias úteis.

**7.3.** Fica vedado ao(à) PROPRIETÁRIO(A) ceder o material a outras imobiliárias ou utilizá-lo para divulgação comercial sem autorização escrita da IMOBILIÁRIA.

---

## CLÁUSULA 8ª — DA NEGOCIAÇÃO PARALELA E DA BOA-FÉ

**8.1.** O(A) PROPRIETÁRIO(A) permanece **livre para negociar** o imóvel por conta própria ou por outros intermediadores, sem multa ou penalidade por essa conduta.

**8.2.** Em respeito à boa-fé objetiva (art. 422 do CC), o(a) PROPRIETÁRIO(A) obriga-se a **não utilizar a IMOBILIÁRIA como fonte de interessados para concluir negócio direto** com cliente por ela apresentado, hipótese em que a comissão da Cláusula 4ª será integralmente devida (art. 726 do CC).

**8.3.** Recomenda-se ao(à) PROPRIETÁRIO(A) comunicar à IMOBILIÁRIA os interessados que já estejam em negociação direta antes desta autorização, para registro e exclusão do escopo.

---

## CLÁUSULA 9ª — DA PROTEÇÃO PÓS-CONTRATUAL (CLIENTES APRESENTADOS)

**9.1.** Caso, no prazo de **{{captacao.prazo_protecao_dias}} ({{captacao.prazo_protecao_extenso}}) dias** subsequentes ao término ou revogação desta autorização, o(a) PROPRIETÁRIO(A) celebre venda ou locação com **interessado anteriormente apresentado pela IMOBILIÁRIA** — comprovado por registro de visita, troca de e-mails, propostas escritas, mensagens ou cadastro —, será integralmente devida a comissão prevista na Cláusula 4ª, à luz do art. 725 do Código Civil.

**9.2.** A IMOBILIÁRIA fornecerá, ao término desta autorização, **lista escrita** dos interessados apresentados durante a vigência, para ciência do(a) PROPRIETÁRIO(A).

---

## CLÁUSULA 10 — DAS DECLARAÇÕES E GARANTIAS DO(A) PROPRIETÁRIO(A)

**10.1.** O(A) PROPRIETÁRIO(A) declara, sob as penas da lei:

**10.1.1.** ser legítimo titular do domínio do imóvel, com plena capacidade de aliená-lo ou alugá-lo;

**10.1.2.** estar o imóvel livre e desembaraçado de ônus, hipotecas, penhoras, ações reipersecutórias, restrições judiciais ou administrativas, salvo as informadas por escrito;

**10.1.3.** inexistirem débitos de IPTU, condomínio ou tributos vinculados, salvo os informados por escrito;

**10.1.4.** não haver vícios ocultos que comprometam o uso ou o valor do imóvel.

---

## CLÁUSULA 11 — DA CLÁUSULA TRIBUTÁRIA — REFORMA TRIBUTÁRIA (IBS/CBS)

**11.1.** A comissão é serviço sujeito a **IBS/CBS**, que serão destacados em separado na **NFS-e Nacional** emitida pela IMOBILIÁRIA, observado o cronograma de obrigatoriedade vigente.

**11.2.** As alíquotas e regras aqui pactuadas serão **automaticamente atualizadas** conforme cronograma da **LC nº 214/2025** e normas infralegais subsequentes, **sem necessidade de aditivo**, salvo se a alteração afetar o **equilíbrio econômico-financeiro** de forma relevante (art. 478 do CC).

---

## CLÁUSULA 12 — DA PROTEÇÃO DE DADOS (LGPD)

**12.1.** As partes observarão a **Lei nº 13.709/2018** (LGPD), autorizando o tratamento de dados estritamente para a execução desta autorização, prospecção de interessados e cumprimento de obrigações legais.

**12.2.** Encarregado(a)/DPO: **{{imobiliaria.dpo_nome}}** — e-mail **{{imobiliaria.email_dpo}}**.

---

## CLÁUSULA 13 — DA ASSINATURA ELETRÔNICA

**13.1.** As partes adotam a **assinatura eletrônica** como forma válida de manifestação de vontade, nos termos da **MP nº 2.200-2/2001** e da **Lei nº 14.063/2020**, dispensando-se reconhecimento de firma e testemunhas físicas, conforme art. 784, §4º, do CPC.

---

## CLÁUSULA 14 — DAS DISPOSIÇÕES GERAIS

**14.1.** Eventuais alterações dependerão de aditivo escrito assinado por ambas as partes.

**14.2.** A nulidade de qualquer cláusula não afetará a validade das demais.

**14.3.** Esta autorização obriga as partes, seus herdeiros e sucessores, a qualquer título.

---

## CLÁUSULA 15 — DO FORO

**15.1.** Fica eleito o **Foro da Comarca de {{cidade.foro}}**, com renúncia expressa a qualquer outro, para dirimir dúvidas e controvérsias decorrentes desta autorização.

---

E, por estarem assim, justas e contratadas, as partes firmam o presente instrumento, de forma física ou eletrônica, em via única de igual teor e forma.

**{{cidade.foro}}, {{contrato.data_emissao}}.**

---

## ASSINATURAS


_________________________________________
**PROPRIETÁRIO(A):** {{proprietario.nome}}
CPF/CNPJ: {{proprietario.cpf_cnpj}}


{{#if proprietario.conjuge_nome}}_________________________________________
**CÔNJUGE:** {{proprietario.conjuge_nome}}
CPF: {{proprietario.conjuge_cpf}}
*(outorga conjugal — art. 1.647 do CC)*


{{/if}}_________________________________________
**IMOBILIÁRIA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}} · CRECI-PJ: {{imobiliaria.creci}}
Resp. Téc.: {{imobiliaria.responsavel_tecnico}} · CRECI-F: {{imobiliaria.responsavel_creci}}


### TESTEMUNHAS

**1.** _________________________________________
Nome: {{testemunha1.nome}}{{#if testemunha1.cpf_cnpj}} · CPF: {{testemunha1.cpf_cnpj}}{{/if}}


**2.** _________________________________________
Nome: {{testemunha2.nome}}{{#if testemunha2.cpf_cnpj}} · CPF: {{testemunha2.cpf_cnpj}}{{/if}}
`
