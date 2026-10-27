import test from 'node:test';
import assert from 'node:assert/strict';
import {readChurchPublicContent} from '../apps/ministry/src/lib/church-public-content';

test('public church content uses only fixed published API without credentials and preserves pagination',async()=>{
 const request:typeof fetch=async(url,options)=>{
  assert.equal(String(url),'https://daegwangchurch-admin.vercel.app/api/v1/events?page=2&month=2026-10');
  assert.equal(options?.credentials,'omit');assert.equal(options?.cache,'no-store');assert.equal(options?.redirect,'error');assert.equal(options?.headers,undefined);
  return Response.json({data:[],nextPage:3});
 };
 assert.equal((await readChurchPublicContent('events','2026-10',2,request)).nextPage,3);
 await assert.rejects(readChurchPublicContent('events','bad',0,request));
 await assert.rejects(readChurchPublicContent('notices','2026-10',-1,request));
 await assert.rejects(readChurchPublicContent('notices','2026-10',0,async()=>new Response('',{status:503})),/UNAVAILABLE/);
 await assert.rejects(readChurchPublicContent('notices','2026-10',0,async()=>Response.json({data:[{body:'not a summary'}],nextPage:null})));
});
