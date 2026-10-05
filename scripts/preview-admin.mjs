import { spawn } from 'node:child_process';
// No authentication bypass: only a separate development-only preview route is enabled.
const child = spawn(process.execPath, [process.env.npm_execpath, 'run', 'dev', '--workspace', '@daegwang/admin', '--', '--hostname', '127.0.0.1'], { stdio: 'inherit', env: { ...process.env, ADMIN_DEMO_MODE: 'true' } });
child.on('exit', code => { process.exitCode = code ?? 0; });
process.once('SIGINT', () => child.kill());
process.once('SIGTERM', () => child.kill());
