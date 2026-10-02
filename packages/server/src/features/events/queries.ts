import "server-only";

import type { Prisma } from "@daegwang/database/generated/client";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";

type EventDescription = { body?: unknown };

export function getEventDescription(description: Prisma.JsonValue | null): string {
  if (typeof description === "string") return description;
  if (description && typeof description === "object" && !Array.isArray(description)) {
    const body = (description as EventDescription).body;
    return typeof body === "string" ? body : "";
  }
  return "";
}

export async function getAdminEvents(query = "") {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  return getPrisma().event.findMany({
    where: {
      deletedAt: null,
      ...(keyword ? { OR: [
        { title: { contains: keyword, mode: "insensitive" as const } },
        { category: { contains: keyword, mode: "insensitive" as const } },
        { location: { contains: keyword, mode: "insensitive" as const } },
      ] } : {}),
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getAdminEvent(id: string) {
  if (!hasDatabaseConfig()) return null;
  return getPrisma().event.findFirst({ where: { id, deletedAt: null } });
}

function publishedWhere(): Prisma.EventWhereInput {
  return { status: "PUBLISHED", deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] };
}

export async function getPublishedEvents(query = "", take = 50) {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  try {
    return await getPrisma().event.findMany({
      where: {
        ...publishedWhere(),
        ...(keyword ? { OR: [
          { title: { contains: keyword, mode: "insensitive" as const } },
          { category: { contains: keyword, mode: "insensitive" as const } },
          { location: { contains: keyword, mode: "insensitive" as const } },
        ] } : {}),
      },
      orderBy: [{ startsAt: "asc" }, { publishedAt: "desc" }],
      take,
    });
  } catch (error) {
    console.error("Failed to load published events", error);
    return [];
  }
}

export async function getPublishedEventBySlug(slug: string) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await getPrisma().event.findFirst({ where: { slug, ...publishedWhere() } });
  } catch (error) {
    console.error("Failed to load published event", error);
    return null;
  }
}

