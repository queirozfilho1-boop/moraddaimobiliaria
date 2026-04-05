-- ============================================================
-- MORADDA LMS - Módulo de Aprendizado
-- ============================================================

-- 1. TRILHAS DE APRENDIZAGEM
CREATE TABLE IF NOT EXISTS trilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo varchar NOT NULL,
  descricao text,
  icone varchar DEFAULT 'BookOpen',
  ordem int DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. MÓDULOS (dentro das trilhas)
CREATE TABLE IF NOT EXISTS modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id uuid NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  titulo varchar NOT NULL,
  descricao text,
  icone varchar,
  ordem int DEFAULT 0,
  duracao_minutos int DEFAULT 15,
  pontos_conclusao int DEFAULT 10,
  nota_minima int DEFAULT 70,
  bloqueado boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modulos_trilha ON modulos(trilha_id);

-- 3. AULAS (dentro dos módulos)
CREATE TABLE IF NOT EXISTS aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  titulo varchar NOT NULL,
  tipo varchar NOT NULL CHECK (tipo IN ('conteudo','exercicio','avaliacao','checklist','video','caso_pratico')),
  conteudo text,
  ordem int DEFAULT 0,
  pontos int DEFAULT 5,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aulas_modulo ON aulas(modulo_id);

-- 4. EXERCÍCIOS/QUESTÕES
CREATE TABLE IF NOT EXISTS questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  tipo varchar NOT NULL CHECK (tipo IN ('multipla_escolha','verdadeiro_falso','associacao','preenchimento')),
  enunciado text NOT NULL,
  opcoes jsonb DEFAULT '[]',
  resposta_correta jsonb NOT NULL,
  explicacao text,
  pontos int DEFAULT 5,
  ordem int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_questoes_aula ON questoes(aula_id);

-- 5. PROGRESSO DO CORRETOR
CREATE TABLE IF NOT EXISTS progresso_corretor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  aula_id uuid NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  concluida boolean DEFAULT false,
  pontuacao int DEFAULT 0,
  tentativas int DEFAULT 0,
  melhor_nota int DEFAULT 0,
  tempo_gasto_segundos int DEFAULT 0,
  respostas jsonb DEFAULT '[]',
  concluida_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(corretor_id, aula_id)
);
CREATE INDEX IF NOT EXISTS idx_progresso_corretor ON progresso_corretor(corretor_id);
CREATE INDEX IF NOT EXISTS idx_progresso_aula ON progresso_corretor(aula_id);

-- 6. PROGRESSO POR MÓDULO (view materializada ou calculada)
CREATE TABLE IF NOT EXISTS progresso_modulo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  percentual int DEFAULT 0,
  nota_media int DEFAULT 0,
  concluido boolean DEFAULT false,
  concluido_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(corretor_id, modulo_id)
);
CREATE INDEX IF NOT EXISTS idx_progresso_modulo_corretor ON progresso_modulo(corretor_id);

-- 7. CERTIFICADOS/SELOS
CREATE TABLE IF NOT EXISTS certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  trilha_id uuid REFERENCES trilhas(id) ON DELETE SET NULL,
  modulo_id uuid REFERENCES modulos(id) ON DELETE SET NULL,
  tipo varchar DEFAULT 'modulo' CHECK (tipo IN ('modulo','trilha','destaque')),
  titulo varchar NOT NULL,
  nota_final int DEFAULT 0,
  emitido_em timestamptz DEFAULT now()
);

-- 8. RLS
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_corretor ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

-- Policies: todos podem ler conteúdo, corretor atualiza próprio progresso
CREATE POLICY "trilhas_select" ON trilhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "modulos_select" ON modulos FOR SELECT TO authenticated USING (true);
CREATE POLICY "aulas_select" ON aulas FOR SELECT TO authenticated USING (true);
CREATE POLICY "questoes_select" ON questoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "progresso_select_own" ON progresso_corretor FOR SELECT TO authenticated USING (corretor_id = (SELECT id FROM users_profiles WHERE user_id = auth.uid()) OR is_superadmin() OR get_user_role() = 'gestor');
CREATE POLICY "progresso_insert" ON progresso_corretor FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "progresso_update_own" ON progresso_corretor FOR UPDATE TO authenticated USING (corretor_id = (SELECT id FROM users_profiles WHERE user_id = auth.uid()));

CREATE POLICY "progresso_mod_select" ON progresso_modulo FOR SELECT TO authenticated USING (corretor_id = (SELECT id FROM users_profiles WHERE user_id = auth.uid()) OR is_superadmin() OR get_user_role() = 'gestor');
CREATE POLICY "progresso_mod_upsert" ON progresso_modulo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "progresso_mod_update" ON progresso_modulo FOR UPDATE TO authenticated USING (true);

CREATE POLICY "certificados_select" ON certificados FOR SELECT TO authenticated USING (true);
CREATE POLICY "certificados_insert" ON certificados FOR INSERT TO authenticated WITH CHECK (true);

-- Admin pode gerenciar conteúdo
CREATE POLICY "trilhas_admin" ON trilhas FOR ALL TO authenticated USING (is_superadmin() OR get_user_role() = 'gestor');
CREATE POLICY "modulos_admin" ON modulos FOR ALL TO authenticated USING (is_superadmin() OR get_user_role() = 'gestor');
CREATE POLICY "aulas_admin" ON aulas FOR ALL TO authenticated USING (is_superadmin() OR get_user_role() = 'gestor');
CREATE POLICY "questoes_admin" ON questoes FOR ALL TO authenticated USING (is_superadmin() OR get_user_role() = 'gestor');

-- Trigger updated_at
CREATE TRIGGER trg_progresso_corretor_updated
  BEFORE UPDATE ON progresso_corretor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_progresso_modulo_updated
  BEFORE UPDATE ON progresso_modulo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
