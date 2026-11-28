import {NextResponse,type NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {operationalEnabled,operationalOrigin} from './lib/operational-config';
import {financeTab,financeHref} from './lib/finance-routes';
import {customDestination,financeHost,ministryHost} from './lib/church-domains';
export async function proxy(request:NextRequest){
 let rewrite:URL|undefined;
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
   const tab=financeTab(path);
   if(host===financeHost&&tab&&path!=='/'&&!path.startsWith('/finance')){
     rewrite=new URL(request.url);rewrite.pathname=financeHref(tab,false);
     requestHeaders.set('x-ministry-path',rewrite.pathname);
   }
   const next=customDestination(host,path,request.nextUrl.search);
   if(next){
     if(host!==financeHost || path!=='/')return NextResponse.redirect(next);
     rewrite=new URL(request.url);rewrite.pathname=next.pathname;requestHeaders.set('x-ministry-path',next.pathname);
   }
 }
 // Logout owns its response cookies. Do not refresh or reissue a session first.
 if(request.nextUrl.pathname==='/api/auth/logout')return NextResponse.next({request:{headers:requestHeaders}});
 function forward(headers:Headers){const init={request:{headers}};return rewrite?NextResponse.rewrite(rewrite,init):NextResponse.next(init);}
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return forward(requestHeaders);
 let response=forward(requestHeaders);
 const client=createServerClient(url,key,{cookieOptions:{name:'ministry-auth',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'},cookies:{getAll:()=>request.cookies.getAll(),setAll(values){for(const {name,value} of values)request.cookies.set(name,value);const forwarded=new Headers(request.headers);forwarded.set('x-ministry-path',rewrite?.pathname??request.nextUrl.pathname);response=forward(forwarded);for(const {name,value,options} of values)response.cookies.set(name,value,options);}}});
 // Refresh expiring cookies only. Protected layouts and APIs verify the user and MFA.
 const session=await client.auth.getSession();
 if(!session.error&&!session.data.session&&host===financeHost&&!!financeTab(requestHeaders.get('x-ministry-path')??'')&&['GET','HEAD'].includes(request.method)){
   const login=new URL('/login?next=/finance','https://'+financeHost);
   if(request.nextUrl.pathname!=='/')login.searchParams.set('next',request.nextUrl.pathname);
   const redirect=NextResponse.redirect(login);
   for(const cookie of response.cookies.getAll())redirect.cookies.set(cookie);
   redirect.headers.set('Cache-Control','private, no-store');return redirect;
 }
 response.headers.set('Cache-Control','private, no-store');return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|logo.svg|forms/).*)']};
