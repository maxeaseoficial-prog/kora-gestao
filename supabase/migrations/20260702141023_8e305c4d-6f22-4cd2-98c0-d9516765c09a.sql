
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove job anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('send-weekly-report-friday');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'send-weekly-report-friday',
  '0 12 * * 5', -- Toda sexta 12:00 UTC = 09:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://wekzgpafxgvxfpecbrrr.supabase.co/functions/v1/send-weekly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'WEEKLY_REPORT_CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
