CREATE TABLE "member_schedules" (
  "id" TEXT NOT NULL, "ownerId" UUID NOT NULL, "eventId" TEXT,
  "content" JSONB, "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "member_schedules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_schedules_version_positive" CHECK ("version" > 0),
  CONSTRAINT "member_schedules_shape" CHECK (("eventId" IS NOT NULL AND "content" IS NULL AND "startsAt" IS NULL AND "endsAt" IS NULL) OR ("eventId" IS NULL AND "content" IS NOT NULL AND "startsAt" IS NOT NULL AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt")),
  CONSTRAINT "member_schedules_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "member_schedules_ownerId_eventId_key" ON "member_schedules"("ownerId", "eventId");
CREATE INDEX "member_schedules_ownerId_startsAt_id_idx" ON "member_schedules"("ownerId", "startsAt", "id");
ALTER TABLE "member_schedules" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "member_schedules" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "member_schedules" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "member_schedules" FROM authenticated; END IF;
END $$;
