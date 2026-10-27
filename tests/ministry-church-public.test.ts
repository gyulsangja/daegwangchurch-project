import test from 'node:test';
import assert from 'node:assert/strict';
import {readChurchPublicContent} from '../apps/ministry/src/lib/church-public-content';
import {verifyAddedContentLinks} from '../apps/ministry/src/lib/verify-content-links';

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
test('new pastoral links must point to a published original; old unavailable links can be retained or removed',async()=>{
 const link={kind:'EVENT' as const,id:'source-id'};let calls=0;
 const request:typeof fetch=async(url,options)=>{calls++;assert.equal(String(url),'https://daegwangchurch-admin.vercel.app/api/v1/events/source-id');assert.equal(options?.credentials,'omit');return Response.json({data:{id:'source-id',title:'Public event',category:'Church',startsAt:'2026-10-28T00:00:00Z',endsAt:null,isAllDay:true,location:null,ministryName:null,description:''}});};
 await verifyAddedContentLinks([link],[],request);assert.equal(calls,1);
 await verifyAddedContentLinks([link],[link],async()=>{throw new Error('must not fetch');});
 await verifyAddedContentLinks([],[link],async()=>{throw new Error('must not fetch');});
 await assert.rejects(verifyAddedContentLinks([link],[],async()=>new Response(null,{status:404})),/공개되지/);
 await assert.rejects(verifyAddedContentLinks([link],[],async()=>new Response(null,{status:503})),/확인하지/);
});
