import 'server-only';
import {cache} from 'react';
import {authClient} from './auth';
import {operationalEnabled,operationalOrigin} from './operational-config';
export const authenticatedSession=cache(async function authenticatedSession(){
 const client=await authClient(10000);const {data,error}=await client.auth.getUser();
 if(error||!data.user||data.user.is_anonymous)throw new Error('MINISTRY_LOGIN_REQUIRED');
 const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
 if(assurance.error)throw new Error('MINISTRY_LOGIN_REQUIRED');
 return {client,user:data.user,aal:assurance.data.currentLevel??'aal1',nextLevel:assurance.data.nextLevel};
});
export function authOrigin(request:Request){return operationalEnabled()&&request.headers.get('origin')===operationalOrigin()&&request.headers.get('host')===new URL(operationalOrigin()).host;}
