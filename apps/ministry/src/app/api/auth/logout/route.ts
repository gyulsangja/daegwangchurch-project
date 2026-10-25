import {authClient} from '@/lib/auth';
import {operationalEnabled,operationalOrigin} from '@/lib/operational-config';
export async function POST(request:Request){if(!operationalEnabled())return new Response(null,{status:503});if((request.headers.get('origin')!==operationalOrigin()||request.headers.get('host')!==new URL(operationalOrigin()).host))return new Response(null,{status:403});await (await authClient()).auth.signOut({scope:'local'});return Response.redirect(new URL('/login',operationalOrigin()),303);}
