import type { Prisma, WorshipContent } from '@daegwang/database/generated/client';
import { worshipSnapshot } from './app-publication-core';

// Called inside the content save transaction; no separate channel write can succeed alone.
export async function syncWorshipPublication(tx: Prisma.TransactionClient, content: WorshipContent) {
  const id = content.id;
  if (content.deletedAt || content.status !== 'PUBLISHED') {
    await tx.worshipPublication.deleteMany({ where: { worshipContentId: id, channel: 'APP' } });
    return;
  }
  const latest = await tx.worshipRevision.findFirst({ where: { worshipContentId: id }, orderBy: { revisionNo: 'desc' } });
  const revision = await tx.worshipRevision.create({ data: {
    worshipContentId: id, revisionNo: (latest?.revisionNo ?? 0) + 1,
    type: content.type, payload: worshipSnapshot(content),
  } });
  const data = { publishedRevisionId: revision.id, sourceUpdatedAt: content.updatedAt, startsAt: content.publishedAt ?? content.createdAt, endsAt: null };
  await tx.worshipPublication.upsert({
    where: { worshipContentId_channel: { worshipContentId: id, channel: 'APP' } },
    create: { worshipContentId: id, channel: 'APP', ...data }, update: data,
  });
}
