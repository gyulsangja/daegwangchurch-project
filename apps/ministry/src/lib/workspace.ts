import 'server-only';
import {resolve} from 'node:path';
import {persistentDirectory} from './persistent-directory';
import { headers } from 'next/headers';
import { notFound,redirect } from 'next/navigation';
import {asyncDirectory} from '@daegwang/ministry-core/async-directory';
import {invokeDirectory} from '@daegwang/ministry-core/directory-dispatch';
import {operationalEnabled,operationalOrigin} from './operational-config';
import {operationalDirectory} from './operational-directory';
import {authenticatedSession} from './auth-security';
import { type Actor } from '@daegwang/ministry-core/directory';
import { isLocalReviewEnabled } from '@daegwang/ministry-core/local-access';

export const reviewActor: Actor = { id: 'local-review-admin', churchId: 'demo-daegwang', role: 'ADMIN', organizationIds: [], permissions: ['CARE'] };
export const enabled = (host: string | null) => isLocalReviewEnabled({ NODE_ENV: process.env.NODE_ENV, MINISTRY_LOCAL_DEMO: process.env.MINISTRY_LOCAL_DEMO }, host);
export function directory(host: string | null) {
  if (!enabled(host)) throw new Error('LOCAL_REVIEW_DISABLED');
  const local=persistentDirectory(process.env.MINISTRY_LOCAL_DB_PATH ?? resolve(process.cwd(),'../../.local/ministry/review.sqlite'));
  return asyncDirectory(async(group,method,args)=>invokeDirectory(local,group,method,args));
}
export async function requestWorkspace(host:string|null){
 if(operationalEnabled()){
  if(host!==new URL(operationalOrigin()).host)throw new Error('MINISTRY_INVALID_HOST');
  const {user,aal,nextLevel}=await authenticatedSession();if(nextLevel==='aal2'&&aal!=='aal2')throw new Error('MINISTRY_MFA_REQUIRED');
  if(!process.env.MINISTRY_CHURCH_ID)throw new Error('MINISTRY_NOT_CONFIGURED');
  return operationalDirectory(user.id,process.env.MINISTRY_CHURCH_ID,aal);
 }
 return {service:directory(host),actor:reviewActor};
}
export async function workspace() {
  const host = (await headers()).get('host');
  if (!operationalEnabled()&&!enabled(host)) notFound();
  try{const {service,actor}=await requestWorkspace(host);const path=(await headers()).get('x-ministry-path')??'/';if(actor.role==='LEADER'&&!(path==='/members'||(/^\/members\/[^/]+$/.test(path)&&path!=='/members/new')||path==='/attendance'))redirect('/members');return {service,actor,config:await service.config(actor)};}
  catch(error){if(error instanceof Error&&error.message==='MINISTRY_MFA_REQUIRED')redirect('/account/security');if(error instanceof Error&&error.message==='MINISTRY_ACCESS_DENIED')redirect('/access-denied');if(error instanceof Error&&error.message==='MINISTRY_LOGIN_REQUIRED')redirect('/login');if(error instanceof Error&&error.name==='MinistryAccessError')redirect('/access-denied');throw error;}
}
