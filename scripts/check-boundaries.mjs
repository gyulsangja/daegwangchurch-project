import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
function files(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? (['node_modules','generated','.next','.expo','dist'].includes(e.name) ? [] : files(path.join(dir,e.name))) : /\.(ts|tsx|mjs)$/.test(e.name) ? [path.join(dir,e.name)] : []); }
const clean = file => file.replaceAll('\\','/');
for (const file of [...files('apps'), ...files('packages')]) {
 const location=clean(file); const source=fs.readFileSync(file,'utf8');
 const imports=[...source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
 for(const spec of imports) {
  if(location.startsWith('apps/mobile/') || location.startsWith('packages/contracts/') || location.startsWith('packages/api-client/') || location.startsWith('packages/design-tokens/')) assert.ok(!/^@daegwang\/(server|database|config|web-ui)(?:\/|$)/.test(spec), location+' has server/web dependency: '+spec);
  if(location.startsWith('packages/')) assert.ok(!spec.startsWith('@/') && !(spec.startsWith('.') && clean(path.resolve(path.dirname(file),spec)).includes('/apps/')),location+' depends on an app: '+spec);
  if(location.startsWith('apps/') && spec.startsWith('.')) { const target=clean(path.resolve(path.dirname(file),spec)); const app=location.split('/')[1]; for(const other of ['website','admin','mobile'].filter(a=>a!==app)) assert.ok(!target.includes('/apps/'+other+'/'), location+' imports another app: '+spec); }
 }
}
for(const dir of ['apps/website','apps/admin','apps/mobile']) assert.ok(!fs.existsSync(path.join(dir,'package-lock.json')), 'Use the root lockfile only: '+dir);
console.log('Workspace boundaries passed: no cross-app imports, no server/web imports in portable packages/mobile, one lockfile.');
