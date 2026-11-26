import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {proxy} from '../apps/ministry/src/proxy';

test('finance domain resolves to its own workspace and login',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw Error('unexpected external request')});
  const env={...process.env};
  try {
    Object.assign(process.env,{NODE_ENV:'production',MINISTRY_OPERATIONAL_ENABLED:'true',NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'test'});
    const request=(host:string,path:string)=>new NextRequest('https://'+host+path,{headers:{host}});
    const finance='finance.daegwangchurch.kr',ministry='ministry.daegwangchurch.kr';
    const guest=await proxy(request(finance,'/'));
    assert.equal(guest.headers.get('location'),'https://'+finance+'/login?next=/finance');
    const legacy=await proxy(request(ministry,'/finance'));
    assert.equal(legacy.headers.get('location'),'https://'+finance+'/finance');
    const login=await proxy(request(finance,'/login?next=/finance'));
    assert.equal(login.headers.get('location'),null);
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const rewritten=await proxy(request(finance,'/?period=month'));
    assert.equal(rewritten.headers.get('x-middleware-rewrite'),'https://'+finance+'/finance?period=month');
    assert.equal(rewritten.headers.get('x-middleware-request-x-ministry-path'),'/finance');
  }finally{
    for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];
    Object.assign(process.env,env);
  }
});
