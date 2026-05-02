-- ─────────────────────────────────────────────────────────────────
-- Locação · Schema
--
-- Tabelas:
--   contratos_locacao       — Contrato principal (1 por locação)
--   contratos_partes        — Partes envolvidas (locador, locatário, fiador, etc.)
--   contratos_modelos       — Templates de contrato em markdown/HTML
--   contratos_eventos       — Histórico (envio, aprovação, assinatura, reajuste...)
--   contratos_aditivos      — Aditivos / distratos
-- ─────────────────────────────────────────────────────────────────

-- ENUMs
DO $$ BEGIN
  CREATE TYPE contrato_tipo AS ENUM (
    'locacao_residencial',
    'locacao_comercial',
    'temporada',
    'administracao',
    'captacao_exclusiva'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE contrato_status AS ENUM (
    'rascunho',           -- sendo redigido
    'aguardando_assinatura',
    'ativo',
    'inadimplente',
    'encerrado',
    'distratado',
    'cancelado'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE contrato_garantia AS ENUM (
    'fiador',
    'caucao',
    'seguro_fianca',
    'capitalizacao',
    'sem_garantia'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE contrato_indice AS ENUM (
    'igpm',
    'ipca',
    'ipc_fipe',
    'incc',
    'sem_reajuste'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parte_papel AS ENUM (
    'locador',
    'locatario',
    'fiador',
    'avalista',
    'corretor',
    'testemunha'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE evento_tipo AS ENUM (
    'criado',
    'enviado_assinatura',
    'parte_assinou',
    'todos_assinaram',
    'ativado',
    'reajustado',
    'pago',
    'inadimplencia',
    'aviso_3_dias',
    'aviso_7_dias',
    'aviso_15_dias',
    'aditivo',
    'distratado',
    'encerrado',
    'cancelado',
    'observacao'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────────────
-- contratos_modelos · templates de contrato
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos_modelos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  tipo            contrato_tipo NOT NULL,
  conteudo        TEXT NOT NULL,        -- HTML/Markdown com placeholders {{variavel}}
  ativo           BOOLEAN DEFAULT TRUE,
  padrao          BOOLEAN DEFAULT FALSE, -- modelo padrão pra esse tipo
  observacoes     TEXT,
  criado_por      UUID REFERENCES users_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratos_modelos_tipo ON contratos_modelos(tipo);

-- ─────────────────────────────────────────────
-- contratos_locacao · contrato principal
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos_locacao (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero              TEXT UNIQUE NOT NULL,                 -- ex: 2026/000001
  tipo                contrato_tipo NOT NULL DEFAULT 'locacao_residencial',
  status              contrato_status NOT NULL DEFAULT 'rascunho',
  imovel_id           UUID NOT NULL REFERENCES imoveis(id) ON DELETE RESTRICT,
  modelo_id           UUID REFERENCES contratos_modelos(id),

  -- Datas e prazos
  data_inicio         DATE NOT NULL,
  data_fim            DATE NOT NULL,
  prazo_meses         INT,                                  -- calculado/configurável
  dia_vencimento      INT NOT NULL DEFAULT 5,               -- dia do mês pra cobrança (1-28)

  -- Valores
  valor_aluguel       NUMERIC(12,2) NOT NULL,
  valor_condominio    NUMERIC(12,2) DEFAULT 0,
  valor_iptu          NUMERIC(12,2) DEFAULT 0,
  valor_outros        NUMERIC(12,2) DEFAULT 0,
  observacoes_valor   TEXT,

  -- Repasse / Administração
  taxa_admin_pct      NUMERIC(5,2) DEFAULT 10.00,           -- % da taxa de administração
  taxa_admin_minima   NUMERIC(12,2) DEFAULT 0,              -- valor mínimo R$
  repasse_dia         INT DEFAULT 10,                       -- dia do mês pra repassar ao proprietário

  -- Garantia
  garantia_tipo       contrato_garantia NOT NULL DEFAULT 'sem_garantia',
  garantia_valor      NUMERIC(12,2),                        -- valor da caução, capitalização etc.
  garantia_observacoes TEXT,

  -- Reajuste
  indice_reajuste     contrato_indice NOT NULL DEFAULT 'igpm',
  proximo_reajuste    DATE,
  ultimo_reajuste     DATE,

  -- Multa e juros (descumprimento)
  multa_atraso_pct    NUMERIC(5,2) DEFAULT 2.00,
  juros_dia_pct       NUMERIC(5,2) DEFAULT 0.033,           -- ~1% ao mês
  multa_rescisao_meses NUMERIC(5,2) DEFAULT 3,

  -- Documentos / assinatura
  pdf_url             TEXT,                                 -- PDF gerado armazenado no Storage
  zapsign_doc_id      TEXT,                                 -- ID do documento no ZapSign
  zapsign_status      TEXT,                                 -- pending, signed, refused
  zapsign_url         TEXT,                                 -- link público pra assinatura

  -- Asaas / cobrança
  asaas_subscription_id TEXT,                               -- ID da assinatura recorrente no Asaas

  -- Outros
  observacoes         TEXT,
  corretor_id         UUID REFERENCES users_profiles(id),
  criado_por          UUID REFERENCES users_profiles(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  ativado_em          TIMESTAMPTZ,
  encerrado_em        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contratos_imovel ON contratos_locacao(imovel_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos_locacao(status);
CREATE INDEX IF NOT EXISTS idx_contratos_corretor ON contratos_locacao(corretor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_data_fim ON contratos_locacao(data_fim);

-- ─────────────────────────────────────────────
-- contratos_partes · pessoas envolvidas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos_partes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id     UUID NOT NULL REFERENCES contratos_locacao(id) ON DELETE CASCADE,
  papel           parte_papel NOT NULL,
  nome            TEXT NOT NULL,
  cpf_cnpj        TEXT,
  rg              TEXT,
  nacionalidade   TEXT DEFAULT 'Brasileira',
  estado_civil    TEXT,
  profissao       TEXT,
  email           TEXT,
  telefone        TEXT,
  endereco        TEXT,
  numero          TEXT,
  complemento     TEXT,
  bairro          TEXT,
  cidade          TEXT,
  estado          TEXT,
  cep             TEXT,
  data_nascimento DATE,
  observacoes     TEXT,
  ordem           INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partes_contrato ON contratos_partes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_partes_papel ON contratos_partes(papel);

-- ─────────────────────────────────────────────
-- contratos_eventos · histórico do contrato
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos_eventos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id     UUID NOT NULL REFERENCES contratos_locacao(id) ON DELETE CASCADE,
  tipo            evento_tipo NOT NULL,
  descricao       TEXT,
  metadados       JSONB,                          -- payload arbitrário (valores, IDs externos)
  usuario_id      UUID REFERENCES users_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_contrato ON contratos_eventos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_eventos_created ON contratos_eventos(created_at DESC);

-- ─────────────────────────────────────────────
-- contratos_aditivos · aditivos/distratos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos_aditivos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id     UUID NOT NULL REFERENCES contratos_locacao(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,                  -- 'aditivo', 'distrato', 'renovacao', 'reajuste'
  motivo          TEXT,
  conteudo        TEXT,                           -- texto do aditivo
  data_efeito     DATE,
  pdf_url         TEXT,
  zapsign_doc_id  TEXT,
  criado_por      UUID REFERENCES users_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aditivos_contrato ON contratos_aditivos(contrato_id);

-- ─────────────────────────────────────────────
-- Numeração sequencial de contratos
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION proximo_numero_contrato()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  ano TEXT := TO_CHAR(now(), 'YYYY');
  prox INT;
BEGIN
  SELECT COALESCE(MAX(SPLIT_PART(numero, '/', 2)::INT), 0) + 1 INTO prox
  FROM contratos_locacao
  WHERE numero LIKE ano || '/%';
  RETURN ano || '/' || LPAD(prox::TEXT, 6, '0');
END $$;

-- ─────────────────────────────────────────────
-- Trigger: atualiza updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS contratos_locacao_updated_at ON contratos_locacao;
CREATE TRIGGER contratos_locacao_updated_at BEFORE UPDATE ON contratos_locacao
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

DROP TRIGGER IF EXISTS contratos_modelos_updated_at ON contratos_modelos;
CREATE TRIGGER contratos_modelos_updated_at BEFORE UPDATE ON contratos_modelos
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

DROP TRIGGER IF EXISTS contratos_partes_updated_at ON contratos_partes;
CREATE TRIGGER contratos_partes_updated_at BEFORE UPDATE ON contratos_partes
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

-- ─────────────────────────────────────────────
-- RLS · Políticas simples (admin/corretor podem tudo)
-- ─────────────────────────────────────────────
ALTER TABLE contratos_locacao  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_partes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_modelos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_eventos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_aditivos ENABLE ROW LEVEL SECURITY;

-- Helper: usuário autenticado
DROP POLICY IF EXISTS "auth_all_contratos"  ON contratos_locacao;
CREATE POLICY "auth_all_contratos"  ON contratos_locacao  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_partes"    ON contratos_partes;
CREATE POLICY "auth_all_partes"    ON contratos_partes    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_modelos"   ON contratos_modelos;
CREATE POLICY "auth_all_modelos"   ON contratos_modelos   FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_eventos"   ON contratos_eventos;
CREATE POLICY "auth_all_eventos"   ON contratos_eventos   FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_aditivos"  ON contratos_aditivos;
CREATE POLICY "auth_all_aditivos"  ON contratos_aditivos  FOR ALL TO authenticated USING (true) WITH CHECK (true);
