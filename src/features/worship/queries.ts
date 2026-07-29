import "server-only";

import type { WorshipContentType } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { hasDatabaseConfig } from "@/lib/env";

export async function getAdminWorshipContents() {
  if (!hasDatabaseConfig()) return [];
  return getPrisma().worshipContent.findMany({
    where: { deletedAt: null },
    orderBy: [{ isPinned: "desc" }, { contentDate: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getAdminWorshipContent(id: string) {
  if (!hasDatabaseConfig()) return null;
  return getPrisma().worshipContent.findFirst({ where: { id, deletedAt: null } });
}

export async function getPublishedWorshipContents(type: WorshipContentType, take = 12) {
  if (!hasDatabaseConfig()) return [];
  try {
    return await getPrisma().worshipContent.findMany({
      where: {
        type,
        status: "PUBLISHED",
        deletedAt: null,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      orderBy: [{ isPinned: "desc" }, { contentDate: "desc" }, { publishedAt: "desc" }],
      take,
    });
  } catch (error) {
    console.error("Failed to load published worship contents", error);
    return [];
  }
}

export async function getPublishedWorshipContentBySlug(slug: string) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await getPrisma().worshipContent.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        deletedAt: null,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
    });
  } catch (error) {
    console.error("Failed to load worship content", error);
    return null;
  }
}
