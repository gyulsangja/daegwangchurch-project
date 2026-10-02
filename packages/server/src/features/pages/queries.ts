import "server-only";

import { defaultChurchContent, defaultHomePageContent, defaultNewcomerEducationContent, defaultVisionContent, normalizeChurchContent, normalizeHomePageContent, normalizeNewcomerEducationContent, normalizeVisionContent, pageKeys } from "@daegwang/contracts/features/pages/content";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";

async function getPage(key: string, publishedOnly: boolean) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await getPrisma().page.findFirst({ where: { key, deletedAt: null, ...(publishedOnly ? { status: "PUBLISHED" as const } : {}) } });
  } catch (error) {
    console.error(`Failed to load page ${key}`, error);
    return null;
  }
}

export async function getChurchPageContent(publishedOnly = true) {
  const page = await getPage(pageKeys.church, publishedOnly);
  return { content: page ? normalizeChurchContent(page.content) : defaultChurchContent, status: page?.status ?? "DRAFT" as const };
}

export async function getVisionPageContent(publishedOnly = true) {
  const page = await getPage(pageKeys.vision, publishedOnly);
  return { content: page ? normalizeVisionContent(page.content) : defaultVisionContent, status: page?.status ?? "DRAFT" as const };
}

export async function getNewcomerEducationContent(publishedOnly = true) {
  const page = await getPage(pageKeys.newcomerEducation, publishedOnly);
  return { content: page ? normalizeNewcomerEducationContent(page.content) : defaultNewcomerEducationContent, status: page?.status ?? "DRAFT" as const };
}

export async function getHomePageContent(publishedOnly = true) { const page = await getPage(pageKeys.home, publishedOnly); return { content: page ? normalizeHomePageContent(page.content) : defaultHomePageContent, status: page?.status ?? "DRAFT" as const }; }
