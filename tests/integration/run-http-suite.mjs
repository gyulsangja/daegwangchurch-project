import { spawnSync } from 'node:child_process';
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run npm run test:integration:worship:http');
// Explicit fixture configuration: do not read the developer database during build.
const env = { ...process.env, DATABASE_URL: '', DIRECT_URL: '', ADMIN_URL: 'http://localhost:3001', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' };
const build = spawnSync(process.execPath, [npm, 'run', 'build'], { stdio: 'inherit', env });
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);
const test = spawnSync(process.execPath, ['tests/integration/run-worship-integration.mjs', '--http'], { stdio: 'inherit', env });
if (test.error) throw test.error;
process.exitCode = test.status ?? 1;
