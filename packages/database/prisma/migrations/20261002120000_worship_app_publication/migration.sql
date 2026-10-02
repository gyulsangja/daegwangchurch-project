-- Additive migration: existing WEB publication fields and rows stay unchanged.
CREATE TYPE "PublicationChannel" AS ENUM ('WEB', 'APP');
CREATE TABLE "worship_revisions" (
  "id" TEXT NOT NULL, "worshipContentId" TEXT NOT NULL, "revisionNo" INTEGER NOT NULL,
  "type" "WorshipContentType" NOT NULL, "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "worship_revisions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "worship_publications" (
  "id" TEXT NOT NULL, "worshipContentId" TEXT NOT NULL, "channel" "PublicationChannel" NOT NULL,
  "publishedRevisionId" TEXT NOT NULL, "sourceUpdatedAt" TIMESTAMP(3) NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3),
  CONSTRAINT "worship_publications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "worship_revisions_worshipContentId_revisionNo_key" ON "worship_revisions"("worshipContentId", "revisionNo");
CREATE UNIQUE INDEX "worship_revisions_worshipContentId_id_key" ON "worship_revisions"("worshipContentId", "id");
CREATE UNIQUE INDEX "worship_publications_worshipContentId_channel_key" ON "worship_publications"("worshipContentId", "channel");
CREATE INDEX "worship_publications_channel_startsAt_id_idx" ON "worship_publications"("channel", "startsAt", "id");
ALTER TABLE "worship_revisions" ADD CONSTRAINT "worship_revisions_worshipContentId_fkey" FOREIGN KEY ("worshipContentId") REFERENCES "worship_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "worship_publications" ADD CONSTRAINT "worship_publications_worshipContentId_fkey" FOREIGN KEY ("worshipContentId") REFERENCES "worship_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "worship_publications" ADD CONSTRAINT "worship_publications_worshipContentId_publishedRevisionId_fkey" FOREIGN KEY ("worshipContentId", "publishedRevisionId") REFERENCES "worship_revisions"("worshipContentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- No direct browser/Data API access, including historical unpublished snapshots.
ALTER TABLE "worship_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "worship_publications" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "worship_revisions", "worship_publications" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "worship_revisions", "worship_publications" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "worship_revisions", "worship_publications" FROM authenticated;
  END IF;
END $$;
