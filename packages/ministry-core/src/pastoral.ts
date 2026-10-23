import {pastoralInput,pastoralChange,type PastoralInput} from '@daegwang/contracts/ministry-pastoral';
import type {Actor,DirectoryState} from './directory';
export type PastoralItem=PastoralInput & {id:string;churchId:string;version:number;history:{at:string;actorId:string;status:string;note:string;before?:PastoralInput}[]};
type Fail=(code:'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'INVALID',message?:string)=>never;
export function createPastoralService(state:DirectoryState,id:()=>string,now:()=>string,fail:Fail,restored:PastoralItem[]=[]){
  const items=structuredClone(restored);
  const authorize=(actor:Actor)=>{if(!actor.id||!['ADMIN','OFFICE'].includes(actor.role)||!actor.permissions?.includes('CARE')||!state.churches.some(c=>c.id===actor.churchId))fail('FORBIDDEN');};
  const validate=(actor:Actor,input:PastoralInput,itemId?:string)=>{
    if(input.memberId&&!state.members.some(m=>m.id===input.memberId&&m.churchId===actor.churchId))fail('NOT_FOUND');
    if(input.goalId&&(input.kind!=='PLAN'||!items.some(i=>i.id===input.goalId&&i.id!==itemId&&i.churchId===actor.churchId&&i.kind==='GOAL')))fail('INVALID','실행 계획에 연결할 목회 목표를 확인해 주세요.');
  };
  const audit=(actor:Actor,memberId:string,action:'CREATE'|'UPDATE'|'READ')=>state.audits.push({id:id(),churchId:actor.churchId,actorId:actor.id,memberId,action,fields:['pastoralWorkspace'],at:now()});
  return {
    snapshot(){return structuredClone(items);},
    list(actor:Actor){authorize(actor);audit(actor,'','READ');return structuredClone(items.filter(i=>i.churchId===actor.churchId).sort((a,b)=>a.date.localeCompare(b.date)));},
    create(actor:Actor,raw:unknown){authorize(actor);const input=pastoralInput.parse(raw);validate(actor,input);const item:PastoralItem={...input,id:id(),churchId:actor.churchId,version:1,history:[{at:now(),actorId:actor.id,status:input.status,note:'등록'}]};items.push(item);audit(actor,input.memberId,'CREATE');return {id:item.id};},
    update(actor:Actor,raw:unknown){
      authorize(actor);const {id:itemId,version,reflection,...input}=pastoralChange.parse(raw);
      const item=items.find(i=>i.id===itemId&&i.churchId===actor.churchId);if(!item)return fail('NOT_FOUND');
      if(item.version!==version)return fail('CONFLICT');if(input.kind!==item.kind)return fail('INVALID');validate(actor,input,item.id);
      const before=pastoralInput.parse({kind:item.kind,title:item.title,body:item.body,date:item.date,memberId:item.memberId,goalId:item.goalId,category:item.category,status:item.status});
      if(input.status!==item.status&&!reflection)return fail('INVALID','상태를 바꾸는 이유나 수행 결과를 기록해 주세요.');
      item.history.push({at:now(),actorId:actor.id,status:input.status,note:reflection||'내용 수정',before});Object.assign(item,input,{version:version+1});audit(actor,item.memberId,'UPDATE');return {id:item.id};
    },
  };
}
