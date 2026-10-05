-- Setup template. Do not put actual secrets in this file or commit edited copies.
-- First enable pg_cron / pg_net in Supabase and create two Vault secrets via dashboard:
-- daegwang_push_url = https://YOUR-ADMIN-HOST/api/internal/push
-- daegwang_push_secret = same >=32-character random value as APP_PUSH_WORKER_SECRET.
-- Only run after the deployed HTTPS endpoint and a single consenting device have been verified.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='daegwang_push_url' AND decrypted_secret ~ '^https://[^/]+/api/internal/push$')
     OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='daegwang_push_secret' AND length(decrypted_secret)>=32) THEN
    RAISE EXCEPTION 'Configure HTTPS URL and worker secret in Vault first';
  END IF;
END $$;
SELECT cron.schedule('daegwang-push', '*/5 * * * *', $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='daegwang_push_url'),
    headers := jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='daegwang_push_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$$);
-- Pause: SELECT cron.unschedule('daegwang-push');
-- Check both cron.job_run_details and net._http_response: a successful cron SQL run
-- alone does NOT prove HTTP 200 or successful delivery. Never expose request headers.
