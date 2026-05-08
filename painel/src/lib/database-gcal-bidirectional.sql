-- ============================================================
--  Sync bidirecional Google Calendar -> Painel
--  Aplicado em: 2026-05-08
-- ============================================================

-- 1. visitas: tornar imovel_id e cliente_nome nullable (eventos importados
--    do Google podem nao ter imovel/cliente identificados de inicio)
ALTER TABLE public.visitas ALTER COLUMN imovel_id DROP NOT NULL;
ALTER TABLE public.visitas ALTER COLUMN cliente_nome DROP NOT NULL;

-- 2. visitas: campos novos pra rastrear origem e estado de revisao
ALTER TABLE public.visitas
  ADD COLUMN IF NOT EXISTS imported_from_google BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS precisa_revisao BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS endereco_evento TEXT;

-- 3. Index pra UPSERT rapido por google_event_id (sync chama isso muito)
CREATE INDEX IF NOT EXISTS idx_visitas_google_event_id
  ON public.visitas(google_event_id)
  WHERE google_event_id IS NOT NULL;

-- 4. Index pra filtro "minhas visitas que precisam revisao"
CREATE INDEX IF NOT EXISTS idx_visitas_precisa_revisao
  ON public.visitas(corretor_id, precisa_revisao)
  WHERE precisa_revisao = TRUE;

-- 5. users_profiles: data de expiracao do channel watch (renovacao)
ALTER TABLE public.users_profiles
  ADD COLUMN IF NOT EXISTS gcal_channel_expiration TIMESTAMPTZ;

-- 6. View auxiliar: visitas que precisam revisao (alimenta o badge na UI)
CREATE OR REPLACE VIEW public.v_visitas_pendentes_revisao AS
SELECT
  v.*,
  up.nome AS corretor_nome
FROM public.visitas v
LEFT JOIN public.users_profiles up ON up.id = v.corretor_id
WHERE v.precisa_revisao = TRUE
  AND v.status NOT IN ('cancelada', 'realizada');

-- 7. (Opcional) GRANT pra que a view seja consultavel via PostgREST
ALTER VIEW public.v_visitas_pendentes_revisao OWNER TO postgres;
