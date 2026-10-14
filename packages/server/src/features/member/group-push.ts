import type { PrismaClient } from '@daegwang/database/generated/client';

// Re-check both publication and current membership; interest never grants private access.
export async function readableGroupNotice(db: PrismaClient, ownerId: string, id: string, now: Date) {
  return db.groupNotice.findFirst({ where: { id, status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: now }, group: { isActive: true }, OR: [{ audience: 'PUBLIC' }, { audience: 'MEMBERS', group: { memberships: { some: { ownerId } } } }] } });
}
export async function eligibleGroupPush(db: PrismaClient, ownerId: string, id: string, now: Date) {
  const preference = await db.groupPreference.findUnique({ where: { ownerId } });
  if (!preference?.notifications) return null;
  const notice = await readableGroupNotice(db, ownerId, id, now);
  if (!notice?.publishedAt || notice.publishedAt < preference.updatedAt) return null;
  const membership = await db.groupMembership.findUnique({ where: { groupId_ownerId: { groupId: notice.groupId, ownerId } } });
  if (notice.audience === 'MEMBERS') {
    if (!membership || notice.publishedAt < membership.createdAt) return null;
  } else if (!preference.interests.includes(notice.groupId) && (!membership || notice.publishedAt < membership.createdAt)) return null;
  return notice;
}
