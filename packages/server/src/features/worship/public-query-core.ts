import type { PrismaClient, WorshipContentType } from "@daegwang/database/generated/client";

export const worshipVisibility = (now: Date) => ({ status: 'PUBLISHED' as const, deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] });
// Both channels use the same parent publication rules and display order.
export function createPublicWorshipQueries(
  database: Pick<PrismaClient, "worshipContent">,
  now: () => Date = () => new Date(),
) {
  const visibility = () => worshipVisibility(now());
  return {
    list(type: WorshipContentType, take = 12) {
      return database.worshipContent.findMany({
        where: { type, ...visibility() },
        orderBy: [{ isPinned: "desc" }, { contentDate: "desc" }, { id: "desc" }],
        take,
      });
    },
    bySlug(slug: string) {
      return database.worshipContent.findFirst({ where: { slug, ...visibility() } });
    },
  };
}
