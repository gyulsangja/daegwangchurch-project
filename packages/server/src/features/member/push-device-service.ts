import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { pushCredentialSchema, pushRegistrationSchema } from '@daegwang/contracts/features/member/push';
import { MemberRecordConflict } from './record-service';

const hash = (secret: string) => createHash('sha256').update(secret).digest('hex');
const matches = (secret: string, expected: string) => expected.length === 64 && timingSafeEqual(Buffer.from(hash(secret)), Buffer.from(expected));
export function createPushDeviceService(db: PrismaClient, identity: string, config: { available: () => boolean; projectId: string }, now = () => new Date()) {
  const ownerId = z.uuid().parse(identity);
  const unsupported = async () => { throw new Error('Unsupported push operation'); };
  return {
    async list(input: unknown) {
      z.object({}).strict().parse(input);
      const available = config.available();
      const devices = available ? await db.memberPushDevice.findMany({ where: { ownerId, expiresAt: { gt: now() } }, select: { id: true, platform: true, expiresAt: true }, take: 5 }) : [];
      return { available, devices: devices.map(row => ({ ...row, expiresAt: row.expiresAt.toISOString() })) };
    },
    async create(input: unknown) {
      const value = pushRegistrationSchema.parse(input);
      if (!config.available() || value.projectId !== config.projectId) throw new Error('Push unavailable');
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}::text, 0))`;
        const previous = await tx.memberPushDevice.findUnique({ where: { id: value.installationId } });
        if (previous && (previous.ownerId !== ownerId || !matches(value.secret, previous.secretHash))) throw new MemberRecordConflict();
        const tokenOwner = await tx.memberPushDevice.findUnique({ where: { token: value.token }, select: { id: true } });
        if (tokenOwner && tokenOwner.id !== value.installationId) throw new MemberRecordConflict();
        if (previous && previous.expiresAt <= now()) await tx.memberPushDevice.delete({ where: { id: previous.id } });
        if ((!previous || previous.expiresAt <= now()) && await tx.memberPushDevice.count({ where: { ownerId, expiresAt: { gt: now() } } }) >= 5) throw new MemberRecordConflict();
        const expiresAt = new Date(now().getTime() + 30 * 86400000);
        const row = await tx.memberPushDevice.upsert({ where: { id: value.installationId },
          create: { id: value.installationId, ownerId, token: value.token, secretHash: hash(value.secret), platform: value.platform, projectId: value.projectId, enabledAt: now(), expiresAt, checkedAt: now(), updatedAt: now() },
          update: { token: value.token, expiresAt, updatedAt: now() }, select: { id: true, platform: true, expiresAt: true },
        });
        return { ...row, expiresAt: row.expiresAt.toISOString() };
      });
    },
    detail: unsupported, remove: unsupported,
  };
}

// This narrowly scoped capability can only unsubscribe its own installation.
// It works after logout/session expiry, without storing an authentication session on disk.
export async function revokePushDevice(db: PrismaClient, input: unknown) {
  const value = pushCredentialSchema.parse(input);
  const row = await db.memberPushDevice.findFirst({ where: { id: value.installationId, secretHash: hash(value.secret) }, select: { ownerId: true } });
  if (!row) return;
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${row.ownerId}::text, 0))`;
    await tx.memberPushDevice.deleteMany({ where: { id: value.installationId, secretHash: hash(value.secret) } });
  });
}
