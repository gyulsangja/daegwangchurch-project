import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { deletionConfig } from '@daegwang/server/features/member/deletion-config';
import { createDeletionProvider } from '@daegwang/server/features/member/deletion-provider';
import { createDeletionService } from '@daegwang/server/features/member/deletion-service';

const env = { ...parse(readFileSync('apps/admin/.env.local')), ...process.env };
const apply = process.argv.includes('--apply');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000 }) });
try {
  const config = deletionConfig(env);
  if (!apply) {
    const counts = await db.memberDeletion.groupBy({ by: ['status'], _count: true });
    console.log(JSON.stringify({ mode: 'dry-run', configured: !!config, counts }));
  } else {
    if (!config) throw new Error('Approved deletion policy and worker configuration required');
    console.log(JSON.stringify({ mode: 'process-accepted-requests', ...await createDeletionService(db, createDeletionProvider(config)).runBatch() }));
  }
} catch { console.error('Member deletion maintenance failed; check server configuration and database connectivity. No credentials or member data are logged.'); process.exitCode = 1; }
finally { await db.$disconnect(); }
