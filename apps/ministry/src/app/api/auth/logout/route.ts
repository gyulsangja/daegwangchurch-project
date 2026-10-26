import {authClient} from '@/lib/auth';
import {operationalEnabled,operationalOrigin} from '@/lib/operational-config';
import {cookies} from 'next/headers';
import {logoutResponse} from '@/lib/logout-response';
export async function POST(request:Request){
 if(!operationalEnabled())return new Response(null,{status:503});
 const origin=operationalOrigin();
 if(request.headers.get('origin')!==origin||request.headers.get('host')!==new URL(origin).host)return new Response(null,{status:403});
 const names=(await cookies()).getAll().map(cookie=>cookie.name);
 try{await (await authClient(8000)).auth.signOut({scope:'local'});}catch{/* Local cookies must be removed even when the auth provider is unavailable. */}
 return logoutResponse(origin,names);
}
