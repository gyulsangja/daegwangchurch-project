import {NextResponse,type NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {operationalEnabled,operationalOrigin} from './lib/operational-config';
import {customDestination,financeHost,ministryHost} from './lib/church-domains';
export async function proxy(request:NextRequest){
 const requestHeaders=new Headers(request.headers);requestHeaders.set('x-ministry-path',request.nextUrl.pathname);
 if(!operationalEnabled())return NextResponse.next({request:{headers:requestHeaders}});
 const host=request.headers.get('host');
 if(process.env.NODE_ENV==='production' && (request.method==='GET'||request.method==='HEAD') && (host===ministryHost||host===financeHost)){
   const path=request.nextUrl.pathname;
   // Start PKCE recovery/invitation on the registered callback host, including its verifier cookie.
   if(path==='/forgot-password'||path==='/invite'){
     const canonical=new URL(operationalOrigin());
     if(host!==canonical.host){canonical.pathname=path;canonical.search=request.nextUrl.search;return NextResponse.redirect(canonical);}
   }
   const next=customDestination(host,path,request.nextUrl.search);
   if(next)return NextResponse.redirect(next);
 }
 // Logout owns its response cookies. Do not refresh or reissue a session first.
 if(request.nextUrl.pathname==='/api/auth/logout')return NextResponse.next({request:{headers:requestHeaders}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.next({request:{headers:requestHeaders}});
 let response=NextResponse.next({request:{headers:requestHeaders}});
 const client=createServerClient(url,key,{cookieOptions:{name:'ministry-auth',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'},cookies:{getAll:()=>request.cookies.getAll(),setAll(values){for(const {name,value} of values)request.cookies.set(name,value);const forwarded=new Headers(request.headers);forwarded.set('x-ministry-path',request.nextUrl.pathname);response=NextResponse.next({request:{headers:forwarded}});for(const {name,value,options} of values)response.cookies.set(name,value,options);}}});
 await client.auth.getUser();response.headers.set('Cache-Control','private, no-store');return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)']};
