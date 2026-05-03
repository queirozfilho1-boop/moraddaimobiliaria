-- ============================================================
-- Migração: funções múltiplas por usuário
-- ============================================================
-- Antes: cada usuário tinha 1 role (superadmin/gestor/corretor)
-- Depois: 3 flags booleanas que podem coexistir
--   is_socio       → acesso total (Sebastião, Tamires, Tarilaine)
--   is_assistente  → acesso operacional (Carla)
--   is_corretor    → vende/capta, aparece no ranking, tem CRECI
-- ============================================================

-- 1. Adicionar colunas booleanas
ALTER TABLE users_profiles
  ADD COLUMN IF NOT EXISTS is_socio       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_assistente  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_corretor    boolean NOT NULL DEFAULT false;

-- 2. Migrar dados existentes a partir de role_id
-- superadmin → sócio (também é assistente operacional na prática)
UPDATE users_profiles
SET is_socio = true
WHERE role_id IN (SELECT id FROM roles WHERE nome = 'superadmin');

-- gestor → assistente
UPDATE users_profiles
SET is_assistente = true
WHERE role_id IN (SELECT id FROM roles WHERE nome = 'gestor');

-- corretor → corretor
UPDATE users_profiles
SET is_corretor = true
WHERE role_id IN (SELECT id FROM roles WHERE nome = 'corretor');

-- 3. Sebastião (queirozfilho1@gmail.com) é sócio E corretor (tem CRECI)
UPDATE users_profiles
SET is_socio = true, is_corretor = true
WHERE email = 'queirozfilho1@gmail.com';

-- 4. Índices pra filtros rápidos
CREATE INDEX IF NOT EXISTS idx_users_is_socio      ON users_profiles(is_socio)      WHERE is_socio = true;
CREATE INDEX IF NOT EXISTS idx_users_is_assistente ON users_profiles(is_assistente) WHERE is_assistente = true;
CREATE INDEX IF NOT EXISTS idx_users_is_corretor   ON users_profiles(is_corretor)   WHERE is_corretor = true;

-- 5. Manter role_id como compat (RLS continua funcionando).
-- Trigger: derivar role_id automaticamente a partir das flags
-- Prioridade: socio > assistente > corretor
CREATE OR REPLACE FUNCTION sync_role_from_funcoes()
RETURNS TRIGGER AS $$
DECLARE
  target_role text;
  target_role_id uuid;
BEGIN
  IF NEW.is_socio THEN
    target_role := 'superadmin';
  ELSIF NEW.is_assistente THEN
    target_role := 'gestor';
  ELSIF NEW.is_corretor THEN
    target_role := 'corretor';
  ELSE
    target_role := 'corretor'; -- fallback
  END IF;

  SELECT id INTO target_role_id FROM roles WHERE nome = target_role LIMIT 1;
  IF target_role_id IS NOT NULL THEN
    NEW.role_id := target_role_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_role_from_funcoes ON users_profiles;
CREATE TRIGGER trg_sync_role_from_funcoes
  BEFORE INSERT OR UPDATE OF is_socio, is_assistente, is_corretor ON users_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_role_from_funcoes();
