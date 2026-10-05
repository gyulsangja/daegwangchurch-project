ALTER TABLE "member_notification_preferences" ADD COLUMN "activationTimes" JSONB NOT NULL DEFAULT '{}';
-- Existing opt-ins begin at their last saved setting, never at an invented earlier date.
UPDATE "member_notification_preferences" p SET "activationTimes" = (
  SELECT COALESCE(jsonb_object_agg(k, to_char(p."updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')), '{}'::jsonb)
  FROM unnest(ARRAY['devotional','worship','notices','events','schedules']) k
  WHERE p.content->k = 'true'::jsonb
);
