-- ============================================================
-- MORADDA IMOBILIARIA - Row Level Security Policies
-- ============================================================

-- ============================================================
-- 1. FUNCOES AUXILIARES PARA RLS
-- ============================================================

-- Retorna o nome do role do usuario autenticado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT r.nome
  FROM roles r
  INNER JOIN users_profiles up ON up.role_id = r.id
  WHERE up.user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna true se o usuario autenticado e superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean AS $$
  SELECT COALESCE(get_user_role() = 'superadmin', false)
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna o id do perfil do usuario autenticado
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS uuid AS $$
  SELECT id FROM users_profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bairros          ENABLE ROW LEVEL SECURITY;
ALTER TABLE imoveis          ENABLE ROW LEVEL SECURITY;
ALTER TABLE imoveis_fotos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE precos_referencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_imoveis  ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE depoimentos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_atividades   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. POLICIES - ROLES
-- ============================================================

-- Select: usuarios autenticados podem ver os roles
CREATE POLICY "roles_select_authenticated"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 4. POLICIES - USERS_PROFILES
-- ============================================================

-- Select: perfis sao publicos (anon e authenticated podem ver)
CREATE POLICY "users_profiles_select_public"
  ON users_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert: usuario autenticado pode criar seu proprio perfil
CREATE POLICY "users_profiles_insert_own"
  ON users_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Insert: superadmin pode criar perfil para qualquer usuario
CREATE POLICY "users_profiles_insert_superadmin"
  ON users_profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

-- Update: proprio usuario ou superadmin
CREATE POLICY "users_profiles_update_own_or_admin"
  ON users_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_superadmin())
  WITH CHECK (user_id = auth.uid() OR is_superadmin());

-- ============================================================
-- 5. POLICIES - BAIRROS
-- ============================================================

-- Select anon: apenas publicados
CREATE POLICY "bairros_select_public"
  ON bairros FOR SELECT
  TO anon
  USING (publicado = true);

-- Select authenticated: todos
CREATE POLICY "bairros_select_authenticated"
  ON bairros FOR SELECT
  TO authenticated
  USING (true);

-- Insert: superadmin
CREATE POLICY "bairros_insert_superadmin"
  ON bairros FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

-- Update: superadmin
CREATE POLICY "bairros_update_superadmin"
  ON bairros FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Delete: superadmin
CREATE POLICY "bairros_delete_superadmin"
  ON bairros FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================
-- 6. POLICIES - IMOVEIS
-- ============================================================

-- Select anon: apenas publicados
CREATE POLICY "imoveis_select_public"
  ON imoveis FOR SELECT
  TO anon
  USING (status = 'publicado');

-- Select authenticated: todos
CREATE POLICY "imoveis_select_authenticated"
  ON imoveis FOR SELECT
  TO authenticated
  USING (true);

-- Insert: qualquer autenticado
CREATE POLICY "imoveis_insert_authenticated"
  ON imoveis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update: dono (corretor_id) ou superadmin
CREATE POLICY "imoveis_update_owner_or_admin"
  ON imoveis FOR UPDATE
  TO authenticated
  USING (corretor_id = get_my_profile_id() OR is_superadmin())
  WITH CHECK (corretor_id = get_my_profile_id() OR is_superadmin());

-- Delete: APENAS superadmin
CREATE POLICY "imoveis_delete_superadmin"
  ON imoveis FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================
-- 7. POLICIES - IMOVEIS_FOTOS
-- ============================================================

-- Select: segue permissoes do imovel pai
-- Anon: apenas fotos de imoveis publicados
CREATE POLICY "imoveis_fotos_select_anon"
  ON imoveis_fotos FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imoveis_fotos.imovel_id
        AND imoveis.status = 'publicado'
    )
  );

-- Authenticated: todas as fotos
CREATE POLICY "imoveis_fotos_select_authenticated"
  ON imoveis_fotos FOR SELECT
  TO authenticated
  USING (true);

-- Insert: dono do imovel pai ou superadmin
CREATE POLICY "imoveis_fotos_insert_owner_or_admin"
  ON imoveis_fotos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imoveis_fotos.imovel_id
        AND (imoveis.corretor_id = get_my_profile_id() OR is_superadmin())
    )
  );

-- Update: dono do imovel pai ou superadmin
CREATE POLICY "imoveis_fotos_update_owner_or_admin"
  ON imoveis_fotos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imoveis_fotos.imovel_id
        AND (imoveis.corretor_id = get_my_profile_id() OR is_superadmin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imoveis_fotos.imovel_id
        AND (imoveis.corretor_id = get_my_profile_id() OR is_superadmin())
    )
  );

