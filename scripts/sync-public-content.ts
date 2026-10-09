import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { syncWorshipPublication } from '@daegwang/server/features/worship/sync-publication';
import { worshipVisibility } from '@daegwang/server/features/worship/public-query-core';

// One-time reconciliation for content saved before unified CMS publishing.
// Never edits source content, private drafts, personal records, or push settings.
const env = { ...(existsSync('apps/admin/.env.local') ? parse(readFileSync('apps/admin/.env.local')) : {}), ...process.env };
const apply = process.argv.includes('--apply');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL, max: 2, connectionTimeoutMillis: 10000 }) });
try {
  const rows = await db.worshipContent.findMany({
    where: worshipVisibility(new Date()), orderBy: { id: 'asc' },
    select: { id: true, updatedAt: true, publications: { where: { channel: 'APP' }, select: { sourceUpdatedAt: true, endsAt: true } } },
  });
  const candidates = rows.filter(row => !row.publications.some(publication => publication.sourceUpdatedAt.getTime() === row.updatedAt.getTime() && !publication.endsAt));
  let updated = 0;
  if (apply) {
    updated = await db.$transaction(async tx => {
      let count = 0;
      for (const row of candidates) {
        await tx.$queryRaw`SELECT id FROM worship_contents WHERE id = ${row.id} FOR UPDATE`;
        const content = await tx.worshipContent.findFirst({ where: { id: row.id, ...worshipVisibility(new Date()) } });
        if (!content) continue;
        const publication = await tx.worshipPublication.findUnique({ where: { worshipContentId_channel: { worshipContentId: row.id, channel: 'APP' } } });
        if (publication && publication.sourceUpdatedAt.getTime() === content.updatedAt.getTime() && !publication.endsAt) continue;
        await syncWorshipPublication(tx, content);
        await tx.activityLog.create({ data: { action: 'PUBLISH', entityType: 'WorshipContent', entityId: row.id, summary: '통합 관리 전환: 기존 공개 말씀의 홈페이지·앱 내용 일치' } });
        count++;
      }
      return count;
    }, { timeout: 30000 });
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', published: rows.length, needsSync: candidates.length, updated }));
} catch {
  console.error('Public content reconciliation failed. No content or credentials logged.');
  process.exitCode = 1;
} finally { await db.$disconnect(); }
