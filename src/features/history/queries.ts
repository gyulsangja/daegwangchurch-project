import "server-only";
import { getPrisma } from "@/lib/db/prisma";
import { hasDatabaseConfig } from "@/lib/env";

export async function getAdminHistoryItems() { if (!hasDatabaseConfig()) return []; return getPrisma().historyItem.findMany({ where: { deletedAt: null }, orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { sortOrder: "asc" }] }); }
export async function getAdminHistoryItem(id: string) { if (!hasDatabaseConfig()) return null; return getPrisma().historyItem.findFirst({ where: { id, deletedAt: null } }); }
export async function getPublicHistoryItems() { if (!hasDatabaseConfig()) return []; try { return await getPrisma().historyItem.findMany({ where: { deletedAt: null, isVisible: true }, orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { sortOrder: "asc" }] }); } catch (error) { console.error("Failed to load history", error); return []; } }
