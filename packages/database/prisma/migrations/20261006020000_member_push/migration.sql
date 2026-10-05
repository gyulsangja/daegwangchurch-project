CREATE TABLE "member_push_devices" (
  "id" UUID PRIMARY KEY, "ownerId" UUID NOT NULL, "token" TEXT NOT NULL UNIQUE,
  "secretHash" TEXT NOT NULL, "platform" TEXT NOT NULL CHECK ("platform" IN ('android','ios')),
  "projectId" UUID NOT NULL, "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("id", "ownerId")
);
CREATE INDEX "member_push_devices_expiresAt_checkedAt_idx" ON "member_push_devices"("expiresAt", "checkedAt");
CREATE INDEX "member_push_devices_ownerId_idx" ON "member_push_devices"("ownerId");
CREATE TABLE "member_push_deliveries" (
  "id" TEXT PRIMARY KEY, "ownerId" UUID NOT NULL, "deviceId" UUID NOT NULL,
  "notificationId" TEXT NOT NULL REFERENCES "member_notifications"("id") ON DELETE CASCADE,
  "slotKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','SENDING','ACCEPTED','DELIVERED','FAILED','UNKNOWN','CANCELLED')),
  "attempts" INTEGER NOT NULL DEFAULT 0, "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receiptId" TEXT, "resultCode" TEXT, "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("deviceId", "ownerId") REFERENCES "member_push_devices"("id", "ownerId") ON DELETE CASCADE,
  UNIQUE("deviceId", "notificationId"), UNIQUE("deviceId", "slotKey")
);
CREATE INDEX "member_push_deliveries_status_nextAttemptAt_idx" ON "member_push_deliveries"("status", "nextAttemptAt");
-- Notifications cannot be attached to another account's device, even in an accidental server write.
CREATE FUNCTION public.guard_push_notification_owner() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, public AS $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.member_notifications WHERE id = NEW."notificationId" AND "ownerId" = NEW."ownerId") THEN
    RAISE EXCEPTION 'Notification owner mismatch' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_push_notification_owner() FROM PUBLIC;
CREATE TRIGGER push_notification_owner_guard BEFORE INSERT OR UPDATE ON "member_push_deliveries"
FOR EACH ROW EXECUTE FUNCTION public.guard_push_notification_owner();
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['member_push_devices','member_push_deliveries'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', table_name);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON public.%I FROM anon', table_name); END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', table_name); END IF;
    EXECUTE format('CREATE TRIGGER member_deletion_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_member_deletion()', table_name);
  END LOOP;
END $$;
