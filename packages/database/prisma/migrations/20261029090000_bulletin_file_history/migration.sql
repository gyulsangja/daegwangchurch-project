CREATE TABLE "bulletin_file_versions" (
 "id" TEXT NOT NULL,
 "bulletinId" TEXT NOT NULL,
 "mediaId" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "capturedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "bulletin_file_versions_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "bulletin_file_versions_bulletinId_fkey" FOREIGN KEY ("bulletinId") REFERENCES "bulletins"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "bulletin_file_versions_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "bulletin_file_versions_bulletinId_mediaId_key" ON "bulletin_file_versions"("bulletinId","mediaId");
CREATE INDEX "bulletin_file_versions_bulletinId_capturedAt_idx" ON "bulletin_file_versions"("bulletinId","capturedAt");
ALTER TABLE "bulletin_file_versions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "bulletin_file_versions" FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON public.bulletin_file_versions FROM %I',r); END IF;
 END LOOP;
END $$;
