import {familyInputSchema,familyUpdateSchema,familyArchiveSchema} from '@daegwang/contracts/ministry-families';
import type {Actor,DirectoryState,Family} from './directory';
export function createFamilyService(state:DirectoryState,id:()=>string,now:()=>string,fail:(code:'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'INVALID',message?:string)=>never) {
 const authorize=(actor:Actor)=>{if(!actor.id||!['ADMIN','OFFICE'].includes(actor.role)||!state.churches.some(c=>c.id===actor.churchId))fail('FORBIDDEN');};
 const get=(actor:Actor,familyId:string)=>{authorize(actor);const family=state.families.find(f=>f.id===familyId&&f.churchId===actor.churchId);if(!family)return fail('NOT_FOUND');return family;};
 const audit=(actor:Actor,memberIds:string[])=>{for(const memberId of new Set(memberIds))state.audits.push({id:id(),churchId:actor.churchId,actorId:actor.id,memberId,action:'UPDATE',fields:['family'],at:now()});};
 const validate=(actor:Actor,data:{representativeId:string|null;members:Family['members']},familyId?:string)=>{
   if(new Set(data.members.map(m=>m.memberId)).size!==data.members.length)fail('INVALID','같은 교인을 중복 배정할 수 없습니다.');
   if(data.representativeId&&!data.members.some(m=>m.memberId===data.representativeId))fail('INVALID','기준 교인은 가구 구성원 중에서 선택해 주세요.');
   for(const link of data.members){
     if(!state.members.some(m=>m.id===link.memberId&&m.churchId===actor.churchId))fail('NOT_FOUND');
     if(state.families.some(f=>f.churchId===actor.churchId&&f.id!==familyId&&!f.archived&&f.members.some(m=>m.memberId===link.memberId)))fail('CONFLICT','다른 가구에 속한 교인이 있습니다. 기존 가구에서 분리한 뒤 추가해 주세요.');
     if(link.relationship==='기준 교인'&&link.memberId!==data.representativeId)fail('INVALID','기준 교인 설정과 관계가 일치하지 않습니다.');
     if(!data.representativeId&&link.relationship!=='가구원')fail('INVALID','가족 관계를 지정하려면 먼저 기준 교인을 선택해 주세요.');
     if(data.representativeId===link.memberId&&link.relationship!=='기준 교인')fail('INVALID','선택한 기준 교인의 관계를 확인해 주세요.');
   }
 };
 return {
   list(actor:Actor){authorize(actor);return structuredClone(state.families.filter(f=>f.churchId===actor.churchId&&!f.archived).sort((a,b)=>a.name.localeCompare(b.name,'ko')));},
   candidates(actor:Actor){authorize(actor);return state.members.filter(m=>m.churchId===actor.churchId).sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(m=>({id:m.id,name:m.name,familyId:state.families.find(f=>!f.archived&&f.churchId===actor.churchId&&f.members.some(link=>link.memberId===m.id))?.id??null}));},
   read(actor:Actor,familyId:string){return structuredClone(get(actor,familyId));},
   create(actor:Actor,raw:unknown){authorize(actor);const data=familyInputSchema.parse(raw);validate(actor,data);const family:Family={...data,id:id(),churchId:actor.churchId,version:1,archived:false};state.families.push(family);audit(actor,data.members.map(m=>m.memberId));return {id:family.id,version:family.version};},
   update(actor:Actor,familyId:string,raw:unknown){const family=get(actor,familyId);const {version,...data}=familyUpdateSchema.parse(raw);if(family.archived||family.version!==version)fail('CONFLICT','가구 정보가 변경되었습니다. 새로고침 후 확인해 주세요.');validate(actor,data,familyId);const affected=[...family.members.map(m=>m.memberId),...data.members.map(m=>m.memberId)];Object.assign(family,data,{version:version+1});audit(actor,affected);return {id:family.id,version:family.version};},
   archive(actor:Actor,familyId:string,raw:unknown){const family=get(actor,familyId);const data=familyArchiveSchema.parse(raw);if(family.archived||family.version!==data.version)fail('CONFLICT');family.archived=true;family.version++;audit(actor,family.members.map(m=>m.memberId));return {id:family.id};},
 };
}
