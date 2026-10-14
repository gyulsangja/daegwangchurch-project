import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import pg from 'pg';

// No writes unless explicitly invoked with --apply. A scheduler must use server-only credentials.
const env = { ...parse(readFileSync('apps/admin/.env.local')), ...process.env };
const apply = process.argv.includes('--apply');
const client = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
try {
  await client.connect(); await client.query(apply ? 'BEGIN' : 'BEGIN READ ONLY');
  // Each request stores its agreed expiry. Stopping intake must not stop expiry cleanup.
  const targets = ['pending_registrations', 'inquiry_rate_limits', 'member_care_requests'];
  for (const table of targets) {
    // Table names are exclusively the hard-coded allowlist above.
    const sql = apply ? `DELETE FROM "${table}" WHERE "expiresAt" <= CURRENT_TIMESTAMP` : `SELECT count(*)::int AS count FROM "${table}" WHERE "expiresAt" <= CURRENT_TIMESTAMP`;
    const result = await client.query(sql);
    console.log(JSON.stringify({ table, mode: apply ? 'expired-only-delete' : 'dry-run', count: apply ? result.rowCount : result.rows[0].count }));
  }
  await client.query(apply ? 'COMMIT' : 'ROLLBACK');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('Member maintenance failed:', error.code ?? error.name);
  process.exitCode = 1;
} finally { await client.end(); }
