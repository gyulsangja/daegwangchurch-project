import type {createDirectory} from './directory';
type AsyncMethods<T>={ [K in keyof T]:T[K] extends (...args:infer A)=>infer R ? (...args:A)=>Promise<R>:AsyncMethods<T[K]> };
export type AsyncDirectory=AsyncMethods<ReturnType<typeof createDirectory>>;
export function asyncDirectory(invoke:(group:string|undefined,method:string,args:unknown[])=>Promise<unknown>):AsyncDirectory{
 const groups=new Set(['years','records','families','pastoral']);
 return new Proxy({} as AsyncDirectory,{get(_target,key){
  if(typeof key!=='string'||key==='then')return undefined;
  if(groups.has(key))return new Proxy({},{get(_group,method){return typeof method==='string'?(...args:unknown[])=>invoke(key,method,args):undefined;}});
  return (...args:unknown[])=>invoke(undefined,key,args);
 }});
}
