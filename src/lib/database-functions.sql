-- ============================================================
-- MORADDA IMOBILIARIA - Database Functions
-- ============================================================

-- ============================================================
-- 1. INCREMENT_VISUALIZACOES
-- Incrementa o contador de visualizacoes de um imovel.
-- Chamada via RPC pelo frontend sem necessidade de autenticacao.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_visualizacoes(p_imovel_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE imoveis
  SET visualizacoes = visualizacoes + 1
  WHERE id = p_imovel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. GET_IMOVEIS_STATS
-- Retorna estatisticas gerais dos imoveis agrupadas por status.
-- Usado no dashboard administrativo.
-- ============================================================

CREATE OR REPLACE FUNCTION get_imoveis_stats()
RETURNS json AS $$
DECLARE
  resultado json;
BEGIN
  SELECT json_build_object(
    'total',       COUNT(*),
    'publicados',  COUNT(*) FILTER (WHERE status = 'publicado'),
    'rascunhos',   COUNT(*) FILTER (WHERE status = 'rascunho'),
    'em_revisao',  COUNT(*) FILTER (WHERE status = 'em_revisao'),
    'vendidos',    COUNT(*) FILTER (WHERE status = 'vendido'),
    'alugados',    COUNT(*) FILTER (WHERE status = 'alugado'),
    'inativos',    COUNT(*) FILTER (WHERE status = 'inativo'),
    'destaques',   COUNT(*) FILTER (WHERE destaque = true),
    'por_tipo',    json_build_object(
      'casa',         COUNT(*) FILTER (WHERE tipo = 'casa'),
      'apartamento',  COUNT(*) FILTER (WHERE tipo = 'apartamento'),
      'terreno',      COUNT(*) FILTER (WHERE tipo = 'terreno'),
      'comercial',    COUNT(*) FILTER (WHERE tipo = 'comercial'),
      'rural',        COUNT(*) FILTER (WHERE tipo = 'rural'),
      'cobertura',    COUNT(*) FILTER (WHERE tipo = 'cobertura'),
      'kitnet',       COUNT(*) FILTER (WHERE tipo = 'kitnet'),
      'sobrado',      COUNT(*) FILTER (WHERE tipo = 'sobrado')
    ),
    'por_finalidade', json_build_object(
      'venda',         COUNT(*) FILTER (WHERE finalidade = 'venda'),
      'aluguel',       COUNT(*) FILTER (WHERE finalidade = 'aluguel'),
      'venda_aluguel', COUNT(*) FILTER (WHERE finalidade = 'venda_aluguel')
    ),
    'preco_medio',      ROUND(COALESCE(AVG(preco), 0), 2),
    'visualizacoes_total', COALESCE(SUM(visualizacoes), 0)
  )
  INTO resultado
  FROM imoveis;

  RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. GET_LEADS_STATS
-- Retorna estatisticas de leads. Se p_corretor_id for NULL,
-- retorna stats globais (para superadmin). Caso contrario,
-- filtra pelos leads do corretor especificado.
-- ============================================================

CREATE OR REPLACE FUNCTION get_leads_stats(p_corretor_id uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
  resultado json;
BEGIN
  SELECT json_build_object(
    'total',           COUNT(*),
    'novos',           COUNT(*) FILTER (WHERE status = 'novo'),
    'em_atendimento',  COUNT(*) FILTER (WHERE status = 'em_atendimento'),
    'convertidos',     COUNT(*) FILTER (WHERE status = 'convertido'),
    'perdidos',        COUNT(*) FILTER (WHERE status = 'perdido'),
    'por_origem',      json_build_object(
      'site_contato',  COUNT(*) FILTER (WHERE origem = 'site_contato'),
      'imovel',        COUNT(*) FILTER (WHERE origem = 'imovel'),
      'avaliacao',     COUNT(*) FILTER (WHERE origem = 'avaliacao'),
      'whatsapp',      COUNT(*) FILTER (WHERE origem = 'whatsapp'),
      'vender',        COUNT(*) FILTER (WHERE origem = 'vender'),
      'alerta',        COUNT(*) FILTER (WHERE origem = 'alerta')
    ),
    'ultimos_7_dias',  COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days'),
    'ultimos_30_dias', COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days'),
    'taxa_conversao',  CASE
      WHEN COUNT(*) > 0
      THEN ROUND(
        (COUNT(*) FILTER (WHERE status = 'convertido'))::decimal / COUNT(*) * 100, 2
      )
      ELSE 0
    END
  )
  INTO resultado
  FROM leads
  WHERE (p_corretor_id IS NULL OR corretor_id = p_corretor_id);

  RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. CALCULAR_PRECIFICACAO
-- Calcula estimativa de preco com base nos dados de referencia
-- do bairro, tipo de imovel, area e caracteristicas.
-- Aplica bonificacoes para suites e vagas de garagem.
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_precificacao(
  p_bairro_id uuid,
  p_tipo      varchar,
  p_area      decimal,
  p_quartos   int DEFAULT 0,
  p_suites    int DEFAULT 0,
  p_vagas     int DEFAULT 0
)
RETURNS json AS $$
DECLARE
  v_preco_m2_medio  decimal;
  v_preco_m2_minimo decimal;
  v_preco_m2_maximo decimal;
  v_estimativa_min  decimal;
  v_estimativa_max  decimal;
  v_estimativa_med  decimal;
  v_fator_suites    decimal;
  v_fator_vagas     decimal;
  v_bairro_nome     varchar;
  v_registros       int;
BEGIN
  -- Verificar se existe referencia para o bairro e tipo
  SELECT
    COUNT(*),
    COALESCE(AVG(preco_m2_medio), 0),
    COALESCE(MIN(preco_m2_minimo), 0),
    COALESCE(MAX(preco_m2_maximo), 0)
  INTO v_registros, v_preco_m2_medio, v_preco_m2_minimo, v_preco_m2_maximo
  FROM precos_referencia
  WHERE bairro_id = p_bairro_id
    AND tipo_imovel = p_tipo;

  -- Se nao ha dados de referencia, retornar indicacao
  IF v_registros = 0 OR v_preco_m2_medio = 0 THEN
    RETURN json_build_object(
      'sucesso',  false,
      'mensagem', 'Nao ha dados de referencia para este bairro e tipo de imovel.',
      'bairro_id', p_bairro_id,
      'tipo',      p_tipo
    );
  END IF;

  -- Buscar nome do bairro
  SELECT nome INTO v_bairro_nome FROM bairros WHERE id = p_bairro_id;

  -- Se preco_m2_minimo ou preco_m2_maximo nao existem, estimar com margem de 15%
  IF v_preco_m2_minimo = 0 THEN
    v_preco_m2_minimo := v_preco_m2_medio * 0.85;
  END IF;
  IF v_preco_m2_maximo = 0 THEN
    v_preco_m2_maximo := v_preco_m2_medio * 1.15;
  END IF;

  -- Fator de bonificacao para suites (cada suite adiciona 3%)
  v_fator_suites := 1.0 + (COALESCE(p_suites, 0) * 0.03);

  -- Fator de bonificacao para vagas de garagem (cada vaga adiciona 2%)
  v_fator_vagas := 1.0 + (COALESCE(p_vagas, 0) * 0.02);

  -- Calcular estimativas
  v_estimativa_min := ROUND(p_area * v_preco_m2_minimo * v_fator_suites * v_fator_vagas, 2);
  v_estimativa_max := ROUND(p_area * v_preco_m2_maximo * v_fator_suites * v_fator_vagas, 2);
  v_estimativa_med := ROUND(p_area * v_preco_m2_medio  * v_fator_suites * v_fator_vagas, 2);

  RETURN json_build_object(
    'sucesso',          true,
    'bairro',           v_bairro_nome,
    'tipo',             p_tipo,
    'area',             p_area,
    'quartos',          p_quartos,
    'suites',           p_suites,
    'vagas',            p_vagas,
    'preco_m2_medio',   ROUND(v_preco_m2_medio, 2),
    'preco_m2_minimo',  ROUND(v_preco_m2_minimo, 2),
    'preco_m2_maximo',  ROUND(v_preco_m2_maximo, 2),
    'estimativa_minima',    v_estimativa_min,
    'estimativa_maxima',    v_estimativa_max,
    'estimativa_media',     v_estimativa_med,
    'fator_suites',         ROUND(v_fator_suites, 2),
    'fator_vagas',          ROUND(v_fator_vagas, 2),
    'registros_referencia', v_registros
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
