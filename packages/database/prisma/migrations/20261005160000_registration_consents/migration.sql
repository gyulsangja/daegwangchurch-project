CREATE TABLE "pending_registrations" (
  "ownerId" UUID PRIMARY KEY, "emailHash" TEXT NOT NULL, "displayName" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL, "termsHash" TEXT NOT NULL, "privacyHash" TEXT NOT NULL, "policySnapshot" JSONB NOT NULL,
  "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "pending_registrations_expiresAt_idx" ON "pending_registrations"("expiresAt");
ALTER TABLE "pending_registrations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "pending_registrations" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON "pending_registrations" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON "pending_registrations" FROM authenticated; END IF;
END $$;
