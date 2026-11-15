import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const require = createRequire(import.meta.url);
const routerRequire = createRequire(require.resolve('expo-router', { paths: ['apps/mobile'] }));
const parserPath = routerRequire.resolve('query-string');
const parser = routerRequire('query-string');

test('the router parser preserves Korean, arrays, null and plus encoding after the security patch', () => {
  const parsed = parser.parse('title=%EB%8C%80%EA%B4%91%EA%B5%90%ED%9A%8C&tag=a&tag=b&empty&space=a+b&bad=%zz');
  assert.deepEqual({ ...parsed }, { title: '대광교회', tag: ['a', 'b'], empty: null, space: 'a b', bad: '%zz' });
  assert.deepEqual({ ...parser.parse(parser.stringify(parsed)) }, { ...parsed });
  assert.equal(createRequire(parserPath)('decode-uri-component').default('기도%20🙂'), '기도 🙂');
});

test('malformed percent runs cannot stall the parser beyond the subprocess budget', () => {
  const code = `const p=require(${JSON.stringify(parserPath)}); let s=''; for(let i=0;i<32000;i++)s+='%'+Math.floor(i/256).toString(16).padStart(2,'0')+'%'+(i%256).toString(16).padStart(2,'0')+'x'; s+='%zz'; if(typeof p.parse('q='+s).q!=='string')process.exit(1); p.parse('q='+'%C2'.repeat(32000));`;
  const result = spawnSync(process.execPath, ['-e', code], { timeout: 5000, windowsHide: true, encoding: 'utf8' });
  assert.equal(result.error, undefined, 'Parser must finish within 5 seconds');
  assert.equal(result.status, 0, result.stderr);
});
