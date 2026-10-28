// No credentials or pastoral data are used. Tests public access boundaries only.
import assert from 'node:assert/strict';
const base=process.argv[2]||'https://daegwangchurch-ministry.vercel.app';
const origin=new URL(base).origin;
if(!origin.startsWith('https://'))throw new Error('HTTPS required');
for(const path of ['/login','/forgot-password']){
 const r=await fetch(origin+path,{redirect:'manual'});assert.equal(r.status,200,path);
 assert.match(r.headers.get('x-robots-tag')||'',/noindex/);
 assert.match(r.headers.get('cache-control')||'',/no-store/);
 console.log(`PASS ${path}: 200, noindex, no-store`);
}
for(const path of ['/','/members','/users','/print','/church','/church/manage','/worship']){
 const r=await fetch(origin+path,{redirect:'manual'});assert.ok([303,307].includes(r.status),`${path}: ${r.status}`);
 assert.equal(new URL(r.headers.get('location'),origin).pathname,'/login');console.log(`PASS ${path}: login required`);
}
for(const path of ['/api/v1/access','/api/v1/members','/api/v1/church-content?kind=EVENT','/api/v1/worship?month=2026-10']){
 const r=await fetch(origin+path);assert.equal(r.status,401,`${path}: ${r.status}`);console.log(`PASS ${path}: unauthenticated rejected`);
}
const forbidden=await fetch(origin+'/api/v1/access',{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(forbidden.status,403);console.log('PASS cross-origin writes rejected');
const review=await fetch(origin+'/api/review-status');assert.equal(review.status,403);assert.equal((await review.json()).testMode,false);console.log('PASS synthetic review disabled');