-- Delete: dono do imovel pai ou superadmin
CREATE POLICY "imoveis_fotos_delete_owner_or_admin"
  ON imoveis_fotos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imoveis_fotos.imovel_id
        AND (imoveis.corretor_id = get_my_profile_id() OR is_superadmin())
    )
  );

-- ============================================================
-- 8. POLICIES - PRECOS_REFERENCIA
-- ============================================================

-- Select: autenticados
CREATE POLICY "precos_referencia_select_authenticated"
  ON precos_referencia FOR SELECT
  TO authenticated
  USING (true);

-- Insert: qualquer autenticado
CREATE POLICY "precos_referencia_insert_authenticated"
  ON precos_referencia FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update: qualquer autenticado
CREATE POLICY "precos_referencia_update_authenticated"
  ON precos_referencia FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 9. POLICIES - LEADS
-- ============================================================

-- Insert: qualquer um (anon pode submeter lead)
CREATE POLICY "leads_insert_public"
  ON leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Select: superadmin ve tudo, corretor ve apenas seus leads
CREATE POLICY "leads_select_admin_or_corretor"
  ON leads FOR SELECT
  TO authenticated
  USING (
    is_superadmin()
    OR corretor_id = get_my_profile_id()
  );

-- Update: superadmin ou corretor atribuido
CREATE POLICY "leads_update_admin_or_corretor"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    is_superadmin()
    OR corretor_id = get_my_profile_id()
  )
  WITH CHECK (
    is_superadmin()
    OR corretor_id = get_my_profile_id()
  );

-- ============================================================
-- 10. POLICIES - ALERTAS_IMOVEIS
-- ============================================================

-- Insert: qualquer um (anon pode criar alerta)
CREATE POLICY "alertas_imoveis_insert_public"
  ON alertas_imoveis FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Select: superadmin
CREATE POLICY "alertas_imoveis_select_admin"
  ON alertas_imoveis FOR SELECT
  TO authenticated
  USING (is_superadmin());

-- Update: superadmin
CREATE POLICY "alertas_imoveis_update_admin"
  ON alertas_imoveis FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Delete: superadmin
CREATE POLICY "alertas_imoveis_delete_admin"
  ON alertas_imoveis FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================
-- 11. POLICIES - BLOG_POSTS
-- ============================================================

-- Select anon: apenas publicados
CREATE POLICY "blog_posts_select_public"
  ON blog_posts FOR SELECT
  TO anon
  USING (publicado = true);

-- Select authenticated: superadmin ve todos, demais apenas publicados
CREATE POLICY "blog_posts_select_authenticated"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (is_superadmin() OR publicado = true);

-- Insert: superadmin
CREATE POLICY "blog_posts_insert_admin"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

-- Update: superadmin
CREATE POLICY "blog_posts_update_admin"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Delete: superadmin
CREATE POLICY "blog_posts_delete_admin"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================
-- 12. POLICIES - DEPOIMENTOS
-- ============================================================

-- Select anon: apenas publicados
CREATE POLICY "depoimentos_select_public"
  ON depoimentos FOR SELECT
  TO anon
  USING (publicado = true);

-- Select authenticated: superadmin ve todos, demais apenas publicados
CREATE POLICY "depoimentos_select_authenticated"
  ON depoimentos FOR SELECT
  TO authenticated
  USING (is_superadmin() OR publicado = true);

-- Insert: superadmin
CREATE POLICY "depoimentos_insert_admin"
  ON depoimentos FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

-- Update: superadmin
CREATE POLICY "depoimentos_update_admin"
  ON depoimentos FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Delete: superadmin
CREATE POLICY "depoimentos_delete_admin"
  ON depoimentos FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================
-- 13. POLICIES - BANNERS
-- ============================================================

-- Select anon: apenas ativos
CREATE POLICY "banners_select_public"
  ON banners FOR SELECT
  TO anon
  USING (ativo = true);

-- Select authenticated: superadmin ve todos, demais apenas ativos
CREATE POLICY "banners_select_authenticated"
  ON banners FOR SELECT
  TO authenticated
  USING (is_superadmin() OR ativo = true);

-- Insert: superadmin
CREATE POLICY "banners_insert_admin"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

-- Update: superadmin
CREATE POLICY "banners_update_admin"
  ON banners FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Delete: superadmin
CREATE POLICY "banners_delete_admin"
  ON banners FOR DELETE
  TO authenticated
  USING (is_superadmin());

-- ============================================================
-- 14. POLICIES - LOG_ATIVIDADES
-- ============================================================

-- Insert: qualquer autenticado
CREATE POLICY "log_atividades_insert_authenticated"
  ON log_atividades FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Select: superadmin
CREATE POLICY "log_atividades_select_admin"
  ON log_atividades FOR SELECT
  TO authenticated
  USING (is_superadmin());
