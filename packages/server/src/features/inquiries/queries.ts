import "server-only";
import type { Prisma } from "@daegwang/database/generated/client";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";

export async function getAdminInquiries(query = "", status = "") { if (!hasDatabaseConfig()) return []; const keyword = query.trim(); const where: Prisma.InquiryWhereInput = { deletedAt: null, ...(status ? { status: status as Prisma.EnumInquiryStatusFilter["equals"] } : {}), ...(keyword ? { OR: [{ name: { contains: keyword, mode: "insensitive" } }, { title: { contains: keyword, mode: "insensitive" } }, { content: { contains: keyword, mode: "insensitive" } }, { phone: { contains: keyword, mode: "insensitive" } }, { email: { contains: keyword, mode: "insensitive" } }] } : {}) }; return getPrisma().inquiry.findMany({ where, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200 }); }
export async function getAdminInquiry(id: string) { if (!hasDatabaseConfig()) return null; return getPrisma().inquiry.findFirst({ where: { id, deletedAt: null }, include: { notes: { include: { author: true }, orderBy: { createdAt: "desc" } } } }); }
export async function getOpenInquiryCount() { if (!hasDatabaseConfig()) return 0; try { return await getPrisma().inquiry.count({ where: { deletedAt: null, status: { in: ["NEW", "CHECKED", "CONTACTING"] } } }); } catch { return 0; } }
export async function getExpiredInquiryCount(retentionDays: number) { if (!hasDatabaseConfig()) return 0; const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000); return getPrisma().inquiry.count({ where: { status: "COMPLETED", completedAt: { lte: cutoff } } }); }
