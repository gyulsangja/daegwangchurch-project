import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
if(Number(process.versions.node.split('.')[0])<24)throw new Error('Ministry local storage requires Node.js 24 or newer.');
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3002'], { cwd: fileURLToPath(new URL('../apps/ministry', import.meta.url)), env: { ...process.env, MINISTRY_LOCAL_DEMO: 'true', MINISTRY_LOCAL_DB_PATH: process.env.MINISTRY_LOCAL_DB_PATH || fileURLToPath(new URL('../.local/ministry/review.sqlite',import.meta.url)) }, stdio: 'inherit' });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
