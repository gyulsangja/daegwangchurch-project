import {NextResponse} from 'next/server';
// Only this application's authentication cookies; preserve other local apps' sessions.
export function logoutResponse(origin:string,names:string[]){
 const response=NextResponse.redirect(new URL('/login',origin),303);
 response.headers.set('Cache-Control','private, no-store');
 for(const name of new Set(['ministry-auth','ministry-auth-code-verifier','ministry-invitation','ministry-password-recovery',...names.filter(name=>/^ministry-auth(?:\.\d+|-code-verifier(?:\.\d+)?)?$/.test(name))])){
  response.cookies.set(name,'',{path:'/',httpOnly:true,sameSite:'lax',secure:new URL(origin).protocol==='https:',expires:new Date(0),maxAge:0});
 }
 return response;
}
