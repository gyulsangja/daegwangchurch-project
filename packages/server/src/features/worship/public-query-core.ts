import type { PrismaClient, WorshipContentType } from "@daegwang/database/generated/client";

// Legacy WEB publication rules. APP channel publication is a separate later step.
export function createPublicWorshipQueries(
  database: Pick<PrismaClient, "worshipContent">,
  now: () => Date = () => new Date(),
) {
  const visibility = () => ({
    status: "PUBLISHED" as const,
    deletedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now() } }],
  });
  return {
    list(type: WorshipContentType, take = 12) {
      return database.worshipContent.findMany({
        where: { type, ...visibility() },
        orderBy: [{ isPinned: "desc" }, { contentDate: "desc" }, { publishedAt: "desc" }],
        take,
      });
    },
    bySlug(slug: string) {
      return database.worshipContent.findFirst({ where: { slug, ...visibility() } });
    },
  };
}
