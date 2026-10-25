import {pastoralInput,pastoralChange,type PastoralInput} from '@daegwang/contracts/ministry-pastoral';
import type {Actor,DirectoryState} from './directory';
import type {Entry} from './records';
export type PastoralItem=PastoralInput & {id:string;churchId:string;version:number;sourceRecordId?:string;history:{at:string;actorId:string;status:string;note:string;before?:PastoralInput}[]};
type Fail=(code:'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'INVALID',message?:string)=>never;
export function createPastoralService(state:DirectoryState,id:()=>string,now:()=>string,fail:Fail,restored:PastoralItem[]=[],careHistory:(actor:Actor)=>Entry[]=()=>[]){
  const items=structuredClone(restored);
  const authorize=(actor:Actor)=>{if(!actor.id||!['ADMIN','OFFICE'].includes(actor.role)||!actor.permissions?.includes('CARE')||!state.churches.some(c=>c.id===actor.churchId))fail('FORBIDDEN');};
  const validate=(actor:Actor,input:PastoralInput,itemId?:string)=>{
    if(input.memberId&&!state.members.some(m=>m.id===input.memberId&&m.churchId===actor.churchId))fail('NOT_FOUND');
    if(input.goalId&&(input.kind!=='PLAN'||!items.some(i=>i.id===input.goalId&&i.id!==itemId&&i.churchId===actor.churchId&&i.kind==='GOAL')))fail('INVALID','실행 계획에 연결할 목회 목표를 확인해 주세요.');
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
      authorize(actor);const {id:itemId,version,reflection,...input}=pastoralChange.parse(raw);
      const item=items.find(i=>i.id===itemId&&i.churchId===actor.churchId);if(!item)return fail('NOT_FOUND');
      if(item.version!==version)return fail('CONFLICT');if(input.kind!==item.kind)return fail('INVALID');validate(actor,input,item.id);
      if(item.sourceRecordId&&input.memberId!==item.memberId)return fail('INVALID','상담 기록에 연결한 교인은 바꿀 수 없습니다.');
      const before=pastoralInput.parse({kind:item.kind,title:item.title,body:item.body,date:item.date,memberId:item.memberId,goalId:item.goalId,category:item.category,status:item.status});
      if(input.status!==item.status&&!reflection)return fail('INVALID','상태를 바꾸는 이유나 수행 결과를 기록해 주세요.');
      item.history.push({at:now(),actorId:actor.id,status:input.status,note:reflection||'내용 수정',before});Object.assign(item,input,{version:version+1});audit(actor,item.memberId,'UPDATE');return {id:item.id};
    },
  };
}
