export const TEMPLATE_ADMINISTRACAO = `# CONTRATO DE ADMINISTRAÇÃO DE IMÓVEL

## PRESTAÇÃO DE SERVIÇOS COM OUTORGA DE PODERES — PADRÃO MORADDA

**Contrato nº {{contrato.numero}}**

---

Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas têm entre si, justo e contratado, o presente **Contrato de Prestação de Serviços de Administração de Imóvel com Outorga de Poderes**, regido pela **Lei nº 6.530/1978** e **Decreto nº 81.871/1978** (profissão de Corretor de Imóveis), pelos **arts. 653 a 692 do Código Civil** (mandato), pelos **arts. 722 a 729 do Código Civil** (corretagem), pela **Lei nº 8.245/1991** (Inquilinato), pela **Resolução COFECI nº 1.504/2023**, pela **Lei nº 13.709/2018** (LGPD), pela **Lei Complementar nº 214/2025** (Reforma Tributária — IBS/CBS), pela **MP nº 2.200-2/2001** e pela **Lei nº 14.063/2020** (assinatura eletrônica), sob as cláusulas e condições seguintes.

---

## DAS PARTES

**PROPRIETÁRIO(A) / CONTRATANTE:** {{proprietario.nome}}, {{proprietario.nacionalidade}}, {{proprietario.estado_civil}}, {{proprietario.profissao}}, portador(a) do RG nº {{proprietario.rg}}, inscrito(a) no CPF/CNPJ sob o nº {{proprietario.cpf_cnpj}}, residente e domiciliado(a) em {{proprietario.endereco_completo}}, e-mail {{proprietario.email}}, telefone {{proprietario.telefone}}.

**ADMINISTRADORA / CONTRATADA:** **{{imobiliaria.nome}}**, pessoa jurídica de direito privado, CNPJ nº {{imobiliaria.cnpj}}, **CRECI-PJ nº {{imobiliaria.creci}}**, sediada em {{imobiliaria.endereco_completo}}, e-mail {{imobiliaria.email}}, telefone {{imobiliaria.telefone}}, neste ato representada por seu(sua) Responsável Técnico(a) **{{imobiliaria.responsavel_tecnico}}**, **CRECI-F nº {{imobiliaria.responsavel_creci}}**.

---

## CLÁUSULA 1ª — DAS FONTES NORMATIVAS APLICÁVEIS

**1.1.** O presente contrato rege-se, no que couber, pelas seguintes normas: **Código Civil**, em especial arts. 653 a 692 (mandato) e 722 a 729 (corretagem); **Lei nº 6.530/1978** e **Decreto nº 81.871/1978** (profissão de Corretor); **Lei nº 8.245/1991** (Inquilinato); **Lei nº 13.709/2018** (LGPD); **Lei Complementar nº 214/2025** (IBS/CBS); **Resolução COFECI nº 1.504/2023**; **MP nº 2.200-2/2001** e **Lei nº 14.063/2020** (assinatura eletrônica).

---

## CLÁUSULA 2ª — DO OBJETO

**2.1.** Constitui objeto deste contrato a **prestação dos serviços de administração imobiliária**, pela ADMINISTRADORA, do imóvel adiante descrito, de propriedade do(a) CONTRATANTE:

**2.1.1.** Código interno: **{{imovel.codigo}}**; tipo: **{{imovel.tipo}}**; endereço completo: **{{imovel.endereco_completo}}**{{#if imovel.matricula}}; matrícula nº **{{imovel.matricula}}** do Cartório de Registro de Imóveis de **{{imovel.cartorio}}**{{/if}}{{#if imovel.inscricao_iptu}}; inscrição imobiliária (IPTU) nº **{{imovel.inscricao_iptu}}**{{/if}}{{#if imovel.area_privativa}}; área privativa **{{imovel.area_privativa}}**{{/if}}.

**2.2.** A administração compreende as atividades descritas na Cláusula 4ª, executadas em nome e por conta do(a) PROPRIETÁRIO(A), mediante outorga dos poderes constantes da Cláusula 3ª.

---

## CLÁUSULA 3ª — DA OUTORGA DE PODERES (PROCURAÇÃO)

**3.1.** Pelo presente, e como condição inerente ao mandato administrativo, o(a) PROPRIETÁRIO(A) **outorga à ADMINISTRADORA poderes especiais**, nos termos dos arts. 653 e seguintes do Código Civil, para:

**3.1.1.** anunciar, divulgar, fotografar e ofertar o imóvel em portais imobiliários, redes sociais, mídias e canais próprios;

**3.1.2.** negociar e celebrar **contratos de locação** em nome do(a) PROPRIETÁRIO(A), nas condições mínimas previstas na Cláusula 5ª;

**3.1.3.** selecionar locatários, exigir e analisar documentos, garantias e referências;

**3.1.4.** realizar vistorias de entrada e saída e elaborar laudos;

**3.1.5.** receber aluguéis, encargos, multas, juros, caução e demais valores decorrentes da locação, dando quitação;

**3.1.6.** emitir cobranças e boletos, registrar negativações em órgãos de proteção ao crédito em caso de inadimplência;

**3.1.7.** promover cobranças extrajudiciais e, mediante prévia autorização escrita, contratar advogado para a fase judicial;

**3.1.8.** pagar, por conta e ordem do PROPRIETÁRIO, IPTU, condomínio, seguros e despesas vinculadas ao imóvel, quando expressamente autorizado;

**3.1.9.** notificar e dar quitação a locatários, fiadores e seguradoras;

**3.1.10.** emitir **NFS-e** em nome próprio referente aos honorários e, quando legalmente exigido, providenciar emissão de documento fiscal pelo PROPRIETÁRIO referente ao aluguel.

**3.2.** Os poderes ora outorgados **não incluem** alienação, oneração, hipoteca, doação ou qualquer ato de disposição do imóvel, ressalvada cláusula expressa em contrário.

---

## CLÁUSULA 4ª — DAS ATRIBUIÇÕES DA ADMINISTRADORA

**4.1.** Constituem obrigações da ADMINISTRADORA:

**4.1.1. Captação:** anunciar e promover o imóvel em meios próprios e parceiros, com fotos profissionais e descritivo técnico;

**4.1.2. Seleção do locatário:** análise cadastral, consulta a SPC/Serasa, verificação de renda compatível (em regra, aluguel + encargos não superior a 30% da renda bruta), análise de fiador, seguro-fiança, título de capitalização ou outra garantia legal (art. 37 da Lei nº 8.245/1991);

**4.1.3. Elaboração do contrato de locação** e instrumentos acessórios, observada a legislação vigente;

**4.1.4. Vistoria de entrada** com laudo fotográfico e descritivo, assinado pelo locatário;

**4.1.5. Cobrança e administração da inadimplência:** emissão de boletos, gestão de atrasos, notificações extrajudiciais, encaminhamento para cobrança judicial mediante autorização do PROPRIETÁRIO;

**4.1.6. Recebimento e repasse de aluguéis e encargos**, conforme Cláusula 7ª;

**4.1.7. Conservação e zeladoria** do imóvel: acompanhamento de pequenos reparos a cargo do locatário, intermediação de reparos estruturais a cargo do PROPRIETÁRIO mediante orçamento prévio;

**4.1.8. Vistoria de saída** e quitação ou cobrança das pendências constatadas;

**4.1.9. Prestação de contas mensal**, documentada e auditável, conforme Cláusula 8ª;

**4.1.10. Emissão de NFS-e** referente aos honorários de administração e de intermediação;

**4.1.11. Sigilo e proteção de dados** das partes envolvidas, em conformidade com a LGPD.

---

## CLÁUSULA 5ª — DAS CONDIÇÕES MÍNIMAS DA LOCAÇÃO

**5.1.** A ADMINISTRADORA fica autorizada a celebrar contratos de locação observados, no mínimo, os seguintes parâmetros, sem prejuízo de ajustes pontuais aprovados pelo PROPRIETÁRIO:

**5.1.1.** **Valor mínimo do aluguel:** {{contrato.valor_aluguel_fmt}};

**5.1.2.** **Reajuste anual** pelo **{{locacao.indice_reajuste}}** (IGP-M / IPCA);

**5.1.3.** **Prazo mínimo do contrato:** {{contrato.prazo_meses}} meses;

**5.1.4.** **Garantia exigida:** caução, fiador, seguro-fiança ou título de capitalização (art. 37 da Lei nº 8.245/1991);

**5.1.5.** **Multa contratual:** 3 (três) aluguéis, reduzida proporcionalmente ao tempo cumprido (art. 4º da Lei nº 8.245/1991).

---

## CLÁUSULA 6ª — DOS HONORÁRIOS

**6.1.** Pela administração, a ADMINISTRADORA fará jus aos seguintes honorários:

**6.1.1. Taxa de administração mensal:** **{{taxa_admin.percentual}}% ({{taxa_admin.percentual_extenso}})** sobre o valor bruto do aluguel efetivamente recebido, observado valor mínimo mensal pactuado em proposta;

**6.1.2. Comissão de intermediação locatícia (captação):** equivalente ao valor de **1 (um) aluguel**, retida do primeiro pagamento efetuado pelo locatário, conforme Resolução COFECI nº 1.504/2023;

**6.1.3. Honorário de cobrança extrajudicial** em caso de inadimplência, sobre os valores recuperados, sem ônus se a recuperação não ocorrer;

**6.1.4. Honorário de vistoria** (entrada e saída): valor por evento conforme proposta vigente.

**6.2.** Os honorários serão deduzidos diretamente dos valores recebidos, mediante demonstrativo discriminado, com a respectiva NFS-e emitida em nome do(a) PROPRIETÁRIO(A).

---

## CLÁUSULA 7ª — DA CLÁUSULA TRIBUTÁRIA — REFORMA TRIBUTÁRIA (IBS/CBS)

**7.1.** A ADMINISTRADORA é **contribuinte de IBS/CBS** sobre seus serviços de administração e intermediação, e os destacará em separado no documento fiscal, com a alíquota efetiva vigente no exercício.

**7.2.** As alíquotas, regimes específicos e regras aqui pactuadas serão **automaticamente atualizadas** conforme cronograma da **LC nº 214/2025** e normas infralegais subsequentes, **sem necessidade de aditivo**, salvo se a alteração afetar o **equilíbrio econômico-financeiro** de forma relevante (art. 478 do CC).

**7.3. Critérios cumulativos do PROPRIETÁRIO contribuinte.** A locação intermediada poderá sujeitar o(a) PROPRIETÁRIO(A) à incidência de **IBS/CBS** quando, **cumulativamente**, no exercício anterior, **(a) sua receita de locação superar o limite previsto na regulamentação** (a título referencial, R$ 240.000,00 anuais ou R$ 288.000,00 no curso do exercício, conforme normativa atual da LC nº 214/2025) **E (b) for titular de mais de 3 (três) imóveis distintos locados**. Estando preenchidos os dois critérios, aplicar-se-ão os redutores de alíquota e os redutores sociais por imóvel residencial previstos em lei.

**7.4.** Cabe ao(à) PROPRIETÁRIO(A) informar à ADMINISTRADORA sua condição de contribuinte ou não contribuinte, sob sua exclusiva responsabilidade fiscal, comprometendo-se a manter cadastro atualizado.

**7.5.** IPTU, taxa de lixo e cota condominial **não integram** a base de cálculo do IBS/CBS.

**7.6. Obrigatoriedade de NFS-e.** A ADMINISTRADORA emitirá **NFS-e Nacional** referente aos seus serviços, observado o cronograma da Receita Federal e do Comitê Gestor; quando exigida emissão de NFS-e referente ao aluguel pelo(a) PROPRIETÁRIO(A), a ADMINISTRADORA prestará apoio operacional para tanto.

<!-- TODO: REVISAR JURÍDICO: parametrizar limites quantitativos (R$ 240k / 3 imóveis) por placeholder, pois dependem de regulamentação infralegal e podem mudar a cada exercício. -->

---

## CLÁUSULA 8ª — DO REPASSE AO(À) PROPRIETÁRIO(A)

**8.1.** Os valores líquidos (aluguel + encargos recebidos, deduzidos os honorários, tributos e despesas autorizadas) serão repassados ao(à) PROPRIETÁRIO(A) até o **dia útil acordado em proposta**, mediante PIX/TED/depósito na conta indicada pelo PROPRIETÁRIO.

**8.2.** Em caso de inadimplência do locatário, a ADMINISTRADORA somente repassará valores efetivamente recebidos, **não respondendo, em hipótese alguma, pelo aluguel inadimplido**, salvo se houver contratado, em separado, garantia de repasse (boletim de garantia ou produto similar).

**8.3.** A ADMINISTRADORA disponibilizará ao(à) PROPRIETÁRIO(A) acesso a **portal digital próprio**, com extrato em tempo real de recebimentos, repasses, despesas e contas.

---

## CLÁUSULA 9ª — DA PRESTAÇÃO DE CONTAS

**9.1.** A ADMINISTRADORA prestará contas mensalmente, **até o último dia útil do mês subsequente ao da competência**, mediante demonstrativo eletrônico contendo:

**9.1.1.** aluguéis e encargos recebidos;

**9.1.2.** honorários retidos (com nº da NFS-e);

**9.1.3.** despesas pagas por conta do PROPRIETÁRIO (IPTU, condomínio etc., com cópia dos comprovantes);

**9.1.4.** valor líquido repassado;

**9.1.5.** saldo eventual e pendências.

**9.2.** As contas serão consideradas **tacitamente aprovadas** caso o(a) PROPRIETÁRIO(A) não apresente impugnação fundamentada por escrito no prazo de **60 (sessenta) dias** do recebimento, ressalvada a hipótese de erro, dolo ou fraude.

---

## CLÁUSULA 10 — DAS OBRIGAÇÕES DO(A) PROPRIETÁRIO(A)

**10.1.** Cabe ao(à) PROPRIETÁRIO(A):

**10.1.1.** pagar o IPTU e tributos incidentes sobre a propriedade;

**10.1.2.** custear manutenções estruturais e reparos não imputáveis ao locatário (telhado, instalações elétricas/hidráulicas estruturais, fachada etc.);

**10.1.3.** arcar com despesas extraordinárias de condomínio (art. 22, X, da Lei nº 8.245/1991);

**10.1.4.** manter o imóvel segurado contra incêndio e responsabilidade civil;

**10.1.5.** fornecer documentação atualizada do imóvel (matrícula, IPTU, planta, habite-se, declaração condominial de débitos);

**10.1.6.** comunicar imediatamente à ADMINISTRADORA qualquer alteração de titularidade, ônus, gravame, leilão, inventário ou litígio sobre o imóvel;

**10.1.7.** não negociar diretamente com o locatário sem prévia ciência da ADMINISTRADORA, para preservar a coerência da gestão;

**10.1.8.** pagar pontualmente os honorários, mesmo em caso de cobrança ajuizada por sua conta;

**10.1.9.** manter atualizado seu cadastro fiscal (regime de tributação, condição de contribuinte de IBS/CBS).

---

## CLÁUSULA 11 — DOS LIMITES DA RESPONSABILIDADE DA ADMINISTRADORA

**11.1.** A ADMINISTRADORA atua como mandatária e prestadora de serviços, respondendo apenas por culpa ou dolo no exercício de seus deveres, na forma do art. 667 do Código Civil.

**11.2.** Não responde a ADMINISTRADORA por:

**11.2.1.** inadimplência do locatário, salvo expressa contratação de garantia de repasse;

**11.2.2.** vícios ocultos do imóvel preexistentes;

**11.2.3.** danos decorrentes de caso fortuito, força maior, vandalismo de terceiros ou eventos da natureza;

**11.2.4.** tributos próprios do PROPRIETÁRIO incidentes sobre a renda (IRPF/IRPJ, IBS/CBS, quando devidos pelo PROPRIETÁRIO).

---

## CLÁUSULA 12 — DO PRAZO E DA RENOVAÇÃO

**12.1.** O presente contrato vigora pelo prazo de **{{contrato.prazo_meses}} ({{contrato.prazo_extenso}}) meses**, com início em **{{contrato.data_inicio}}** e término em **{{contrato.data_fim}}**, **renovando-se automaticamente** por iguais e sucessivos períodos, salvo manifestação em contrário de qualquer das partes na forma da Cláusula 13.

**12.2.** Os contratos de locação celebrados durante a vigência deste instrumento permanecem regidos pelos honorários ora pactuados **até o seu término**, ainda que ocorra rescisão deste contrato de administração no curso da locação.

---

## CLÁUSULA 13 — DA RESCISÃO

**13.1.** Qualquer das partes poderá rescindir o presente contrato, sem ônus, mediante notificação escrita com antecedência mínima de **30 (trinta) dias**.

**13.2.** A rescisão por iniciativa do(a) PROPRIETÁRIO(A) **antes da captação do locatário**, quando já realizadas fotos, anúncios e divulgação, ensejará reembolso à ADMINISTRADORA das despesas comprovadamente incorridas, conforme valor pactuado em proposta.

**13.3.** Caso, durante a vigência deste contrato ou em até **180 (cento e oitenta) dias** após sua rescisão, o(a) PROPRIETÁRIO(A) celebre **diretamente** contrato de locação com cliente apresentado pela ADMINISTRADORA, será devida integralmente a comissão de intermediação prevista no item 6.1.2, nos termos do art. 725 do Código Civil.

**13.4.** A rescisão por inadimplemento confere à parte inocente direito à indenização por perdas e danos, além de cláusula penal pactuada em proposta.

---

## CLÁUSULA 14 — DA PROTEÇÃO DE DADOS (LGPD)

**14.1.** As partes comprometem-se a tratar dados pessoais de locatários, fiadores e terceiros em estrita observância à **Lei nº 13.709/2018** (LGPD), restringindo o uso ao estritamente necessário à execução deste contrato e à proteção do crédito (art. 7º, V e IX, da LGPD).

**14.2. Papéis das partes.** A **ADMINISTRADORA** atua como **OPERADORA** dos dados pessoais coletados em nome do(a) PROPRIETÁRIO(A) (titulares: locatários, fiadores, terceiros) e como **CONTROLADORA** dos dados de seus próprios funcionários, fornecedores e operações internas. O(A) **PROPRIETÁRIO(A)** é o(a) **CONTROLADOR(A)** dos dados próprios e do imóvel. As partes adotarão controles técnicos e administrativos compatíveis para proteção dos dados.

**14.3.** Encarregado(a)/DPO: **{{imobiliaria.dpo_nome}}** — e-mail **{{imobiliaria.email_dpo}}**.

---

## CLÁUSULA 15 — DA ASSINATURA ELETRÔNICA

**15.1.** As partes elegem a assinatura eletrônica (avançada ou qualificada) como forma válida de manifestação de vontade, nos termos da **MP nº 2.200-2/2001** e da **Lei nº 14.063/2020**, dispensando-se reconhecimento de firma e assinatura de testemunhas físicas.

**15.2.** O presente contrato e seus aditivos constituem **título executivo extrajudicial**, na forma do **art. 784, III, do CPC** (instrumento particular assinado pelas partes e por duas testemunhas), ou do **art. 784, §4º**, do CPC, quando assinado por meio eletrônico em forma equivalente.

---

## CLÁUSULA 16 — DAS DISPOSIÇÕES GERAIS

**16.1.** As alterações contratuais somente terão validade mediante aditivo escrito assinado por ambas as partes.

**16.2.** A nulidade de qualquer cláusula não acarretará a nulidade das demais, que permanecerão em pleno vigor.

**16.3.** Este contrato obriga as partes, seus herdeiros e sucessores.

**16.4.** Constituem **anexos** integrantes deste contrato:

**16.4.1. Anexo I** — Documentação do imóvel (matrícula, IPTU, certidões);

**16.4.2. Anexo II** — Tabela de honorários e proposta comercial vigente;

**16.4.3. Anexo III** — Termo LGPD.

---

## CLÁUSULA 17 — DO FORO

**17.1.** Fica eleito o **Foro da Comarca de {{cidade.foro}}**, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir controvérsias decorrentes deste contrato.

---

E, por estarem assim, justas e contratadas, as partes firmam o presente instrumento em via eletrônica, em via única de igual teor e forma.

**{{cidade.foro}}, {{contrato.data_emissao}}.**

---

## ASSINATURAS


_________________________________________
**PROPRIETÁRIO(A):** {{proprietario.nome}}
CPF/CNPJ: {{proprietario.cpf_cnpj}}


_________________________________________
**ADMINISTRADORA:** {{imobiliaria.nome}}
CNPJ: {{imobiliaria.cnpj}} · CRECI-PJ: {{imobiliaria.creci}}
Resp. Téc.: {{imobiliaria.responsavel_tecnico}} · CRECI-F: {{imobiliaria.responsavel_creci}}


### TESTEMUNHAS

**1.** _________________________________________
Nome: {{testemunha1.nome}} · CPF: {{testemunha1.cpf_cnpj}}


**2.** _________________________________________
Nome: {{testemunha2.nome}} · CPF: {{testemunha2.cpf_cnpj}}
`
