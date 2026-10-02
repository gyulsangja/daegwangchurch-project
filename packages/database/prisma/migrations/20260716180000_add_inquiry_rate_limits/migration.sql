-- Store only a keyed hash of the requester address and remove expired rows.
CREATE TABLE "inquiry_rate_limits" (
    "key" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "inquiry_rate_limits_expiresAt_idx" ON "inquiry_rate_limits"("expiresAt");

ALTER TABLE "inquiry_rate_limits" ENABLE ROW LEVEL SECURITY;
