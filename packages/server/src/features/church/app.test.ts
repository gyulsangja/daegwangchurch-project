import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { createAppChurchQueries } from './app-query-core';
import { createAppChurchHandler } from './app-api';
import { createChurchClient } from '@daegwang/api-client/church';
import { telephoneUrl, emailUrl, directionsUrl } from '@daegwang/contracts/features/church/links';
test('church queries enforce publication/visibility and strip internal fields without invented defaults', async () => {
  const now = new Date('2026-10-04T00:00:00Z');
  const calls: unknown[] = [];
  const database = { page: { findFirst: async (args: unknown) => { calls.push(args); return { title: '소개', content: { body: '공개 본문', internal: 'secret' }, secret: 'private' }; } },
    worshipSchedule: { findMany: async (args: unknown) => { calls.push(args); return [{ id: 's1', name: '예배', dayLabel: '주일', timeLabel: '11:00', location: null, note: null, isVisible: true }]; } } } as unknown as Pick<PrismaClient, 'page' | 'worshipSchedule' | 'person' | 'siteSetting'>;
  const queries = createAppChurchQueries(database, () => now);
  const about = await queries.about(); assert.equal(about?.content.body, '공개 본문'); assert.equal(about?.content.heroTitle, ''); assert.ok(!JSON.stringify(about).includes('secret'));
  const schedules = await queries.schedules(); assert.ok(!JSON.stringify(schedules).includes('isVisible'));
  const args = calls as Array<{ where: unknown }>;
  assert.deepEqual(args[0].where, { key: 'ABOUT_CHURCH', status: 'PUBLISHED', deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] });
  assert.deepEqual(args[1].where, { deletedAt: null, isVisible: true });
});
test('church API distinguishes disabled, hidden, empty and DB failure; client validates response', async () => {
  const queries = () => ({ about: async () => null, schedules: async () => [], pastor: async () => null, newcomer: async () => null, contact: async () => null });
  const handle = createAppChurchHandler(queries, () => true);
  assert.equal((await handle('unknown')).status, 404); assert.equal((await handle('about')).status, 404);
  const empty = await handle('schedules'); assert.equal(empty.headers.get('Cache-Control'), 'no-store'); assert.deepEqual(await empty.json(), { data: [] });
  const fail = () => { throw new Error('secret DB error'); };
  assert.equal((await createAppChurchHandler(fail, () => false)('about')).status, 503);
  const error = await createAppChurchHandler(fail, () => true)('schedules'); assert.equal(error.status, 503); assert.ok(!(await error.text()).includes('secret'));
  const client = createChurchClient('http://test', async input => handle(new URL(String(input)).pathname.split('/').at(-1)!));
  assert.deepEqual(await client.schedules(), []); await assert.rejects(client.about(), /공개된 안내/);
  await assert.rejects(createChurchClient('http://test', async () => Response.json({ data: {} })).schedules());
});
test('pastor media is public only, newcomer respects publication and contact excludes internal options', async () => {
  let visibility = 'PRIVATE';
  const calls: Array<{ where: unknown }> = [];
  const database = {
    person: { findFirst: async (args: { where: unknown }) => { calls.push(args); return { name: '목사', position: '담임', introduction: null, quote: null, career: ['약력', { secret: true }], profileImage: { visibility, deletedAt: null, mimeType: 'image/png', bucket: 'public', objectPath: 'pastor.png' } }; } },
    page: { findFirst: async (args: { where: unknown }) => { calls.push(args); return { title: '새가족', content: { heroTitle: '환영', internal: 'secret' } }; } },
    siteSetting: { findUnique: async () => ({ siteName: '교회', address: null, addressDetail: null, phone: null, email: null, canonicalUrl: 'javascript:alert(1)', mapLatitude: 0, mapLongitude: 0, contactOptions: { transitInfo: '버스', privacyOfficer: 'private' } }) },
  } as unknown as Pick<PrismaClient, 'page' | 'worshipSchedule' | 'person' | 'siteSetting'>;
  const now = new Date('2026-10-04T00:00:00Z');
  const queries = createAppChurchQueries(database, () => now, 'https://example.com');
  assert.equal((await queries.pastor())?.imageUrl, null);
  visibility = 'PUBLIC'; assert.equal((await queries.pastor())?.imageUrl, 'https://example.com/storage/v1/object/public/public/pastor.png');
  assert.deepEqual(calls[0].where, { isVisible: true, isSeniorPastor: true, deletedAt: null });
  const newcomer = await queries.newcomer(); assert.ok(!JSON.stringify(newcomer).includes('secret'));
  assert.deepEqual(calls[2].where, { key: 'NEWCOMER_EDUCATION', status: 'PUBLISHED', deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] });
  const contact = await queries.contact(); assert.equal(contact?.latitude, 0); assert.equal(contact?.websiteUrl, null); assert.ok(!JSON.stringify(contact).includes('privacyOfficer'));
});
test('contact links encode destinations and reject missing or unsafe phone/email values', () => {
  assert.equal(telephoneUrl('02-1234-5678'), 'tel:0212345678'); assert.equal(telephoneUrl('123;456789'), null);
  assert.equal(emailUrl('hello@example.com'), 'mailto:hello%40example.com'); assert.equal(emailUrl('hello@example.com?bcc=other'), null);
  assert.equal(directionsUrl({ latitude: 0, longitude: 0, address: '' }), 'https://www.google.com/maps/dir/?api=1&destination=0%2C0');
  assert.equal(directionsUrl({ latitude: null, longitude: null, address: '' }), null);
  assert.ok(directionsUrl({ latitude: null, longitude: null, address: '서울 A&B' })?.includes('%26'));
});
