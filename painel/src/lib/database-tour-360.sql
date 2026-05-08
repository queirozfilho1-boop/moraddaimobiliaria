-- ============================================================
--  Módulo Tour 360° — cenas panorâmicas + hotspots por imóvel
--  Aplicado em: 2026-05-08
-- ============================================================

-- Tabela de cenas (cada imóvel tem N cenas, navegáveis entre si)
CREATE TABLE IF NOT EXISTS public.imoveis_tour_cenas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id   UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  ordem       INT  NOT NULL DEFAULT 0,
  nome        TEXT NOT NULL,
  panorama_url TEXT NOT NULL,
  hotspots    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- hotspots: [{ id, type: 'scene'|'info', pitch, yaw, target_cena_id?, text? }]
  is_inicial  BOOLEAN NOT NULL DEFAULT false,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_cenas_imovel ON public.imoveis_tour_cenas(imovel_id);
CREATE INDEX IF NOT EXISTS idx_tour_cenas_ordem  ON public.imoveis_tour_cenas(imovel_id, ordem);

-- Apenas UMA cena inicial por imóvel
CREATE UNIQUE INDEX IF NOT EXISTS idx_tour_cenas_inicial
  ON public.imoveis_tour_cenas(imovel_id) WHERE is_inicial = true;

-- Trigger atualizado_em
CREATE OR REPLACE FUNCTION public.tg_imoveis_tour_cenas_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em := NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_imoveis_tour_cenas_atualizado_em ON public.imoveis_tour_cenas;
CREATE TRIGGER trg_imoveis_tour_cenas_atualizado_em
  BEFORE UPDATE ON public.imoveis_tour_cenas
  FOR EACH ROW EXECUTE FUNCTION public.tg_imoveis_tour_cenas_atualizado_em();

-- RLS
ALTER TABLE public.imoveis_tour_cenas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tour_cenas_select_public" ON public.imoveis_tour_cenas;
CREATE POLICY "tour_cenas_select_public" ON public.imoveis_tour_cenas
  FOR SELECT USING (true); -- imóveis publicados são públicos; tour acompanha

DROP POLICY IF EXISTS "tour_cenas_write_auth" ON public.imoveis_tour_cenas;
CREATE POLICY "tour_cenas_write_auth" ON public.imoveis_tour_cenas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
--  Storage bucket: imoveis-tour-360 (panorâmicas equirectangular)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imoveis-tour-360',
  'imoveis-tour-360',
  true,
  31457280, -- 30 MB por panorâmica
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "tour_360_read_public" ON storage.objects;
CREATE POLICY "tour_360_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'imoveis-tour-360');

DROP POLICY IF EXISTS "tour_360_write_auth" ON storage.objects;
CREATE POLICY "tour_360_write_auth" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imoveis-tour-360');

DROP POLICY IF EXISTS "tour_360_update_auth" ON storage.objects;
CREATE POLICY "tour_360_update_auth" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'imoveis-tour-360');

DROP POLICY IF EXISTS "tour_360_delete_auth" ON storage.objects;
CREATE POLICY "tour_360_delete_auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'imoveis-tour-360');
