CREATE TABLE "care_settings" (
  "id" TEXT NOT NULL DEFAULT 'CARE',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "policy" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "care_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "care_settings_singleton" CHECK ("id" = 'CARE')
);
ALTER TABLE "care_settings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "care_settings" FROM anon, authenticated;
