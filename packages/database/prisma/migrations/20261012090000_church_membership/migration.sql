CREATE TABLE "church_memberships" (
  "ownerId" UUID PRIMARY KEY REFERENCES "member_profiles"("ownerId") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'UNCONFIRMED' CHECK ("status" IN ('UNCONFIRMED', 'PENDING', 'CONFIRMED')),
  "realName" TEXT NOT NULL DEFAULT '',
  "requestedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE "church_memberships" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "church_memberships" FROM anon, authenticated;
