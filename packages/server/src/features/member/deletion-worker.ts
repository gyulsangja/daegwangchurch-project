import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { deletionConfig } from './deletion-config';
import { createDeletionProvider } from './deletion-provider';
import { createDeletionService } from './deletion-service';
import { createWorkerHandler } from './worker-api';

export const deletionWorkerHandler = createWorkerHandler(
  () => ({ available: !!deletionConfig(process.env), workerSecret: process.env.APP_DELETION_WORKER_SECRET ?? '' }),
  async () => {
    const config = deletionConfig(process.env);
    if (!config) throw new Error('Deletion unavailable');
    const db = getPrisma();
    // Bound provider calls to fit the HTTP function's execution time.
    const result = await createDeletionService(db, createDeletionProvider(config)).runBatch(1);
    const pending = await db.memberDeletion.count({ where: { status: 'PENDING' } });
    const oldest = await db.memberDeletion.findFirst({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
    return { ...result, pending, oldestPendingAt: oldest?.createdAt.toISOString() ?? null };
  },
  'Account deletion worker failed',
);
