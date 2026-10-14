-- Migration history is internal infrastructure, never client-facing data.
-- Keep owner access for Prisma migrate; do not FORCE ROW LEVEL SECURITY.
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM PUBLIC, anon, authenticated;
-- No client policy: all browser/mobile Data API access must remain denied.
