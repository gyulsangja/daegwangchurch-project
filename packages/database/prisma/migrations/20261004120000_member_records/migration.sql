-- Private member records. No administrator-facing read endpoint is provided.
CREATE TYPE "MemberRecordKind" AS ENUM ('REFLECTION', 'PRAYER', 'SPECIAL_PRAYER');
CREATE TABLE "member_records" (
  "id" TEXT NOT NULL,
  "ownerId" UUID NOT NULL,
  "kind" "MemberRecordKind" NOT NULL,
  "content" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "member_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_records_version_positive" CHECK ("version" > 0)
);
CREATE INDEX "member_records_ownerId_updatedAt_id_idx" ON "member_records"("ownerId", "updatedAt", "id");
CREATE INDEX "member_records_ownerId_kind_updatedAt_id_idx" ON "member_records"("ownerId", "kind", "updatedAt", "id");
ALTER TABLE "member_records" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "member_records" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "member_records" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "member_records" FROM authenticated; END IF;
END $$;
