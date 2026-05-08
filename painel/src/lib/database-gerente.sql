-- ============================================================
--  Funcao "Gerente" — like sócio, exceto modulo Acessos
--  Aplicado em: 2026-05-08
-- ============================================================

-- 1. Coluna is_gerente
ALTER TABLE public.users_profiles
  ADD COLUMN IF NOT EXISTS is_gerente BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Atualizar policies que checam is_socio para tambem aceitar is_gerente
--    (3 policies achadas em despesas, corretor_disp, vistorias_fotos)

-- contratos_despesas
DROP POLICY IF EXISTS despesas_write_auth ON public.contratos_despesas;
CREATE POLICY despesas_write_auth ON public.contratos_despesas
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users_profiles up
      WHERE up.user_id = auth.uid()
        AND (up.is_socio = true OR up.is_gerente = true OR up.is_assistente = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users_profiles up
      WHERE up.user_id = auth.uid()
        AND (up.is_socio = true OR up.is_gerente = true OR up.is_assistente = true)
    )
  );

-- corretor_disponibilidade: socio/gerente gerencia todos, corretor só o seu
DROP POLICY IF EXISTS corretor_disp_socio_all ON public.corretor_disponibilidade;
CREATE POLICY corretor_disp_socio_all ON public.corretor_disponibilidade
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users_profiles up
      WHERE up.user_id = auth.uid()
        AND (up.is_socio = true OR up.is_gerente = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users_profiles up
      WHERE up.user_id = auth.uid()
        AND (up.is_socio = true OR up.is_gerente = true)
    )
  );

-- vistorias_fotos: write quando user tem alguma das funcoes operacionais
DROP POLICY IF EXISTS vistorias_fotos_write ON public.vistorias_fotos;
CREATE POLICY vistorias_fotos_write ON public.vistorias_fotos
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users_profiles up
      WHERE up.user_id = auth.uid()
        AND (up.is_socio = true OR up.is_gerente = true OR up.is_assistente = true OR up.is_corretor = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users_profiles up
      WHERE up.user_id = auth.uid()
        AND (up.is_socio = true OR up.is_gerente = true OR up.is_assistente = true OR up.is_corretor = true)
    )
  );
