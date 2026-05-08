-- Trigger: ao vincular cliente_id E imovel_id numa visita importada,
-- marca automaticamente como revisada (precisa_revisao=false)

CREATE OR REPLACE FUNCTION public.tg_visitas_clear_revisao()
RETURNS TRIGGER LANGUAGE plpgsql AS $func$
BEGIN
  IF NEW.imovel_id IS NOT NULL AND NEW.cliente_id IS NOT NULL THEN
    NEW.precisa_revisao := false;
  END IF;
  RETURN NEW;
END $func$;

DROP TRIGGER IF EXISTS trg_visitas_clear_revisao ON public.visitas;
CREATE TRIGGER trg_visitas_clear_revisao
BEFORE UPDATE ON public.visitas
FOR EACH ROW
WHEN (OLD.precisa_revisao = true)
EXECUTE FUNCTION public.tg_visitas_clear_revisao();
