-- ============================================================
-- DISTRIBUIÇÃO DE LEADS EM FILA (Round-Robin)
-- ============================================================

-- Tabela para controlar a fila de distribuição
CREATE TABLE IF NOT EXISTS distribuicao_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ultimo_corretor_id uuid REFERENCES users_profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- Inserir registro inicial (se não existe)
INSERT INTO distribuicao_leads (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Garantir que só tem 1 registro
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM distribuicao_leads) = 0 THEN
    INSERT INTO distribuicao_leads DEFAULT VALUES;
  END IF;
END $$;

-- Function que retorna o próximo corretor da fila
CREATE OR REPLACE FUNCTION get_proximo_corretor()
RETURNS uuid AS $$
DECLARE
  ultimo_id uuid;
  proximo_id uuid;
BEGIN
  -- Pegar o último corretor que recebeu lead
  SELECT ultimo_corretor_id INTO ultimo_id FROM distribuicao_leads LIMIT 1;

  -- Buscar o próximo corretor ativo (order by nome para consistência)
  -- Se ultimo_id é NULL ou não existe mais, pega o primeiro
  IF ultimo_id IS NULL THEN
    SELECT up.id INTO proximo_id
    FROM users_profiles up
    INNER JOIN roles r ON r.id = up.role_id
    WHERE r.nome = 'corretor' AND up.ativo = true
    ORDER BY up.nome
    LIMIT 1;
  ELSE
    -- Pega o próximo depois do último (circular)
    SELECT up.id INTO proximo_id
    FROM users_profiles up
    INNER JOIN roles r ON r.id = up.role_id
    WHERE r.nome = 'corretor' AND up.ativo = true
      AND up.nome > (SELECT nome FROM users_profiles WHERE id = ultimo_id)
    ORDER BY up.nome
    LIMIT 1;

    -- Se não achou (era o último da lista), volta pro primeiro
    IF proximo_id IS NULL THEN
      SELECT up.id INTO proximo_id
      FROM users_profiles up
      INNER JOIN roles r ON r.id = up.role_id
      WHERE r.nome = 'corretor' AND up.ativo = true
      ORDER BY up.nome
      LIMIT 1;
    END IF;
  END IF;

  -- Se ainda não tem corretor (nenhum cadastrado), tenta pegar o superadmin
  IF proximo_id IS NULL THEN
    SELECT up.id INTO proximo_id
    FROM users_profiles up
    INNER JOIN roles r ON r.id = up.role_id
    WHERE r.nome = 'superadmin' AND up.ativo = true
    ORDER BY up.nome
    LIMIT 1;
  END IF;

  -- Atualizar a fila
  IF proximo_id IS NOT NULL THEN
    UPDATE distribuicao_leads SET ultimo_corretor_id = proximo_id, updated_at = now();
  END IF;

  RETURN proximo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function para atribuir corretor automaticamente ao lead
CREATE OR REPLACE FUNCTION atribuir_corretor_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atribui se o lead não tem corretor definido
  IF NEW.corretor_id IS NULL THEN
    NEW.corretor_id = get_proximo_corretor();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger no INSERT de leads
DROP TRIGGER IF EXISTS trg_leads_atribuir_corretor ON leads;
CREATE TRIGGER trg_leads_atribuir_corretor
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION atribuir_corretor_lead();

-- RLS para distribuicao_leads
ALTER TABLE distribuicao_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "distribuicao_select_admin"
  ON distribuicao_leads FOR SELECT
  TO authenticated
  USING (is_superadmin());

CREATE POLICY "distribuicao_update_admin"
  ON distribuicao_leads FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());
