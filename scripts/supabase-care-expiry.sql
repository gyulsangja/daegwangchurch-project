-- Run with the service/database owner. Does not change any request's agreed expiry.
-- Existing pg_cron extension is required. No request contents enter cron logs.
SELECT cron.schedule('daegwang-care-expiry', '*/5 * * * *',
  $job$DELETE FROM public.member_care_requests WHERE "expiresAt" <= CURRENT_TIMESTAMP$job$);
