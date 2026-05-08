-- Cron diario as 04:00 BRT (07:00 UTC) chama gcal-renew-channels
-- pg_cron + pg_net ja habilitados (mesmo padrao da moradda-cobranca-diaria)

-- Service role key precisa estar disponivel pra http_post.
-- Padrao usado em outros crons da Moradda: salvar em GUC. Como nao posso
-- ler vault.secrets via Management API, embuto a anon key (pode usar
-- anon mesmo pq o webhook nao requer auth — Google chama sem auth tambem)

DO $cronblock$
BEGIN
  -- Remove cron antigo se existir (idempotente)
  PERFORM cron.unschedule('moradda-gcal-renew-daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'moradda-gcal-renew-daily');

  PERFORM cron.schedule(
    'moradda-gcal-renew-daily',
    '0 7 * * *',
    $cmd$
    SELECT net.http_post(
      url := 'https://mvzjqktgnwjwuinnxxcc.supabase.co/functions/v1/gcal-renew-channels',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
    $cmd$
  );
END $cronblock$;

-- Confirma
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'moradda-gcal-renew-daily';
