import 'server-only';
import {eventPageSchema} from '@daegwang/contracts/features/events/app-contract';
import {noticePageSchema} from '@daegwang/contracts/features/notices/app-contract';
import {monthSchema} from '@daegwang/contracts/features/calendar';

// Only published DTOs are requested. No ministry cookies, credentials or DB access.
const origin='https://daegwangchurch-admin.vercel.app';
export async function readChurchPublicContent(kind:'events'|'notices',month:string,page=0,request:typeof fetch=fetch){
  monthSchema.parse(month);
  if(!Number.isInteger(page)||page<0||page>10000)throw new Error('INVALID_PAGE');
  const params=new URLSearchParams({page:String(page)});
  if(kind==='events')params.set('month',month);
  const response=await request(`${origin}/api/v1/${kind}?${params}`,{
    cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(8000),
  });
  if(!response.ok)throw new Error('CHURCH_CONTENT_UNAVAILABLE');
  const json:unknown=await response.json();
  return kind==='events'?eventPageSchema.parse(json):noticePageSchema.parse(json);
}
