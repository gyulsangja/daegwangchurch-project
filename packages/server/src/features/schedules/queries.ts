import "server-only";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";
export async function getAdminSchedules() { if (!hasDatabaseConfig()) return []; return getPrisma().worshipSchedule.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }); }
export async function getAdminSchedule(id: string) { if (!hasDatabaseConfig()) return null; return getPrisma().worshipSchedule.findFirst({ where: { id, deletedAt: null } }); }
export async function getPublicSchedules() { if (!hasDatabaseConfig()) return []; try { return await getPrisma().worshipSchedule.findMany({ where: { deletedAt: null, isVisible: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }); } catch (error) { console.error("Failed to load schedules", error); return []; } }
