CREATE TABLE "member_notifications" (
  "id" TEXT NOT NULL PRIMARY KEY, "ownerId" UUID NOT NULL,
  "category" TEXT NOT NULL CHECK ("category" IN ('WORD', 'NEWS', 'SCHEDULE')),
  "title" TEXT NOT NULL, "body" TEXT NOT NULL, "target" JSONB, "dedupeKey" TEXT NOT NULL,
  "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "member_notifications_ownerId_dedupeKey_key" ON "member_notifications"("ownerId", "dedupeKey");
CREATE INDEX "member_notifications_ownerId_createdAt_id_idx" ON "member_notifications"("ownerId", "createdAt", "id");
CREATE TABLE "member_notification_preferences" (
  "ownerId" UUID NOT NULL PRIMARY KEY, "content" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0), "updatedAt" TIMESTAMP(3) NOT NULL
);
ALTER TABLE "member_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member_notification_preferences" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "member_notifications", "member_notification_preferences" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "member_notifications", "member_notification_preferences" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "member_notifications", "member_notification_preferences" FROM authenticated; END IF;
END $$;
