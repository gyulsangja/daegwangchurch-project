-- Apply after the private endpoint passes real test-account verification.
-- Store the HTTPS endpoint as daegwang_deletion_url and a dedicated random
-- >=32-character APP_DELETION_WORKER_SECRET as daegwang_deletion_secret in Vault.
-- Never put literal credentials in this file.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='daegwang_deletion_url' AND decrypted_secret ~ '^https://[^/]+/api/internal/deletions$')
 OR NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='daegwang_deletion_secret' AND length(decrypted_secret)>=32) THEN
  RAISE EXCEPTION 'Configure deletion endpoint and worker secret in Vault first';
 END IF;
END $$;
SELECT cron.schedule('daegwang-deletions','*/5 * * * *',$$
 SELECT net.http_post(
  url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='daegwang_deletion_url'),
  headers := jsonb_build_object('Content-Type','application/json','Authorization',
   'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='daegwang_deletion_secret')),
  body := '{}'::jsonb,
  timeout_milliseconds := 55000
 );
$$);
-- Check net._http_response for HTTP status AND the deferred/pending counters.
-- A successful cron SQL run only means the HTTP request was queued.
-- Pause: SELECT cron.unschedule('daegwang-deletions');
