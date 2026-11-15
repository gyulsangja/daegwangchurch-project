import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Heuristic review, not a security certification. Never emit matching values.
const files = execFileSync('git', ['-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`, 'ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['supabase-secret', /sb_secret_[A-Za-z0-9_-]{25,}/],
  ['github-token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],
  ['database-password', /postgres(?:ql)?:\/\/[^\s:'"/]+:[^\s@'"${}<>]{12,}@/],
];
let findings = 0;
for (const file of files) {
  if (/\.(?:png|jpe?g|webp|ico|ttf|woff2?|pdf|zip|mp4)$/i.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const [rule, pattern] of rules) {
    if (pattern.test(source)) { console.log(`REVIEW ${rule}: ${file}`); findings++; }
  }
  for (const token of source.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
    try {
      if (JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).role === 'service_role') {
        console.log(`REVIEW service-role-jwt: ${file}`); findings++; break;
      }
    } catch { /* Not a JWT. */ }
  }
}
console.log(`Scanned ${files.length} tracked paths; ${findings} candidate findings. Git history, untracked files and hosting settings are outside this scan.`);
process.exitCode = findings ? 1 : 0;
