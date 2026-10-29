import type {MinistryYear} from './years';
import {DirectoryError} from './directory';
type Link={memberId:string;userId:string};type Account={ownerId:string;name:string;approved:boolean;eligible:boolean};
export function organizationGroupChanges(period:MinistryYear,links:Link[],accounts:Account[],groupId:string){
 if(period.state!=='ACTIVE')throw new DirectoryError('CONFLICT','운영 중인 연도만 앱 소속에 반영할 수 있습니다.');
 const organizations=new Set(period.organizations.filter(o=>o.appGroupId===groupId).map(o=>o.id));
 if(!organizations.size)return {changes:[],unlinked:0,ineligible:0};
 const assigned=new Set(period.assignments.filter(a=>a.affiliations.some(f=>organizations.has(f.organizationId))).map(a=>a.memberId));
 const linked=new Map(links.map(l=>[l.memberId,l.userId])),known=new Set(links.map(l=>l.userId));
 const intended=new Set([...assigned].flatMap(id=>linked.has(id)?[linked.get(id)!]:[]));
 const candidates=new Map(accounts.map(a=>[a.ownerId,a]));
 return {unlinked:[...assigned].filter(id=>!linked.has(id)).length,ineligible:[...intended].filter(id=>!candidates.get(id)?.eligible).length,
  changes:accounts.filter(a=>known.has(a.ownerId)&&(intended.has(a.ownerId)?a.eligible&&!a.approved:a.approved)).map(a=>({ownerId:a.ownerId,name:a.name,expectedMember:a.approved,approved:intended.has(a.ownerId)})),
 };
}
export function mapOrganizationGroup(period:MinistryYear,groupId:string,ids:string[],version:number,actorId:string,at:string){
 if(period.state!=='ACTIVE'||period.version!==version)throw new DirectoryError('CONFLICT','운영 연도나 조직 편성이 바뀌었습니다. 다시 불러와 주세요.');
 if(new Set(ids).size!==ids.length||ids.some(id=>!period.organizations.some(o=>o.id===id)))throw new DirectoryError('INVALID','연결할 조직을 확인해 주세요.');
 if(period.organizations.some(o=>ids.includes(o.id)&&o.appGroupId&&o.appGroupId!==groupId))throw new DirectoryError('CONFLICT','다른 앱 모임에 연결된 조직입니다. 기존 연결을 먼저 해제해 주세요.');
 const next=structuredClone(period);for(const o of next.organizations){if(ids.includes(o.id))o.appGroupId=groupId;else if(o.appGroupId===groupId)delete o.appGroupId;}
 next.version++;next.events.push({at,actorId,action:'APP_GROUP_LINK'});return next;
}
