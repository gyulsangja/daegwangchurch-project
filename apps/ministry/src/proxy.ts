import {NextResponse,type NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {operationalEnabled} from './lib/operational-config';
export async function proxy(request:NextRequest){
 if(!operationalEnabled())return NextResponse.next();
 const requestHeaders=new Headers(request.headers);requestHeaders.set('x-ministry-path',request.nextUrl.pathname);
 // Logout owns its response cookies. Do not refresh or reissue a session first.
 if(request.nextUrl.pathname==='/api/auth/logout')return NextResponse.next({request:{headers:requestHeaders}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.next({request:{headers:requestHeaders}});
 let response=NextResponse.next({request:{headers:requestHeaders}});
 const client=createServerClient(url,key,{cookieOptions:{name:'ministry-auth',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'},cookies:{getAll:()=>request.cookies.getAll(),setAll(values){for(const {name,value} of values)request.cookies.set(name,value);const forwarded=new Headers(request.headers);forwarded.set('x-ministry-path',request.nextUrl.pathname);response=NextResponse.next({request:{headers:forwarded}});for(const {name,value,options} of values)response.cookies.set(name,value,options);}}});
 await client.auth.getUser();response.headers.set('Cache-Control','private, no-store');return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)']};
