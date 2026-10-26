import {pastoralInput,pastoralChange,type PastoralInput} from '@daegwang/contracts/ministry-pastoral';
import type {Actor,DirectoryState} from './directory';
import type {Entry} from './records';
export type PastoralItem=PastoralInput & {id:string;churchId:string;version:number;sourceRecordId?:string;history:{at:string;date?:string;actorId:string;status:string;note:string;before?:PastoralInput}[]};
export const scopeLabels={ONCE:'단건',YEAR:'연간',MONTH:'월간',ONGOING:'상시',SPECIAL:'특별'};
export function pastoralMembers(item:Pick<PastoralInput,'memberId'|'memberIds'>){return [...new Set([item.memberId,...(item.memberIds??[])].filter(Boolean))];}
export function pastoralPeriod(item:PastoralInput){return item.scope==='ONGOING'?'상시':item.scope==='YEAR'?`${item.period||item.date.slice(0,4)}년`:item.scope==='MONTH'?item.period||item.date.slice(0,7):item.date;}
export function pastoralInRange(item:PastoralInput,from:string,to:string){
 if(item.scope==='ONGOING')return true;
 const period=item.period||item.date;const start=item.scope==='YEAR'?`${period.slice(0,4)}-01-01`:item.scope==='MONTH'?`${period.slice(0,7)}-01`:item.date;
 const end=item.scope==='YEAR'?`${period.slice(0,4)}-12-31`:item.scope==='MONTH'?new Date(Date.UTC(Number(period.slice(0,4)),Number(period.slice(5,7)),0)).toISOString().slice(0,10):item.date;
 return start<=to&&end>=from;
}
type Fail=(code:'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'INVALID',message?:string)=>never;
export function createPastoralService(state:DirectoryState,id:()=>string,now:()=>string,fail:Fail,restored:PastoralItem[]=[],careHistory:(actor:Actor)=>Entry[]=()=>[]){
  const items=structuredClone(restored);
  const authorize=(actor:Actor)=>{if(!actor.id||!['ADMIN','OFFICE'].includes(actor.role)||!actor.permissions?.includes('CARE')||!state.churches.some(c=>c.id===actor.churchId))fail('FORBIDDEN');};
  const validate=(actor:Actor,input:PastoralInput,itemId?:string)=>{
    if(new Set(input.memberIds??[]).size!==(input.memberIds??[]).length)fail('INVALID');
    for(const memberId of pastoralMembers(input))if(!state.members.some(m=>m.id===memberId&&m.churchId===actor.churchId))fail('NOT_FOUND');
    if(input.scope==='YEAR'&&!/^\d{4}$/.test(input.period??''))fail('INVALID','연도를 선택해 주세요.');
    if(input.scope==='MONTH'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.period??''))fail('INVALID','대상 월을 선택해 주세요.');
    if(input.goalId&&!items.some(i=>i.id===input.goalId&&i.id!==itemId&&i.churchId===actor.churchId&&i.kind==='GOAL'))fail('INVALID','연결할 목회 목표를 확인해 주세요.');
    const visited=new Set<string>();let parent=input.goalId;while(parent){if(parent===itemId||visited.has(parent))fail('INVALID','목표를 순환하여 연결할 수 없습니다.');visited.add(parent);parent=items.find(i=>i.id===parent&&i.churchId===actor.churchId)?.goalId??'';}
  };
  const audit=(actor:Actor,memberId:string,action:'CREATE'|'UPDATE'|'READ')=>state.audits.push({id:id(),churchId:actor.churchId,actorId:actor.id,memberId,action,fields:['pastoralWorkspace'],at:now()});
  return {
    snapshot(){return structuredClone(items);},
    followUp(actor:Actor,recordId:unknown){
      authorize(actor);
      if(typeof recordId!=='string'||!recordId||recordId.length>100)return fail('INVALID');
      const source=careHistory(actor).find(e=>e.id===recordId&&e.kind==='CARE'&&!e.voided);
      if(!source||source.kind!=='CARE')return fail('NOT_FOUND');
      if(!source.nextDate)return fail('INVALID','원래 기록에 후속 날짜를 먼저 지정해 주세요.');
      const existing=items.find(i=>i.churchId===actor.churchId&&i.sourceRecordId===source.id);
      if(existing)return {id:existing.id};
      const created=this.create(actor,{kind:'CARE',title:`${source.label} 후속 만남`,body:'',date:source.nextDate,memberId:source.memberId,goalId:'',category:source.category,status:'OPEN'});
      items.find(i=>i.id===created.id)!.sourceRecordId=source.id;
      return created;
    },
    list(actor:Actor){authorize(actor);audit(actor,'','READ');return structuredClone(items.filter(i=>i.churchId===actor.churchId).sort((a,b)=>a.date.localeCompare(b.date)));},
    create(actor:Actor,raw:unknown){authorize(actor);const input=pastoralInput.parse(raw);validate(actor,input);const item:PastoralItem={...input,id:id(),churchId:actor.churchId,version:1,history:[{at:now(),actorId:actor.id,status:input.status,note:'등록'}]};items.push(item);audit(actor,input.memberId,'CREATE');return {id:item.id};},
    update(actor:Actor,raw:unknown){
      authorize(actor);const {id:itemId,version,reflection,reflectionDate,...parsed}=pastoralChange.parse(raw);
      const item=items.find(i=>i.id===itemId&&i.churchId===actor.churchId);if(!item)return fail('NOT_FOUND');
      const input={...parsed,scope:parsed.scope??item.scope,period:parsed.period??item.period,memberIds:parsed.memberIds??item.memberIds};
      if(reflectionDate&&reflectionDate>new Date(now()).toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}))fail('INVALID','수행 기록은 오늘까지의 날짜로 입력해 주세요.');
      if(item.version!==version)return fail('CONFLICT');if(input.kind!==item.kind)return fail('INVALID');validate(actor,input,item.id);
      if(item.sourceRecordId&&input.memberId!==item.memberId)return fail('INVALID','상담 기록에 연결한 교인은 바꿀 수 없습니다.');
      const before=pastoralInput.parse({kind:item.kind,title:item.title,body:item.body,date:item.date,memberId:item.memberId,goalId:item.goalId,category:item.category,status:item.status,scope:item.scope,period:item.period,memberIds:item.memberIds});
      if(input.status!==item.status&&!reflection)return fail('INVALID','상태를 바꾸는 이유나 수행 결과를 기록해 주세요.');
      item.history.push({at:now(),date:reflectionDate,actorId:actor.id,status:input.status,note:reflection||'내용 수정',before});Object.assign(item,input,{version:version+1});audit(actor,item.memberId,'UPDATE');return {id:item.id};
    },
  };
}
