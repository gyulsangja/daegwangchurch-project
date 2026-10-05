import type { PrismaClient } from '@daegwang/database/generated/client';
import { createAutomaticNotificationService, type NotificationSources } from './notification-sync';
import { koreanDay, planPush } from './push-policy';
import type { PushProvider, PushResult } from './push-provider';

export function createPushWorker(db: PrismaClient, provider: PushProvider, sources: NotificationSources, clock = () => new Date()) {
  return async () => {
    const deadline = Date.now() + 40000;
    const totals = { checked: 0, queued: 0, accepted: 0, confirmed: 0, cancelled: 0, failed: 0, uncertain: 0 };
    await db.memberPushDevice.deleteMany({ where: { expiresAt: { lte: clock() } } });
    await db.memberPushDelivery.deleteMany({ where: { createdAt: { lt: new Date(clock().getTime() - 30 * 86400000) } } });
    // A crashed process might already have sent a request. Never blindly re-send it.
    await db.memberPushDelivery.updateMany({ where: { status: 'SENDING', nextAttemptAt: { lte: clock() } }, data: { status: 'UNKNOWN', resultCode: 'InterruptedSend' } });
    const devices = await db.memberPushDevice.findMany({ where: { expiresAt: { gt: clock() } }, orderBy: [{ checkedAt: 'asc' }, { id: 'asc' }], take: 100 });
    const synced = new Set<string>();
    for (const device of devices) {
      if (Date.now() >= deadline) break;
      if (!synced.has(device.ownerId)) {
        await createAutomaticNotificationService(db, device.ownerId, { ...sources, push: true }, clock).synchronize(); synced.add(device.ownerId);
      }
      const notifications = await db.memberNotification.findMany({ where: { ownerId: device.ownerId, readAt: null, createdAt: { gte: new Date(Math.max(device.enabledAt.getTime(), clock().getTime() - 86400000)) }, pushDeliveries: { none: { deviceId: device.id } } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 100 });
      for (const row of notifications) {
        if (Date.now() >= deadline) break;
        const plan = await planPush(db, device, row, sources, clock());
        if (!plan) continue;
        // The owner lock serializes queue creation with device revocation/deletion.
        await db.$transaction(async tx => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${device.ownerId}::text, 0))`;
          if (!await tx.memberPushDevice.findFirst({ where: { id: device.id, ownerId: device.ownerId, expiresAt: { gt: clock() } } }) || await tx.memberDeletion.findUnique({ where: { ownerId: device.ownerId } })) return;
          const result = await tx.memberPushDelivery.createMany({ data: [{ ownerId: device.ownerId, deviceId: device.id, notificationId: row.id, slotKey: plan.slotKey, nextAttemptAt: plan.due, createdAt: clock() }], skipDuplicates: true });
          totals.queued += result.count;
        });
      }
      // Preserve updatedAt as the last registration/rotation time. Prisma's automatic
      // updatedAt would otherwise make a scheduler scan look like a fresh device consent.
      await db.$executeRaw`UPDATE member_push_devices SET "checkedAt"=${clock()} WHERE id=${device.id}::uuid`; totals.checked++;
    }
    const due = await db.memberPushDelivery.findMany({ where: { status: 'PENDING', nextAttemptAt: { lte: clock() } }, orderBy: [{ nextAttemptAt: 'asc' }, { id: 'asc' }], take: 100 });
    for (const candidate of due) {
      if (Date.now() >= deadline) break;
      const claimed = await db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${candidate.ownerId}::text, 0))`;
        const job = await tx.memberPushDelivery.findFirst({ where: { id: candidate.id, status: 'PENDING', nextAttemptAt: { lte: clock() } }, include: { device: true, notification: true } });
        if (!job) return null;
        const plan = await planPush(db, job.device, job.notification, sources, clock());
        if (!plan) { await tx.memberPushDelivery.update({ where: { id: job.id }, data: { status: 'CANCELLED', resultCode: 'NoLongerEligible' } }); totals.cancelled++; return null; }
        if (plan.due > clock()) { await tx.memberPushDelivery.update({ where: { id: job.id }, data: { nextAttemptAt: plan.due } }); return null; }
        if (plan.general) {
          const dayStart = new Date(`${koreanDay(clock())}T00:00:00+09:00`);
          const sentToday = await tx.memberPushDelivery.count({ where: { deviceId: job.deviceId, sentAt: { gte: dayStart }, notification: { OR: [{ target: { path: ['kind'], equals: 'sermons' } }, { target: { path: ['kind'], equals: 'notices' } }, { target: { path: ['kind'], equals: 'events' } }] }, status: { in: ['SENDING','ACCEPTED','DELIVERED','UNKNOWN'] } } });
          if (sentToday >= 5) { await tx.memberPushDelivery.update({ where: { id: job.id }, data: { status: 'CANCELLED', resultCode: 'DailyLimit' } }); totals.cancelled++; return null; }
        }
        await tx.memberPushDelivery.update({ where: { id: job.id }, data: { status: 'SENDING', attempts: { increment: 1 }, sentAt: clock(), nextAttemptAt: new Date(clock().getTime() + 120000) } });
        return { job, plan };
      }, { timeout: 15000 });
      if (!claimed) continue;
      const { job, plan } = claimed;
      // Do not hold a database transaction while waiting on an external service.
      const currentDevice = await db.memberPushDevice.findFirst({ where: { id: job.deviceId, ownerId: job.ownerId, expiresAt: { gt: clock() } } });
      if (!currentDevice) continue;
      const result = await provider.send({ to: currentDevice.token, notificationId: job.notificationId, ttl: Math.max(1, Math.min(3600, Math.floor((plan.expires.getTime() - clock().getTime()) / 1000))), priority: plan.general ? 'normal' : 'high' });
      await saveResult(job.id, job.deviceId, job.attempts + 1, result, false); if (result.status === 'accepted') totals.accepted++;
    }
    const receipts = await db.memberPushDelivery.findMany({ where: { status: 'ACCEPTED', nextAttemptAt: { lte: clock() } }, orderBy: { nextAttemptAt: 'asc' }, take: 100 });
    for (const job of receipts) {
      if (Date.now() >= deadline) break;
      const claim = await db.memberPushDelivery.updateMany({ where: { id: job.id, status: 'ACCEPTED', nextAttemptAt: { lte: clock() } }, data: { nextAttemptAt: new Date(clock().getTime() + 900000) } });
      if (!claim.count || !job.receiptId) continue;
      const result = await provider.receipt(job.receiptId);
      if (result.status === 'pending' && job.sentAt && clock().getTime() - job.sentAt.getTime() >= 86400000) await saveResult(job.id, job.deviceId, job.attempts, { status: 'unknown', code: 'ReceiptExpired' }, true);
      else await saveResult(job.id, job.deviceId, job.attempts, result, true);
    }
    return totals;

    async function saveResult(id: string, deviceId: string, attempts: number, result: PushResult, receipt: boolean) {
      const where = { id, status: receipt ? 'ACCEPTED' : 'SENDING' };
      if (result.status === 'unregistered') {
        const job = await db.memberPushDelivery.findFirst({ where, select: { sentAt: true } });
        if (!job) return;
        await db.memberPushDelivery.updateMany({ where, data: { status: 'FAILED', resultCode: result.code } });
        // A delayed receipt for an old token must not delete a newer registration.
        if (job.sentAt) await db.memberPushDevice.deleteMany({ where: { id: deviceId, updatedAt: { lte: job.sentAt } } });
        totals.failed++; return;
      }
      if (result.status === 'pending') return;
      if (result.status === 'accepted') { await db.memberPushDelivery.updateMany({ where, data: { status: 'ACCEPTED', receiptId: result.receiptId, nextAttemptAt: new Date(clock().getTime() + 900000) } }); return; }
      if (result.status === 'retry' && !receipt && attempts < 4) { await db.memberPushDelivery.updateMany({ where, data: { status: 'PENDING', resultCode: result.code, nextAttemptAt: new Date(clock().getTime() + 60000 * 2 ** attempts) } }); return; }
      const status = result.status === 'delivered' ? 'DELIVERED' : result.status === 'unknown' ? 'UNKNOWN' : 'FAILED';
      await db.memberPushDelivery.updateMany({ where, data: { status, resultCode: result.code } });
      if (status === 'DELIVERED') totals.confirmed++; else if (status === 'UNKNOWN') totals.uncertain++; else totals.failed++;
    }
  };
}
