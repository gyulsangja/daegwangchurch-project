import 'server-only';
import {eventSchema} from '@daegwang/contracts/features/events/app-contract';
import {noticeSchema} from '@daegwang/contracts/features/notices/app-contract';
import type {MinistryContentLink} from '@daegwang/contracts/ministry-content-links';
import {DirectoryError} from '@daegwang/ministry-core/directory';
export async function verifyAddedContentLinks(next:MinistryContentLink[],previous:MinistryContentLink[]=[],request:typeof fetch=fetch){
 const added=next.filter(link=>!previous.some(old=>old.kind===link.kind&&old.id===link.id));
 await Promise.all(added.map(async link=>{
  const path=link.kind==='EVENT'?'events':'notices';
  const result=await request(`https://daegwangchurch-admin.vercel.app/api/v1/${path}/${encodeURIComponent(link.id)}`,{cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(8000)});
  if(result.status===404)throw new DirectoryError('INVALID','선택한 일정·공지가 더 이상 공개되지 않습니다. 연결 항목을 다시 확인해 주세요.');
  if(!result.ok)throw new DirectoryError('INVALID','공개 게시물을 확인하지 못했습니다. 잠시 후 다시 저장해 주세요.');
  const json=await result.json();const row=(link.kind==='EVENT'?eventSchema:noticeSchema).parse(json.data);
  if(row.id!==link.id)throw new DirectoryError('INVALID','연결할 게시물을 확인해 주세요.');
 }));
}
