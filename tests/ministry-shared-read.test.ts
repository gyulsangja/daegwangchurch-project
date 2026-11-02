import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedRead} from '../apps/ministry/src/lib/shared-read';
test('concurrent private GETs share transport only; each body remains readable and later reads are fresh',async()=>{
 const original=globalThis.fetch;let calls=0;let complete!:(value:Response)=>void;
 globalThis.fetch=async()=>{calls++;return new Promise<Response>(resolve=>{complete=resolve;});};
 try{const a=sharedRead('/api/v1/test'),b=sharedRead('/api/v1/test');assert.equal(calls,1);complete(Response.json({version:1}));assert.deepEqual(await (await a).json(),{version:1});assert.deepEqual(await (await b).json(),{version:1});const c=sharedRead('/api/v1/test');assert.equal(calls,2);complete(Response.json({version:2}));assert.deepEqual(await(await c).json(),{version:2});}finally{globalThis.fetch=original;}
});
test('one cancelled consumer does not cancel another; abandoned transport is aborted',async()=>{
 const original=globalThis.fetch;let transport:AbortSignal|undefined;let complete!:(value:Response)=>void;
 globalThis.fetch=async(_input,init)=>{transport=init?.signal??undefined;return new Promise<Response>((resolve,reject)=>{complete=resolve;transport?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});};
 try{const controller=new AbortController();const a=sharedRead('/api/v1/cancel',{signal:controller.signal});const rejected=assert.rejects(a,{name:'AbortError'});const b=sharedRead('/api/v1/cancel');controller.abort();await rejected;assert.equal(transport?.aborted,false);complete(Response.json({ok:true}));await b;const stop=new AbortController();const c=sharedRead('/api/v1/abandon',{signal:stop.signal});const abandoned=assert.rejects(c,{name:'AbortError'});stop.abort();await abandoned;await Promise.resolve();assert.equal(transport?.aborted,true);assert.throws(()=>sharedRead('https://example.invalid/api'));}finally{globalThis.fetch=original;}
});
