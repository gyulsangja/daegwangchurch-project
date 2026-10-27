// Publish the revised copy already displayed by the website defaults to the shared CMS.
// Never overwrite an existing page or publish a draft. Dry run unless --apply is supplied.
// Run: node --conditions=react-server --import tsx scripts/publish-visitor-copy.mjs [--apply]
import { mkdir, writeFile } from 'node:fs/promises';
import { defaultHomePageContent, defaultChurchContent, pageKeys } from '@daegwang/contracts/features/pages/content';
process.loadEnvFile('apps/admin/.env.local');
const { getPrisma } = await import('@daegwang/database/prisma');
const db = getPrisma();
const pages = [
  { key: pageKeys.home, title: '대광교회 홈페이지', content: defaultHomePageContent },
  { key: pageKeys.church, title: '대광교회 소개', content: defaultChurchContent },
];
try {
  const existing = await db.page.findMany({ where: { key: { in: pages.map(page => page.key) } } });
  console.log(JSON.stringify({ existing: existing.map(page => ({ key: page.key, status: page.status })), proposed: pages }, null, 2));
  if (existing.length) throw new Error('Existing pages found; review in CMS instead of overwriting.');
  if (process.argv.includes('--apply')) {
    await mkdir('.local/visitor-copy-backups', { recursive: true });
    await writeFile(`.local/visitor-copy-backups/${Date.now()}.json`, JSON.stringify({ existing, pages }, null, 2));
    await db.$transaction(pages.map(page => db.page.create({ data: { ...page, status: 'PUBLISHED', publishedAt: new Date() } })));
    console.log('Published shared HOME and ABOUT_CHURCH copy.');
  } else console.log('Dry run only.');
} finally { await db.$disconnect(); }
