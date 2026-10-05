CREATE TABLE "member_bookmarks" (
  "id" TEXT NOT NULL,
  "ownerId" UUID NOT NULL,
  "worshipId" TEXT NOT NULL,
  "type" "WorshipContentType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_bookmarks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "member_bookmarks_ownerId_worshipId_key" ON "member_bookmarks"("ownerId", "worshipId");
CREATE INDEX "member_bookmarks_ownerId_createdAt_id_idx" ON "member_bookmarks"("ownerId", "createdAt", "id");
ALTER TABLE "member_bookmarks" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "member_bookmarks" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "member_bookmarks" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "member_bookmarks" FROM authenticated; END IF;
END $$;
