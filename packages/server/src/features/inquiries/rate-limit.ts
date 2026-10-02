import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { getPrisma } from "@daegwang/database/prisma";

const WINDOW_MINUTES = 15;
const MAX_REQUESTS = 5;

type RateLimitRow = { requestCount: number };

async function getRequestAddress() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip")?.trim() || "local";
}

function getRateLimitKey(address: string) {
  const secret =
    process.env.INQUIRY_RATE_LIMIT_SALT ||
    process.env.DATABASE_URL ||
    "daegwang-church-local-development";

  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function checkInquiryRateLimit() {
  const key = getRateLimitKey(await getRequestAddress());
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);

  try {
    const rows = await getPrisma().$queryRaw<RateLimitRow[]>`
      INSERT INTO "inquiry_rate_limits"
        ("key", "windowStartedAt", "requestCount", "expiresAt", "updatedAt")
      VALUES
        (${key}, ${now}, 1, ${expiresAt}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "windowStartedAt" = CASE
          WHEN "inquiry_rate_limits"."expiresAt" <= ${now} THEN ${now}
          ELSE "inquiry_rate_limits"."windowStartedAt"
        END,
        "requestCount" = CASE
          WHEN "inquiry_rate_limits"."expiresAt" <= ${now} THEN 1
          ELSE "inquiry_rate_limits"."requestCount" + 1
        END,
        "expiresAt" = CASE
          WHEN "inquiry_rate_limits"."expiresAt" <= ${now} THEN ${expiresAt}
          ELSE "inquiry_rate_limits"."expiresAt"
        END,
        "updatedAt" = ${now}
      RETURNING "requestCount"
    `;

    await getPrisma().inquiryRateLimit.deleteMany({
      where: { expiresAt: { lt: now }, key: { not: key } },
    });

    return {
      allowed: (rows[0]?.requestCount ?? 1) <= MAX_REQUESTS,
      retryAfterMinutes: WINDOW_MINUTES,
    };
  } catch (error) {
    // Keep the form available before the new migration is deployed.
    console.error("Failed to apply inquiry rate limit", error);
    return { allowed: true, retryAfterMinutes: WINDOW_MINUTES };
  }
}
