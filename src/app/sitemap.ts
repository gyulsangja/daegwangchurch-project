import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/features/settings/queries";
import { getPrisma } from "@/lib/db/prisma";
import { hasDatabaseConfig, publicEnv } from "@/lib/env";

const staticRoutes = [
  "", "/about/church", "/about/vision", "/about/people", "/about/history", "/about/worship-info",
  "/worship/sunday-morning", "/worship/first-hour", "/worship/sunday-afternoon", "/worship/wednesday", "/worship/special", "/worship/praise",
  "/news/notices", "/news/bulletins", "/news/events", "/news/albums",
  "/ministries/elementary", "/ministries/youth", "/ministries/young-adult", "/ministries/blessing-football",
  "/newcomer/guide", "/newcomer/register", "/newcomer/education", "/newcomer/contact", "/location",
];

type DynamicEntry = { path: string; updatedAt: Date };

async function getDynamicEntries(): Promise<DynamicEntry[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const prisma = getPrisma();
    const now = new Date();
    const published = { status: "PUBLISHED" as const, deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] };
    const [worship, notices, bulletins, events, albums, ministries] = await Promise.all([
      prisma.worshipContent.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.notice.findMany({ where: { ...published, AND: [{ OR: [{ publishStartsAt: null }, { publishStartsAt: { lte: now } }] }, { OR: [{ publishEndsAt: null }, { publishEndsAt: { gte: now } }] }] }, select: { slug: true, updatedAt: true } }),
      prisma.bulletin.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.event.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.album.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.ministry.findMany({ where: published, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...worship.map((item) => ({ path: `/worship/videos/${item.slug}`, updatedAt: item.updatedAt })),
      ...notices.map((item) => ({ path: `/news/notices/${item.slug}`, updatedAt: item.updatedAt })),
      ...bulletins.map((item) => ({ path: `/news/bulletins/${item.slug}`, updatedAt: item.updatedAt })),
      ...events.map((item) => ({ path: `/news/events/${item.slug}`, updatedAt: item.updatedAt })),
      ...albums.map((item) => ({ path: `/news/albums/${item.slug}`, updatedAt: item.updatedAt })),
      ...ministries.map((item) => ({ path: `/ministries/${item.slug}`, updatedAt: item.updatedAt })),
    ];
  } catch (error) {
    if ((error as { code?: string }).code !== "EACCES") console.error("Failed to build dynamic sitemap", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, dynamicEntries] = await Promise.all([getSiteSettings(), getDynamicEntries()]);
  const baseUrl = (settings.canonicalUrl || publicEnv.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
  const now = new Date();
  const entries = [
    ...staticRoutes.map((path) => ({ path, updatedAt: now, priority: path === "" ? 1 : 0.7, changeFrequency: path === "" ? "weekly" as const : "monthly" as const })),
    ...dynamicEntries.map((entry) => ({ ...entry, priority: 0.6, changeFrequency: "monthly" as const })),
  ];
  const unique = new Map(entries.map((entry) => [entry.path, entry]));
  return [...unique.values()].map((entry) => ({ url: `${baseUrl}${entry.path}`, lastModified: entry.updatedAt, changeFrequency: entry.changeFrequency, priority: entry.priority }));
}
