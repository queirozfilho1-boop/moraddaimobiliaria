-- ============================================================
-- MORADDA IMOBILIARIA - Database Schema (Supabase/PostgreSQL)
-- ============================================================

-- ============================================================
-- 1. FUNCOES AUXILIARES
-- ============================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcao para gerar codigo sequencial do imovel (MRD-00001, MRD-00002, etc.)
CREATE OR REPLACE FUNCTION generate_imovel_codigo()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(codigo FROM 5) AS integer)), 0
    ) + 1
    INTO next_num
    FROM imoveis
    WHERE codigo ~ '^MRD-[0-9]+$';

    NEW.codigo = 'MRD-' || LPAD(next_num::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. TABELAS
-- ============================================================

-- --------------------------
-- ROLES
-- --------------------------
CREATE TABLE IF NOT EXISTS roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       varchar     UNIQUE NOT NULL,
  descricao  text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO roles (nome, descricao) VALUES
  ('superadmin', 'Administrador geral com acesso total ao sistema'),
  ('corretor',   'Corretor de imoveis com acesso restrito')
ON CONFLICT (nome) DO NOTHING;

-- --------------------------
-- USERS_PROFILES
-- --------------------------
CREATE TABLE IF NOT EXISTS users_profiles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       varchar     NOT NULL,
  email      varchar     NOT NULL,
  telefone   varchar,
  whatsapp   varchar,
  creci      varchar,
  avatar_url text,
  bio        text,
  slug       varchar     UNIQUE NOT NULL,
  role_id    uuid        REFERENCES roles(id) ON DELETE SET NULL,
  ativo      boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- --------------------------
-- BAIRROS
-- --------------------------
CREATE TABLE IF NOT EXISTS bairros (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           varchar     NOT NULL,
  slug           varchar     UNIQUE NOT NULL,
  cidade         varchar     DEFAULT 'Resende',
  descricao      text,
  foto_url       text,
  infraestrutura jsonb       DEFAULT '{}',
  coordenadas    jsonb,
  publicado      boolean     DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- --------------------------
-- IMOVEIS
-- --------------------------
CREATE TABLE IF NOT EXISTS imoveis (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo           varchar     UNIQUE NOT NULL,
  slug             varchar     UNIQUE NOT NULL,
  titulo           varchar     NOT NULL,
  descricao        text,
  tipo             varchar     NOT NULL CHECK (tipo IN ('casa','apartamento','terreno','comercial','rural','cobertura','kitnet','sobrado')),
  finalidade       varchar     NOT NULL CHECK (finalidade IN ('venda','aluguel','venda_aluguel')),
  status           varchar     DEFAULT 'rascunho' CHECK (status IN ('rascunho','em_revisao','publicado','vendido','alugado','inativo')),
  cep              varchar,
  endereco         varchar,
  numero           varchar,
  complemento      varchar,
  bairro_id        uuid        REFERENCES bairros(id) ON DELETE SET NULL,
  cidade           varchar     DEFAULT 'Resende',
  estado           varchar     DEFAULT 'RJ',
  latitude         decimal,
  longitude        decimal,
  preco            decimal     NOT NULL,
  preco_condominio decimal,
  preco_iptu       decimal,
  area_total       decimal,
  area_construida  decimal,
  quartos          int         DEFAULT 0,
  suites           int         DEFAULT 0,
  banheiros        int         DEFAULT 0,
  vagas_garagem    int         DEFAULT 0,
  caracteristicas  jsonb       DEFAULT '[]',
  tour_virtual_url text,
  video_url        text,
  destaque         boolean     DEFAULT false,
  visualizacoes    int         DEFAULT 0,
  corretor_id      uuid        NOT NULL REFERENCES users_profiles(id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- --------------------------
-- IMOVEIS_FOTOS
-- --------------------------
CREATE TABLE IF NOT EXISTS imoveis_fotos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id     uuid        NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  url           text        NOT NULL,
  url_watermark text,
  url_thumb     text,
  legenda       varchar,
  principal     boolean     DEFAULT false,
  ordem         int         DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- --------------------------
-- PRECOS_REFERENCIA
-- --------------------------
CREATE TABLE IF NOT EXISTS precos_referencia (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bairro_id       uuid        REFERENCES bairros(id) ON DELETE CASCADE,
  tipo_imovel     varchar     NOT NULL,
  preco_m2_medio  decimal     NOT NULL,
  preco_m2_minimo decimal,
  preco_m2_maximo decimal,
  fonte           varchar     DEFAULT 'manual',
  data_referencia date        DEFAULT current_date,
  observacoes     text,
  atualizado_por  uuid        REFERENCES users_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- --------------------------
-- LEADS
-- --------------------------
CREATE TABLE IF NOT EXISTS leads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        varchar     NOT NULL,
  email       varchar,
  telefone    varchar     NOT NULL,
  mensagem    text,
  origem      varchar     NOT NULL CHECK (origem IN ('site_contato','imovel','avaliacao','whatsapp','vender','alerta')),
  imovel_id   uuid        REFERENCES imoveis(id) ON DELETE SET NULL,
  corretor_id uuid        REFERENCES users_profiles(id) ON DELETE SET NULL,
  status      varchar     DEFAULT 'novo' CHECK (status IN ('novo','em_atendimento','convertido','perdido')),
  notas       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- --------------------------
-- ALERTAS_IMOVEIS
-- --------------------------
CREATE TABLE IF NOT EXISTS alertas_imoveis (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       varchar     NOT NULL,
  nome        varchar     NOT NULL,
  tipo        varchar,
  bairro_id   uuid        REFERENCES bairros(id) ON DELETE SET NULL,
  preco_min   decimal,
  preco_max   decimal,
  quartos_min int,
  ativo       boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- --------------------------
-- BLOG_POSTS
-- --------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      varchar     NOT NULL,
  slug        varchar     UNIQUE NOT NULL,
  conteudo    text,
  resumo      text,
  imagem_capa text,
  categoria   varchar,
  tags        jsonb       DEFAULT '[]',
  publicado   boolean     DEFAULT false,
  autor_id    uuid        REFERENCES users_profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- --------------------------
-- DEPOIMENTOS
-- --------------------------
CREATE TABLE IF NOT EXISTS depoimentos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       varchar     NOT NULL,
  texto      text        NOT NULL,
  foto_url   text,
  nota       int         DEFAULT 5 CHECK (nota >= 1 AND nota <= 5),
  publicado  boolean     DEFAULT true,
  ordem      int         DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- --------------------------
-- BANNERS
-- --------------------------
CREATE TABLE IF NOT EXISTS banners (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     varchar,
  subtitulo  varchar,
  imagem_url text        NOT NULL,
  link       text,
  ativo      boolean     DEFAULT true,
  ordem      int         DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- --------------------------
-- LOG_ATIVIDADES
-- --------------------------
CREATE TABLE IF NOT EXISTS log_atividades (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid        REFERENCES users_profiles(id) ON DELETE SET NULL,
  acao        varchar     NOT NULL,
  entidade    varchar     NOT NULL,
  entidade_id uuid,
  detalhes    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- users_profiles
CREATE INDEX IF NOT EXISTS idx_users_profiles_user_id ON users_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_profiles_slug    ON users_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_users_profiles_role_id ON users_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_users_profiles_ativo   ON users_profiles(ativo);

-- bairros
CREATE INDEX IF NOT EXISTS idx_bairros_slug      ON bairros(slug);
CREATE INDEX IF NOT EXISTS idx_bairros_publicado ON bairros(publicado);
CREATE INDEX IF NOT EXISTS idx_bairros_cidade    ON bairros(cidade);

-- imoveis
CREATE INDEX IF NOT EXISTS idx_imoveis_slug        ON imoveis(slug);
CREATE INDEX IF NOT EXISTS idx_imoveis_codigo      ON imoveis(codigo);
CREATE INDEX IF NOT EXISTS idx_imoveis_tipo        ON imoveis(tipo);
CREATE INDEX IF NOT EXISTS idx_imoveis_finalidade  ON imoveis(finalidade);
CREATE INDEX IF NOT EXISTS idx_imoveis_status      ON imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_bairro_id   ON imoveis(bairro_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_corretor_id ON imoveis(corretor_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_destaque    ON imoveis(destaque);
CREATE INDEX IF NOT EXISTS idx_imoveis_preco       ON imoveis(preco);
CREATE INDEX IF NOT EXISTS idx_imoveis_quartos     ON imoveis(quartos);
CREATE INDEX IF NOT EXISTS idx_imoveis_cidade      ON imoveis(cidade);

-- imoveis_fotos
CREATE INDEX IF NOT EXISTS idx_imoveis_fotos_imovel_id ON imoveis_fotos(imovel_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_fotos_principal ON imoveis_fotos(principal);

-- precos_referencia
CREATE INDEX IF NOT EXISTS idx_precos_referencia_bairro_id   ON precos_referencia(bairro_id);
CREATE INDEX IF NOT EXISTS idx_precos_referencia_tipo_imovel ON precos_referencia(tipo_imovel);

-- leads
CREATE INDEX IF NOT EXISTS idx_leads_corretor_id ON leads(corretor_id);
CREATE INDEX IF NOT EXISTS idx_leads_imovel_id   ON leads(imovel_id);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_origem      ON leads(origem);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads(created_at);

-- alertas_imoveis
CREATE INDEX IF NOT EXISTS idx_alertas_imoveis_email ON alertas_imoveis(email);
CREATE INDEX IF NOT EXISTS idx_alertas_imoveis_ativo ON alertas_imoveis(ativo);

-- blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug      ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publicado ON blog_posts(publicado);
CREATE INDEX IF NOT EXISTS idx_blog_posts_categoria ON blog_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_blog_posts_autor_id  ON blog_posts(autor_id);

-- depoimentos
CREATE INDEX IF NOT EXISTS idx_depoimentos_publicado ON depoimentos(publicado);

-- banners
CREATE INDEX IF NOT EXISTS idx_banners_ativo ON banners(ativo);

-- log_atividades
CREATE INDEX IF NOT EXISTS idx_log_atividades_usuario_id ON log_atividades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_atividades_entidade   ON log_atividades(entidade);
CREATE INDEX IF NOT EXISTS idx_log_atividades_created_at ON log_atividades(created_at);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- updated_at triggers
CREATE TRIGGER trg_imoveis_updated_at
  BEFORE UPDATE ON imoveis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_precos_referencia_updated_at
  BEFORE UPDATE ON precos_referencia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para gerar codigo do imovel automaticamente
CREATE TRIGGER trg_imoveis_generate_codigo
  BEFORE INSERT ON imoveis
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
  EXECUTE FUNCTION generate_imovel_codigo();
