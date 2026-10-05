import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { AccountOperationError } from './account-service';

export const deletionPolicySchema = z.object({
  version: z.string().trim().min(1).max(100), notice: z.string().trim().min(1).max(10000),
  scope: z.literal('ALL_MEMBER_DATA'), receiptRetentionDays: z.number().int().min(1).max(3650),
}).strict();
export type DeletionPolicy = z.infer<typeof deletionPolicySchema>;
export const deletionInputSchema = z.object({ password: z.string().min(1).max(128), policyVersion: z.string().min(1).max(100), confirm: z.literal('DELETE') }).strict();
export type DeletionProvider = {
  reauthenticate: (owner: string, email: string, password: string) => Promise<void>;
  deleteIdentity: (owner: string) => Promise<void>;
  identityAbsent: (owner: string) => Promise<boolean>;
};

export function createDeletionService(db: PrismaClient, provider: DeletionProvider, now = () => new Date()) {
  return {
    async request(identity: { id: string; email: string }, input: unknown, policy: DeletionPolicy) {
      const ownerId = z.uuid().parse(identity.id); const value = deletionInputSchema.parse(input);
      deletionPolicySchema.parse(policy);
      if (value.policyVersion !== policy.version) throw new AccountOperationError(409);
      // Check before password verification, and again under the account lock.
      if (await db.adminProfile.findUnique({ where: { authUserId: ownerId }, select: { id: true } })) throw new AccountOperationError(403);
      const time = now(); const until = new Date(time.getTime() + 600000); const key = `deletion:${ownerId}`;
      const limits = await db.$queryRaw<Array<{ requestCount: number }>>`INSERT INTO inquiry_rate_limits (key,"windowStartedAt","requestCount","expiresAt","updatedAt") VALUES (${key},${time},1,${until},${time}) ON CONFLICT (key) DO UPDATE SET "requestCount"=CASE WHEN inquiry_rate_limits."expiresAt" <= ${time} THEN 1 ELSE inquiry_rate_limits."requestCount"+1 END, "windowStartedAt"=CASE WHEN inquiry_rate_limits."expiresAt" <= ${time} THEN ${time} ELSE inquiry_rate_limits."windowStartedAt" END, "expiresAt"=CASE WHEN inquiry_rate_limits."expiresAt" <= ${time} THEN ${until} ELSE inquiry_rate_limits."expiresAt" END, "updatedAt"=${time} RETURNING "requestCount"`;
      if (limits[0].requestCount > 5) throw new AccountOperationError(429);
      await provider.reauthenticate(ownerId, identity.email, value.password);
      await db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}::text, 0))`;
        if (await tx.adminProfile.findUnique({ where: { authUserId: ownerId }, select: { id: true } })) throw new AccountOperationError(403);
        if (await tx.memberDeletion.findUnique({ where: { ownerId } })) return;
        await tx.memberDeletion.create({ data: { ownerId, policyVersion: policy.version, policySnapshot: policy, receiptRetentionDays: policy.receiptRetentionDays, nextAttemptAt: now() } });
        // Explicit allowlist. Never delete shared content or another account's data.
        await tx.memberRecord.deleteMany({ where: { ownerId } });
        await tx.memberBookmark.deleteMany({ where: { ownerId } });
        await tx.memberSchedule.deleteMany({ where: { ownerId } });
        await tx.memberPushDevice.deleteMany({ where: { ownerId } });
        await tx.memberNotification.deleteMany({ where: { ownerId } });
        await tx.memberNotificationPreference.deleteMany({ where: { ownerId } });
        await tx.memberCareRequest.deleteMany({ where: { ownerId } });
        await tx.groupMembership.deleteMany({ where: { ownerId } });
        await tx.groupPreference.deleteMany({ where: { ownerId } });
        await tx.pendingRegistration.deleteMany({ where: { ownerId } });
        await tx.memberProfile.deleteMany({ where: { ownerId } });
      });
      return { status: 'accepted' as const };
    },
    async runBatch(limit = 20) {
      z.number().int().min(1).max(100).parse(limit);
      const due = await db.memberDeletion.findMany({ where: { status: 'PENDING', nextAttemptAt: { lte: now() } }, orderBy: [{ nextAttemptAt: 'asc' }, { ownerId: 'asc' }], take: limit });
      const result = { completed: 0, deferred: 0, skipped: 0, receiptsRemoved: 0 };
      for (const job of due) {
        const claim = await db.memberDeletion.updateMany({ where: { ownerId: job.ownerId, status: 'PENDING', attempts: job.attempts, nextAttemptAt: { lte: now() } }, data: { attempts: { increment: 1 }, nextAttemptAt: new Date(now().getTime() + 60000) } });
        if (!claim.count) { result.skipped++; continue; }
        const where = { ownerId: job.ownerId, status: 'PENDING', attempts: job.attempts + 1 };
        try {
          // Defense in depth; database triggers also prevent new admin assignments.
          if (await db.adminProfile.findUnique({ where: { authUserId: job.ownerId }, select: { id: true } })) throw new Error('Protected identity');
          await provider.deleteIdentity(job.ownerId);
          const completed = await db.memberDeletion.updateMany({ where, data: { status: 'COMPLETED', completedAt: now() } });
          result.completed += completed.count;
        } catch {
          // Deliberately retain neither raw provider errors nor credentials.
          const delay = Math.min(86400000, 60000 * 2 ** Math.min(job.attempts, 11));
          await db.memberDeletion.updateMany({ where, data: { nextAttemptAt: new Date(now().getTime() + delay) } });
          result.deferred++;
        }
      }
      const receipts = await db.$queryRaw<Array<{ ownerId: string }>>`SELECT "ownerId" FROM member_deletions WHERE status='COMPLETED' AND "completedAt" + "receiptRetentionDays" * INTERVAL '1 day' <= ${now()} ORDER BY "completedAt" LIMIT ${limit}`;
      for (const receipt of receipts) {
        // A provider outage must never erase the tombstone prematurely.
        try {
          if (!await provider.identityAbsent(receipt.ownerId)) continue;
          await db.memberDeletion.deleteMany({ where: { ownerId: receipt.ownerId, status: 'COMPLETED' } });
          result.receiptsRemoved++;
        } catch { result.deferred++; }
      }
      return result;
    },
  };
}
