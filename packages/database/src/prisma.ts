import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@daegwang/database/generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }

  if (!globalForPrisma.prisma) {
    // Each serverless instance owns a pool. Keep it small and release idle clients;
    // Supabase runtime URLs must use transaction pooling (6543), not session mode.
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}
