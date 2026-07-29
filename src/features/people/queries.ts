import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { hasDatabaseConfig } from "@/lib/env";

export function getCareerLines(career: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(career)) return [];
  return career.filter((item): item is string => typeof item === "string");
}

export async function getAdminPeople(query = "") {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  return getPrisma().person.findMany({
    where: {
      deletedAt: null,
      ...(keyword ? { OR: [
        { name: { contains: keyword, mode: "insensitive" as const } },
        { position: { contains: keyword, mode: "insensitive" as const } },
        { ministry: { contains: keyword, mode: "insensitive" as const } },
      ] } : {}),
    },
    include: { profileImage: true },
    orderBy: [{ isSeniorPastor: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    take: 100,
  });
}

export async function getAdminPerson(id: string) {
  if (!hasDatabaseConfig()) return null;
  return getPrisma().person.findFirst({ where: { id, deletedAt: null }, include: { profileImage: true } });
}

export async function getVisiblePeople() {
  if (!hasDatabaseConfig()) return [];
  try {
    return await getPrisma().person.findMany({
      where: { isVisible: true, deletedAt: null },
      include: { profileImage: true },
      orderBy: [{ isSeniorPastor: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
  } catch (error) {
    console.error("Failed to load visible people", error);
    return [];
  }
}

