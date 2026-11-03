import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {requireIsolatedMinistryServer} from './ministry-browser-guard.mjs';
const base=process.env.MINISTRY_REVIEW_URL??'http://127.0.0.1:3002';
await requireIsolatedMinistryServer(base);
mkdirSync('.local/list-review',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(45000);
const errors=[],reads=[];page.on('pageerror',e=>errors.push(e.message));
const bulletin={id:'bulletin',kind:'BULLETIN',title:'11월 첫째 주 주보',date:'2026-11-01',status:'PUBLISHED',updatedAt:'2026-11-01T00:00:00Z',summary:'',worshipContentId:null,linkedTitle:null,type:'',preacher:'',scripture:'',videoId:null};
const video={...bulletin,id:'video',kind:'WORSHIP',title:'은혜 안에서 자라는 교회',type:'SUNDAY_MORNING',preacher:'설교자',scripture:'베드로후서 3:18',videoId:'dQw4w9WgXcQ'};
await page.route('**/api/v1/worship?**',r=>{reads.push(r.request().url());return r.fulfill({json:{BULLETIN:{data:[bulletin],nextPage:null},WORSHIP:{data:[video],nextPage:null}}});});
await page.route('**/api/v1/worship-sessions**',r=>{reads.push(r.request().url());return r.fulfill({json:{data:[],nextPage:null}});});
await page.route('**/api/v1/albums**',r=>r.fulfill({json:{data:[{id:'album',title:'함께 드린 감사예배',category:'교회 행사',eventDate:'2026-11-01',status:'PUBLISHED',showOnMain:true,updatedAt:bulletin.updatedAt,imageCount:3,coverImage:null}],nextPage:null}}));
await page.route('**/api/v1/guides**',r=>r.fulfill({json:{data:[{id:'guide',title:'주일오전예배',subtitle:'주일 오전 11시 · 본당',visible:true,sortOrder:0,updatedAt:bulletin.updatedAt}],nextPage:null}}));
await page.route('**/api/v1/member-accounts**',r=>r.fulfill({json:{rows:[{id:'22222222-2222-4222-8222-222222222222',email:'fixture@example.invalid',name:'검토용 회원',createdAt:bulletin.updatedAt,lastSignInAt:null,status:'PENDING',phone:'',position:'성도',version:1,adminId:null,role:null,activeAdmin:null,deletionStatus:null,groupIds:[]}],total:1,page:1,pageCount:1,q:'',status:'ALL',groups:[],actorId:'11111111-1111-4111-8111-111111111111',deletionReady:true,membershipEnabled:true}}));
await page.route('**/api/v1/intake**',r=>r.fulfill({json:{data:[{id:'inquiry',kind:'INQUIRY',name:'검토용 문의자',title:'방문 예배 문의',type:'GENERAL',status:'NEW',createdAt:bulletin.updatedAt,updatedAt:bulletin.updatedAt,version:null}],nextPage:null}}));
await page.route('**/api/v1/groups**',r=>r.fulfill({json:new URL(r.request().url()).searchParams.get('view')==='GROUPS'?{groups:[{id:'group',name:'청년 모임',description:'검토용 모임',isActive:true,version:1,memberCount:3}],nextPage:null,superAdmin:true,enabled:true}:{data:[],nextPage:null}}));
await page.route('**/api/v1/church-content?**',r=>r.fulfill({json:{data:[{id:'event',kind:'EVENT',title:'온 교회가 함께하는 감사예배',category:'교회 일정',status:'PUBLISHED',updatedAt:'2026-11-01T00:00:00Z',body:'',startsAt:'2026-11-15T02:00:00Z',endsAt:'',isAllDay:false,location:'본당',ministryName:'',isImportant:false,isPinned:false,publishStartsAt:'',publishEndsAt:'',attachmentCount:0}],nextPage:null}}));
try{
 await page.goto(base+'/worship');await page.getByText(bulletin.title,{exact:true}).waitFor();
 assert.equal(await page.getByText(video.title,{exact:true}).isVisible(),false);
 const count=reads.length;
 await page.getByRole('navigation',{name:'예배 자료 종류'}).getByRole('button',{name:'말씀·영상',exact:true}).click();
 await page.getByText(video.title,{exact:true}).waitFor();assert.equal(await page.getByText(bulletin.title,{exact:true}).isVisible(),false);
 await page.getByRole('navigation',{name:'예배 자료 종류'}).getByRole('button',{name:'예배 기록',exact:true}).click();
 await page.getByRole('heading',{name:'예배별 운영 기록'}).waitFor();
 assert.equal(reads.length,count,'Changing collection tabs must not re-fetch materials or sessions');
 await page.getByRole('navigation',{name:'예배 자료 종류'}).getByRole('button',{name:'주보',exact:true}).click();
 assert.ok((await page.getByText(bulletin.title,{exact:true}).boundingBox()).y<650);
 await page.screenshot({path:'.local/list-review/worship-desktop.png'});
 // Writes below are synthetic and isolated by the guard above, never production.
 const prefix=`목록 검증 ${Date.now()}`;
 for(let i=0;i<12;i++){
  const response=await page.request.post(base+'/api/v1/pastoral',{headers:{Origin:base},data:{kind:'PRAYER',title:`${prefix} ${i}`,body:'기도 내용을 확인하는 가상 기록입니다. '.repeat(20),date:'2026-11-04',memberId:'',memberIds:[],familyIds:[],organizationIds:[],scope:'ONCE',period:'',goalId:'',category:'OTHER',status:'OPEN',reflection:'',reflectionDate:'2026-11-04',contentLinks:[]}});
  assert.equal(response.ok(),true,`Synthetic seed ${response.status()}`);
 }
 await page.goto(base+'/prayers');await page.getByPlaceholder('이름 또는 제목').fill(prefix);
 assert.equal(await page.locator('.pastoral-cards>article').count(),10);
 await page.getByRole('navigation',{name:'목록 페이지'}).getByRole('button',{name:'다음',exact:true}).click();
 assert.equal(await page.locator('.pastoral-cards>article').count(),2);
 await page.getByPlaceholder('이름 또는 제목').fill(prefix+' 11');
 assert.equal(await page.locator('.pastoral-cards>article').count(),1);
 assert.equal(await page.getByRole('navigation',{name:'목록 페이지'}).getByRole('button',{name:'이전',exact:true}).isDisabled(),true);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  for(const path of ['/members','/families','/organizations','/attendance','/records','/care','/prayers','/plans','/church/manage','/albums','/church-guide','/app-members','/app-groups','/intake','/users','/settings','/management','/church-settings','/site-pages']){
   await page.goto(base+path);await page.locator('.list-heading h1').waitFor();
   const fixture={'/albums':'함께 드린 감사예배','/church-guide':'주일오전예배','/app-members':'검토용 회원','/intake':'검토용 문의자 · 방문 예배 문의'}[path];
   if(fixture)await page.getByText(fixture,{exact:true}).waitFor();
   assert.equal(await page.locator('h1').count(),1,`${path} one page title`);
   assert.ok((await page.locator('.list-heading h1').boundingBox()).y<400,`${path} title visible on entry`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} ${width} overflow`);
   if(['/members','/church/manage','/prayers','/families'].includes(path))await page.screenshot({path:`.local/list-review/${path.replaceAll('/','-')}-${width}.png`});
  }
  console.log(`PASS ${width}px list orientation and overflow across 19 routes`);
 }
 assert.deepEqual(errors,[]);console.log('PASS material tabs without additional GET, bounded pastoral list and filter resets, one title per page');
}finally{await browser.close();}
