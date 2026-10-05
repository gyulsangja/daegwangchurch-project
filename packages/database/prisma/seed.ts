import "../load-env.mjs";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@daegwang/database/generated/client";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL을 설정해 주세요.");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.siteSetting.upsert({
      where: { singletonKey: "SITE" },
      update: {},
      create: {
        singletonKey: "SITE",
        siteName: "대광교회",
        description: "모든 길은 예배로 통합니다.",
        canonicalUrl: "https://daegwangchurch.kr",
        youtubeUrl: "https://www.youtube.com/@서울독산동대광교회",
      },
    });

    const authUserId = process.env.SEED_SUPER_ADMIN_AUTH_USER_ID;
    const email = process.env.SEED_SUPER_ADMIN_EMAIL;

    if (authUserId && email && authUserId !== "00000000-0000-0000-0000-000000000000") {
      await prisma.adminProfile.upsert({
        where: { authUserId },
        update: {
          email,
          displayName: process.env.SEED_SUPER_ADMIN_NAME || "최고 관리자",
          role: "SUPER_ADMIN",
          isActive: true,
        },
        create: {
          authUserId,
          email,
          displayName: process.env.SEED_SUPER_ADMIN_NAME || "최고 관리자",
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
