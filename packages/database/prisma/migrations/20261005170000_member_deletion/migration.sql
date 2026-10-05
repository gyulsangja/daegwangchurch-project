CREATE TABLE "member_deletions" (
  "ownerId" UUID PRIMARY KEY, "policyVersion" TEXT NOT NULL, "policySnapshot" JSONB NOT NULL,
  "receiptRetentionDays" INTEGER NOT NULL CHECK ("receiptRetentionDays" BETWEEN 1 AND 3650),
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','COMPLETED')),
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0),
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
  CHECK (("status" = 'COMPLETED') = ("completedAt" IS NOT NULL))
);
CREATE INDEX "member_deletions_status_nextAttemptAt_idx" ON "member_deletions"("status", "nextAttemptAt");
ALTER TABLE "member_deletions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "member_deletions" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON "member_deletions" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON "member_deletions" FROM authenticated; END IF;
END $$;

-- The deletion service takes the same transaction lock before creating the tombstone.
-- VOLATILE queries see the latest committed tombstone after a concurrent lock wait.
CREATE FUNCTION public.guard_member_deletion() RETURNS trigger LANGUAGE plpgsql VOLATILE
SET search_path = pg_catalog, public AS $$
DECLARE member_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'admin_profiles' THEN
    member_id := NEW."authUserId";
    IF TG_OP = 'UPDATE' AND OLD."authUserId" <> member_id THEN
      RAISE EXCEPTION 'Member identity cannot change' USING ERRCODE = '23514';
    END IF;
  ELSE
    member_id := NEW."ownerId";
    IF TG_OP = 'UPDATE' AND OLD."ownerId" <> member_id THEN
      RAISE EXCEPTION 'Member identity cannot change' USING ERRCODE = '23514';
    END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(member_id::text, 0));
  IF EXISTS (SELECT 1 FROM public.member_deletions WHERE "ownerId" = member_id) THEN
    RAISE EXCEPTION 'Member unavailable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_member_deletion() FROM PUBLIC;
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['member_records','member_bookmarks','member_schedules','member_notifications',
    'member_notification_preferences','member_profiles','pending_registrations','member_care_requests',
    'group_memberships','group_preferences','admin_profiles'] LOOP
    EXECUTE format('CREATE TRIGGER member_deletion_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_member_deletion()', table_name);
  END LOOP;
END $$;
