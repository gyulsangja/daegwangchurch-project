import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { pushConfig } from '@daegwang/server/features/member/push-config';
import { createPushWorker } from '@daegwang/server/features/member/push-worker';
import { createExpoPushProvider } from '@daegwang/server/features/member/push-provider';

const env = { ...(existsSync('apps/admin/.env.local') ? parse(readFileSync('apps/admin/.env.local')) : {}), ...process.env };
const settings = pushConfig(env); const apply = process.argv.includes('--apply');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000 }) });
try {
  if (!apply) {
    const [devices, deliveries] = await Promise.all([db.memberPushDevice.count({ where: { expiresAt: { gt: new Date() } } }), db.memberPushDelivery.groupBy({ by: ['status'], _count: true })]);
    console.log(JSON.stringify({ mode: 'dry-run', configured: settings.available, activeDevices: devices, deliveries }));
  } else {
    if (!settings.available) throw new Error('Push configuration required');
    console.log(JSON.stringify({ mode: 'send-opted-in-push', ...await createPushWorker(db, createExpoPushProvider(settings.accessToken), { worship: env.APP_PUBLICATION_ENABLED === 'true', notices: env.APP_PUBLIC_NOTICES_ENABLED === 'true', events: env.APP_PUBLIC_EVENTS_ENABLED === 'true', schedules: env.APP_MEMBER_RECORDS_ENABLED === 'true' })() }));
  }
} catch { console.error('Push worker unavailable. Check migration, database and push configuration. No member data or credentials logged.'); process.exitCode = 1; }
finally { await db.$disconnect(); }
