import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { readCareSettings, saveCareSettings } from '@daegwang/server/features/member/care-settings';
import { createCareService, createCareAdminService } from '@daegwang/server/features/member/care-service';
const url = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/daegwang_worship_test') throw new Error('Isolated local database required');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
after(() => db.$disconnect());
test('care settings enforce role, preserve contact data and govern real requests', async () => {
  const admin = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: `${randomUUID()}@example.test`, displayName: 'Care test', role: 'SUPER_ADMIN' } });
  const other = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: `${randomUUID()}@example.test`, displayName: 'Other', role: 'ADMIN' } });
  await db.siteSetting.upsert({ where: { singletonKey: 'SITE' }, create: { siteName: 'Test', canonicalUrl: 'https://example.test', contactOptions: { parkingInfo: 'keep' } }, update: { contactOptions: { parkingInfo: 'keep' } } });
  const policy = { version: randomUUID(), notice: 'Test consent', retentionDays: 90, adminIds: [admin.id] };
  await assert.rejects(saveCareSettings(db, other.id, { enabled: true, policy }));
  await assert.rejects(saveCareSettings(db, admin.id, { enabled: true, policy: { ...policy, adminIds: [randomUUID()] } }));
  await saveCareSettings(db, admin.id, { enabled: true, policy });
  assert.equal((await readCareSettings(db))?.enabled, true);
  assert.deepEqual((await db.siteSetting.findUniqueOrThrow({ where: { singletonKey: 'SITE' } })).contactOptions, { parkingInfo: 'keep' });
  const member = createCareService(db, randomUUID(), policy);
  const request = await member.create({ content: { kind: 'COUNSELING', name: 'Test', phone: '01012345678', preferredTime: '', message: '', method: 'DISCUSS' }, consent: true, policyVersion: policy.version, requestKey: randomUUID() });
  await assert.rejects(createCareAdminService(db, other.id, policy).list());
  await saveCareSettings(db, admin.id, { enabled: false, policy });
  assert.equal((await readCareSettings(db))?.enabled, false);
  assert.ok((await createCareAdminService(db, admin.id, policy).list()).some(row => row.id === request.id));
  await createCareAdminService(db, admin.id, policy).update(request.id, request.version, 'DISCUSSING');
  assert.equal((await member.detail(request.id)).status, 'DISCUSSING');
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(db.$transaction(async tx => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
      await tx.careSetting.findMany();
    }));
  }
  await db.memberCareRequest.delete({ where: { id: request.id } });
});
