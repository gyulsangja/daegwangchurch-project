import "server-only";

import type { WorshipContentType } from "@daegwang/database/generated/client";
import { createPublicWorshipQueries } from "@daegwang/server/features/worship/public-query-core";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";

export async function getAdminWorshipContents(query = '') {
  if (!hasDatabaseConfig()) return [];
  return getPrisma().worshipContent.findMany({
    where: { deletedAt: null, ...(query.trim() ? { OR: [
      { title: { contains: query.trim(), mode: 'insensitive' as const } },
      { preacher: { contains: query.trim(), mode: 'insensitive' as const } },
    ] } : {}) },
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
    return await createPublicWorshipQueries(getPrisma()).list(type, take);
  } catch (error) {
    console.error("Failed to load published worship contents", error);
    return [];
  }
}

export async function getPublishedWorshipContentBySlug(slug: string) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await createPublicWorshipQueries(getPrisma()).bySlug(slug);
  } catch (error) {
    console.error("Failed to load worship content", error);
    return null;
  }
}
