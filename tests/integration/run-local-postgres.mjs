import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import net from 'node:net';
import pg from 'pg';

// Explicit opt-in to downloaded local binaries. Never load application .env files.
const bin = process.env.TEST_POSTGRES_BIN;
if (!bin) throw new Error('Set TEST_POSTGRES_BIN to a local PostgreSQL bin directory.');
const root = resolve('test-results/postgres', `run-${randomUUID()}`);
mkdirSync(root, { recursive: true });
const data = join(root, 'data');
const password = randomUUID();
const passwordFile = join(root, 'password.txt');
writeFileSync(passwordFile, password, { mode: 0o600 });
const tool = (name, args) => execFileSync(join(resolve(bin), `${name}${process.platform === 'win32' ? '.exe' : ''}`), args, { encoding: 'utf8', windowsHide: true, stdio: name === 'pg_ctl' ? 'ignore' : ['ignore', 'pipe', 'pipe'] });
const listener = net.createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
let started = false;
let client;
try {
  tool('initdb', ['-D', data, '-U', 'postgres', '--encoding=UTF8', '--locale=C', '--auth=scram-sha-256', `--pwfile=${passwordFile}`]);
  tool('pg_ctl', ['-D', data, '-l', join(root, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);
  started = true;
  const base = `postgresql://postgres:${password}@127.0.0.1:${port}`;
  client = new pg.Client({ connectionString: `${base}/postgres` });
  await client.connect();
  await client.query('CREATE DATABASE daegwang_worship_test');
  await client.query('CREATE ROLE anon NOLOGIN');
  await client.query('CREATE ROLE authenticated NOLOGIN');
  await client.end();
  const url = `${base}/daegwang_worship_test`;
  client = new pg.Client({ connectionString: url });
  await client.connect();
  for (const entry of readdirSync('packages/database/prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await client.query(readFileSync(resolve('packages/database/prisma/migrations', entry.name, 'migration.sql'), 'utf8'));
  }
  await client.end(); client = undefined;
  console.log('Migrations applied to a new, isolated local PostgreSQL database.');
  // Some suites inspect global cleanup counts; serialize files sharing this disposable database.
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/integration/worship.test.ts', 'tests/integration/member.test.ts', 'tests/integration/deletion.test.ts', 'tests/integration/notification.test.ts', 'tests/integration/push.test.ts'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, TEST_DATABASE_URL: url, DATABASE_URL: '', DIRECT_URL: '' },
  });
  process.exitCode = result.status ?? 1;
} catch (error) {
  // Subprocess errors can contain connection credentials. Do not print them.
  console.error('Isolated database verification failed:', error.name);
  if (error.stderr) console.error(String(error.stderr).replaceAll(password, '[redacted]'));
  process.exitCode = 1;
} finally {
  if (client) await client.end().catch(() => {});
  if (started) tool('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
  writeFileSync(passwordFile, '');
  console.log('Local test PostgreSQL stopped. Production database was not used.');
}
