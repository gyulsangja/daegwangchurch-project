import { readFile, writeFile } from 'node:fs/promises';
import { worshipSnapshot } from '@daegwang/server/features/worship/app-publication-core';
import { worshipFormSchema } from '@daegwang/contracts/features/worship/schema';
process.loadEnvFile('apps/admin/.env.local');
const { getPrisma } = await import('@daegwang/database/prisma'); const db = getPrisma();
const archive = JSON.parse(await readFile('test-results/content-import/youtube-archive.json', 'utf8'));
const now = new Date();
function datedTitle(title) {
  const match = title.match(/(?:^|\D)(20\d{2})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})(?:일|\D|$)/);
  if (!match) return null;
  const day = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day ? day : null;
}
function transform(item) {
  const v = item.video, snippet = v.snippet;
  const lines = snippet.description.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const quoted = lines.map(line => line.match(/^[“"‘'](.+)[”"’']$/)?.[1]).find(s => s && s.length <= 160);
  const title = quoted || snippet.title;
  const stamp = v.liveStreamingDetails?.actualStartTime || snippet.publishedAt;
  const fallbackDay = new Date(new Date(stamp).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const contentDate = datedTitle(snippet.title) || fallbackDay;
  const input = worshipFormSchema.parse({ type: item.type, title, contentDate, youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`, preacher: lines.find(line => /^[가-힣\s]{2,20}\s(?:목사|전도사|강도사)$/.test(line)) || '', sermonTitle: title, scripture: lines.find(line => /^[가-힣\s]{1,16}\s?\d{1,3}\s*:\s*\d/.test(line)) || '', description: `${snippet.title}\n\n${snippet.description}`.trim().slice(0, 2000), summary: '', status: 'PUBLISHED', isPinned: false });
  return { ...input, id: `legacy-yt-${item.id}`, slug: `youtube-${item.id}`, contentDate: new Date(`${contentDate}T00:00:00Z`), youtubeVideoId: item.id, thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`, preacher: input.preacher ?? null, sermonTitle: title, scripture: input.scripture ?? null, description: input.description ?? null, summary: null, publishedAt: new Date(snippet.publishedAt), createdAt: now, updatedAt: now, deletedAt: null, isLive: false, thumbnailId: null };
}
try {
  const existing = await db.worshipContent.findMany({ select: { id: true, youtubeVideoId: true } });
  const ids = new Set(existing.map(v => v.youtubeVideoId));
  const records = archive.videos.filter(v => !ids.has(v.id)).map(transform);
  const report = { sourceCount: archive.videos.length, existingSkipped: archive.videos.length - records.length, newRecords: records.length, byType: Object.fromEntries([...new Set(records.map(v => v.type))].map(type => [type, records.filter(v => v.type === type).length])), fallbackDates: archive.videos.filter(v => !datedTitle(v.video.snippet.title)).length };
  console.log(report);
  await writeFile('test-results/content-import/youtube-import-plan.json', JSON.stringify({ report, records }, null, 2));
  if (process.argv.includes('--apply')) {
    let created = 0;
    for (let i = 0; i < records.length; i += 200) {
      const batch = records.slice(i, i + 200);
      await db.$transaction(async tx => {
        await tx.worshipContent.createMany({ data: batch });
        await tx.worshipRevision.createMany({ data: batch.map(row => ({ id: `${row.id}-r1`, worshipContentId: row.id, revisionNo: 1, type: row.type, payload: worshipSnapshot(row) })) });
        await tx.worshipPublication.createMany({ data: batch.map(row => ({ worshipContentId: row.id, channel: 'APP', publishedRevisionId: `${row.id}-r1`, sourceUpdatedAt: now, startsAt: row.publishedAt })) });
        await tx.activityLog.create({ data: { action: 'CREATE', entityType: 'LegacyYouTubeImport', summary: `유튜브 공개 예배 영상 ${batch.length}개 홈페이지·앱 통합 등록`, changes: { sourceChannel: archive.channelId, count: batch.length, firstId: batch[0].youtubeVideoId, lastId: batch.at(-1).youtubeVideoId } } });
      }, { timeout: 30000 });
      created += batch.length; console.log({ created, total: records.length });
    }
    await writeFile('test-results/content-import/youtube-import-result.json', JSON.stringify({ ...report, created, completedAt: new Date().toISOString() }, null, 2));
  }
} finally { await db.$disconnect(); }
