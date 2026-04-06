-- ============================================================
-- MORADDA IMOBILIARIA - Proprietários e Documentos do Imóvel
-- Dados internos — NUNCA expostos no site público
-- ============================================================

-- --------------------------
-- IMOVEIS_PROPRIETARIOS
-- Dados do proprietário vinculado ao imóvel
-- --------------------------
CREATE TABLE IF NOT EXISTS imoveis_proprietarios (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id     uuid        NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  nome          varchar     NOT NULL,
  cpf_cnpj      varchar,
  telefone      varchar,
  email         varchar,
  endereco      text,
  observacoes   text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER trg_imoveis_proprietarios_updated
  BEFORE UPDATE ON imoveis_proprietarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------
-- IMOVEIS_DOCUMENTOS
-- Documentos internos do imóvel (escritura, matrícula, etc.)
-- Armazenados no bucket privado "documentos"
-- --------------------------
CREATE TABLE IF NOT EXISTS imoveis_documentos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id     uuid        NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  tipo          varchar     NOT NULL CHECK (tipo IN (
    'escritura',
    'matricula',
    'iptu',
    'contrato',
    'procuracao',
    'certidao_negativa',
    'habite_se',
    'planta',
    'laudo_avaliacao',
    'comprovante_propriedade',
    'rgi',
    'outro'
  )),
  nome_arquivo  varchar     NOT NULL,
  url           text        NOT NULL,
  observacoes   text,
  uploaded_by   uuid        REFERENCES users_profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

-- --------------------------
-- RLS POLICIES
-- Apenas usuários autenticados do painel podem acessar
-- --------------------------
ALTER TABLE imoveis_proprietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE imoveis_documentos ENABLE ROW LEVEL SECURITY;

-- Proprietários: leitura para autenticados
CREATE POLICY "Autenticados podem ver proprietarios"
  ON imoveis_proprietarios FOR SELECT
  TO authenticated
  USING (true);

-- Proprietários: inserção para autenticados
CREATE POLICY "Autenticados podem inserir proprietarios"
  ON imoveis_proprietarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Proprietários: atualização para autenticados
CREATE POLICY "Autenticados podem atualizar proprietarios"
  ON imoveis_proprietarios FOR UPDATE
  TO authenticated
  USING (true);

-- Proprietários: exclusão para autenticados
CREATE POLICY "Autenticados podem excluir proprietarios"
  ON imoveis_proprietarios FOR DELETE
  TO authenticated
  USING (true);

-- Documentos: leitura para autenticados
CREATE POLICY "Autenticados podem ver documentos"
  ON imoveis_documentos FOR SELECT
  TO authenticated
  USING (true);

-- Documentos: inserção para autenticados
CREATE POLICY "Autenticados podem inserir documentos"
  ON imoveis_documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Documentos: exclusão para autenticados
CREATE POLICY "Autenticados podem excluir documentos"
  ON imoveis_documentos FOR DELETE
  TO authenticated
  USING (true);

-- --------------------------
-- STORAGE BUCKET (privado)
-- --------------------------
-- Executar no Supabase Dashboard > Storage:
-- Criar bucket "documentos" com acesso PRIVADO (não público)
-- Políticas de storage:
--   SELECT: authenticated
--   INSERT: authenticated
--   DELETE: authenticated
