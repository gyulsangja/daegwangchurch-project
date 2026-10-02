import "server-only";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";
export async function getAdminProfiles() { if (!hasDatabaseConfig()) return []; return getPrisma().adminProfile.findMany({ orderBy: [{ role: "asc" }, { isActive: "desc" }, { createdAt: "asc" }], include: { _count: { select: { activityLogs: true } } } }); }
export async function getAdminProfile(id: string) { if (!hasDatabaseConfig()) return null; return getPrisma().adminProfile.findUnique({ where: { id }, include: { activityLogs: { orderBy: { createdAt: "desc" }, take: 20 } } }); }
export async function getRecentActivityLogs(take = 50) { if (!hasDatabaseConfig()) return []; return getPrisma().activityLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take }); }
