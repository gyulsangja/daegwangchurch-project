import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { hasDatabaseConfig } from "@/lib/env";

export function getMinistryPrograms(sections: Prisma.JsonValue | null): string[] { if (!sections || typeof sections !== "object" || Array.isArray(sections)) return []; const programs = (sections as { programs?: unknown }).programs; return Array.isArray(programs) ? programs.filter((item): item is string => typeof item === "string") : []; }
export async function getAdminMinistries(query = "") { if (!hasDatabaseConfig()) return []; const keyword = query.trim(); return getPrisma().ministry.findMany({ where: { deletedAt: null, ...(keyword ? { OR: [{ name: { contains: keyword, mode: "insensitive" as const } }, { introduction: { contains: keyword, mode: "insensitive" as const } }] } : {}) }, include: { coverImage: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 100 }); }
export async function getAdminMinistry(id: string) { if (!hasDatabaseConfig()) return null; return getPrisma().ministry.findFirst({ where: { id, deletedAt: null }, include: { coverImage: true } }); }
export async function getPublishedMinistry(slug: string) { if (!hasDatabaseConfig()) return null; try { return await getPrisma().ministry.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] }, include: { coverImage: true } }); } catch (error) { console.error("Failed to load ministry", error); return null; } }
