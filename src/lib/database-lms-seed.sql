-- SEED: Trilhas e Módulos

DO $$ 
DECLARE
  t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid; t6 uuid; t7 uuid; t8 uuid;
BEGIN
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Uso da Plataforma', 'Aprenda a usar o painel da Moradda', 'Monitor', 1) RETURNING id INTO t1;
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Fundamentos da Corretagem', 'Profissao, etica, postura e responsabilidades', 'Award', 2) RETURNING id INTO t2;
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Atendimento ao Cliente', 'Do primeiro contato a decisao do cliente', 'Users', 3) RETURNING id INTO t3;
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Captacao e Cadastro', 'Da captacao ao anuncio publicado', 'Building2', 4) RETURNING id INTO t4;
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Visitas e Negociacao', 'Conduzindo visitas e negociacoes', 'Handshake', 5) RETURNING id INTO t5;
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Corretagem de Venda', 'Fluxo completo da venda imobiliaria', 'TrendingUp', 6) RETURNING id INTO t6;
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Corretagem de Locacao', 'Fluxo completo da locacao urbana', 'Key', 7) RETURNING id INTO t7;
  INSERT INTO trilhas (titulo, descricao, icone, ordem) VALUES ('Gestao e Produtividade', 'Organizacao, carteira, rotina e conversao', 'BarChart3', 8) RETURNING id INTO t8;

  -- T1: Uso da Plataforma
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t1, 'Primeiros Passos', 'Login, perfil e navegacao no painel', 1, 10, 10),
    (t1, 'Cadastro de Imoveis', 'Como cadastrar imoveis corretamente', 2, 20, 15),
    (t1, 'Gestao de Leads', 'Como acompanhar e atualizar leads', 3, 15, 15),
    (t1, 'Follow-up e Acompanhamento', 'Como usar o sistema de follow-up', 4, 15, 10),
    (t1, 'Notificacoes e Pendencias', 'Alertas e resolucao de pendencias', 5, 10, 10);

  -- T2: Fundamentos
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t2, 'O Papel do Corretor', 'Responsabilidades, limites e CRECI', 1, 20, 15),
    (t2, 'Postura Profissional', 'Apresentacao, comunicacao e disciplina', 2, 15, 10),
    (t2, 'Etica e Responsabilidade', 'Deveres, boa-fe, transparencia', 3, 20, 15),
    (t2, 'Prevencao de Erros', 'Erros mais comuns e como evita-los', 4, 15, 10);

  -- T3: Atendimento
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t3, 'Atendimento Inicial', 'Escuta ativa, confianca, necessidade', 1, 20, 15),
    (t3, 'Qualificacao de Leads', 'Perfil, intencao, urgencia, valor', 2, 20, 15),
    (t3, 'Atendimento ao Comprador', 'Perfil familiar, financeiro, localizacao', 3, 15, 10),
    (t3, 'Atendimento ao Locatario', 'Necessidade, orcamento, garantias', 4, 15, 10),
    (t3, 'Comunicacao Profissional', 'WhatsApp, telefone, presencial', 5, 15, 10);

  -- T4: Captacao
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t4, 'Captacao de Imoveis', 'Abordagem, coleta de informacoes', 1, 20, 15),
    (t4, 'Analise Documental', 'Documentos, matricula, IPTU, onus', 2, 25, 20),
    (t4, 'Cadastro de Qualidade', 'Titulo, descricao, diferenciais', 3, 20, 15),
    (t4, 'Fotografia e Apresentacao', 'Fotos, videos, enquadramento', 4, 15, 10),
    (t4, 'Riscos Documentais', 'Sinais de alerta e quando pedir apoio', 5, 15, 10);

  -- T5: Visitas e Negociacao
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t5, 'Conducao de Visitas', 'Preparacao, roteiro, postura, sinais', 1, 20, 15),
    (t5, 'Negociacao Equilibrada', 'Preco, prazo, condicoes, contraproposta', 2, 25, 20),
    (t5, 'Propostas', 'Estrutura, dados, apresentacao, registro', 3, 20, 15),
    (t5, 'Follow-up Comercial', 'Cadencia, retorno, reativacao', 4, 20, 15);

  -- T6: Venda
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t6, 'Fluxo Completo de Venda', 'Da captacao ao fechamento', 1, 30, 25),
    (t6, 'Contratos de Venda', 'Intermediacao, proposta, compra e venda', 2, 25, 20),
    (t6, 'Comissoes', 'Direito, criterios, divisao, registro', 3, 15, 10),
    (t6, 'Pos-Venda', 'Acompanhamento, orientacao, indicacao', 4, 15, 10);

  -- T7: Locacao
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t7, 'Fluxo Completo de Locacao', 'Da captacao a entrega de chaves', 1, 30, 25),
    (t7, 'Garantias Locaticias', 'Fiador, caucao, seguro, titulo', 2, 20, 15),
    (t7, 'Contratos de Locacao', 'Contrato, vistoria, termos, aditivos', 3, 25, 20),
    (t7, 'Pos-Locacao', 'Renovacao, devolucao, vistoria final', 4, 15, 10);

  -- T8: Gestao
  INSERT INTO modulos (trilha_id, titulo, descricao, ordem, duracao_minutos, pontos_conclusao) VALUES
    (t8, 'Gestao da Carteira', 'Imoveis, leads, prioridades', 1, 20, 15),
    (t8, 'Relacionamento com Proprietarios', 'Retorno, alinhamento, expectativas', 2, 15, 10),
    (t8, 'Relacionamento com Clientes', 'Confianca, funil, oportunidades', 3, 15, 10),
    (t8, 'Produtividade e Rotina', 'Dia, semana, mes do corretor eficiente', 4, 20, 15);
END $$;
