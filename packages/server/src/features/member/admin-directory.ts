import 'server-only';
import { Prisma } from '@daegwang/database/generated/client';
import { getPrisma } from '@daegwang/database/prisma';
export type DirectoryMember = { id: string; email: string; name: string; createdAt: Date; lastSignInAt: Date | null; status: string; phone: string; position: string; version: number | null; adminId: string | null; role: string | null; activeAdmin: boolean | null; deletionStatus: string | null };
// Called only after requireSuperAdmin. Read the identity directory, including
// older accounts with no member profile; never read password/session columns.
export async function getMemberDirectory(input: { q?: string; status?: string; page?: string }) {
  const q = (input.q ?? '').trim().slice(0, 100); const status = ['PENDING','CONFIRMED','ADMIN','DELETING'].includes(input.status ?? '') ? input.status! : 'ALL';
  const db = getPrisma(); const match = `%${q}%`;
  const joins = Prisma.sql`FROM auth.users u LEFT JOIN member_profiles p ON p."ownerId"=u.id LEFT JOIN church_memberships c ON c."ownerId"=u.id LEFT JOIN admin_profiles a ON a."authUserId"=u.id LEFT JOIN member_deletions d ON d."ownerId"=u.id`;
  const where = Prisma.sql`WHERE COALESCE(u.is_anonymous,false)=false AND u.deleted_at IS NULL AND (${q}='' OR COALESCE(u.email,'') ILIKE ${match} OR COALESCE(p."displayName",'') ILIKE ${match} OR COALESCE(c."realName",'') ILIKE ${match} OR COALESCE(c.phone,'') ILIKE ${match}) AND (${status}='ALL' OR (${status}='ADMIN' AND a."isActive"=true) OR (${status}='DELETING' AND d.status='PENDING') OR c.status=${status})`;
  const count = await db.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT count(*) AS total ${joins} ${where}`);
  const total = Number(count[0].total); const pageCount = Math.max(1, Math.ceil(total / 20)); const page = Math.min(pageCount, Math.max(1, Number.parseInt(input.page ?? '1', 10) || 1));
  const rows = await db.$queryRaw<DirectoryMember[]>(Prisma.sql`SELECT u.id, COALESCE(u.email,'') AS email, COALESCE(NULLIF(c."realName",''),NULLIF(p."displayName",''),NULLIF(a."displayName",''),'이름 미입력') AS name, u.created_at AS "createdAt", u.last_sign_in_at AS "lastSignInAt", COALESCE(c.status,'UNCONFIRMED') AS status, COALESCE(c.phone,'') AS phone, COALESCE(c.position,'') AS position, c.version, a.id AS "adminId", a.role::text AS role, a."isActive" AS "activeAdmin", d.status AS "deletionStatus" ${joins} ${where} ORDER BY u.created_at DESC, u.id LIMIT 20 OFFSET ${(page - 1) * 20}`);
  return { rows, total, page, pageCount, q, status };
}
