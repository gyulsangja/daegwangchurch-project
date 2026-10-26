import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {asyncDirectory} from '../packages/ministry-core/src/async-directory';
import {directoryMethods,invokeDirectory} from '../packages/ministry-core/src/directory-dispatch';
import {createDirectory} from '../packages/ministry-core/src/directory';
import {createFixture} from '../packages/ministry-core/src/fixture';
import {persistentDirectory} from '../apps/ministry/src/lib/persistent-directory';
test('root and nested proxies are not thenables and do not invoke imaginary inspection methods',{timeout:2000},async()=>{
 const calls:string[]=[];const service=asyncDirectory(async(g,m)=>{calls.push(`${g}.${m}`);throw new Error('must not invoke');});
 const local=persistentDirectory('must-not-open-test.sqlite');
 for(const root of [service,local])for(const target of [root,root.records,root.years,root.pastoral,root.families]){
  for(const key of ['then','catch','finally','toJSON','unknown','constructor','__proto__','$$typeof'])assert.equal(Reflect.get(target,key),undefined,key);
  assert.equal(await Promise.resolve(target),target);assert.doesNotThrow(()=>JSON.stringify(target));
 }
 assert.deepEqual(calls,[]);
});
test('dispatch registry matches every domain method and rejects unsupported calls before apply',()=>{
 const domain=createDirectory(createFixture(),randomUUID);
 for(const [group,methods] of Object.entries(directoryMethods)){
  const target=group==='root'?domain:Reflect.get(domain,group);
  assert.deepEqual(Object.keys(target).filter(k=>typeof Reflect.get(target,k)==='function').sort(),[...methods].sort());
 }
 assert.throws(()=>invokeDirectory(domain,'records','then',[]),/MINISTRY_UNKNOWN_METHOD/);
 assert.throws(()=>invokeDirectory({},'records','add',[]),/MINISTRY_UNKNOWN_METHOD/);
});
