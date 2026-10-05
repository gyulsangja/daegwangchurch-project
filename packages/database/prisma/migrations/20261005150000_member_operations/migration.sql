CREATE TABLE "member_profiles" (
  "ownerId" UUID PRIMARY KEY, "displayName" TEXT NOT NULL DEFAULT '', "consentVersion" TEXT,
  "consentedAt" TIMESTAMP(3), "consentSnapshot" JSONB, "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "member_care_requests" (
  "id" TEXT PRIMARY KEY, "ownerId" UUID NOT NULL, "requestKey" UUID NOT NULL, "content" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED' CHECK ("status" IN ('RECEIVED','DISCUSSING','SCHEDULED','COMPLETED','CANCELLED')),
  "policyVersion" TEXT NOT NULL, "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "member_care_requests_ownerId_requestKey_key" ON "member_care_requests"("ownerId", "requestKey");
CREATE INDEX "member_care_requests_ownerId_createdAt_id_idx" ON "member_care_requests"("ownerId", "createdAt", "id");
CREATE INDEX "member_care_requests_expiresAt_idx" ON "member_care_requests"("expiresAt");
CREATE TABLE "church_groups" (
  "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT NOT NULL DEFAULT '', "isActive" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "group_memberships" (
  "groupId" TEXT NOT NULL REFERENCES "church_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "ownerId" UUID NOT NULL, "approvedBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("groupId", "ownerId")
);
CREATE INDEX "group_memberships_ownerId_idx" ON "group_memberships"("ownerId");
CREATE TABLE "group_managers" (
  "groupId" TEXT NOT NULL REFERENCES "church_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "adminId" TEXT NOT NULL, PRIMARY KEY ("groupId", "adminId")
);
CREATE TABLE "group_preferences" (
  "ownerId" UUID PRIMARY KEY, "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "notifications" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0), "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "group_notices" (
  "id" TEXT PRIMARY KEY, "groupId" TEXT NOT NULL REFERENCES "church_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" TEXT NOT NULL, "body" TEXT NOT NULL, "audience" TEXT NOT NULL CHECK ("audience" IN ('PUBLIC','MEMBERS')),
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT', "publishedAt" TIMESTAMP(3), "deletedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "group_notices_groupId_status_publishedAt_idx" ON "group_notices"("groupId", "status", "publishedAt");
-- All reads go through authenticated, owner/manager-scoped server services.
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['member_profiles','member_care_requests','church_groups','group_memberships','group_managers','group_preferences','group_notices'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON %I FROM PUBLIC', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON %I FROM anon', t); END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON %I FROM authenticated', t); END IF;
  END LOOP;
END $$;
