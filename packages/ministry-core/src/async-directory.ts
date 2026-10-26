import type {createDirectory} from './directory';
import {directoryGroup,directoryMethod} from './directory-dispatch';
type AsyncMethods<T>={ [K in keyof T]:T[K] extends (...args:infer A)=>infer R ? (...args:A)=>Promise<R>:AsyncMethods<T[K]> };
export type AsyncDirectory=AsyncMethods<ReturnType<typeof createDirectory>>;
export function asyncDirectory(invoke:(group:string|undefined,method:string,args:unknown[])=>Promise<unknown>):AsyncDirectory{
 return new Proxy({} as AsyncDirectory,{get(_target,key){
  if(directoryGroup(key))return new Proxy({},{get(_group,method){return directoryMethod(key,method)?(...args:unknown[])=>invoke(key,String(method),args):undefined;}});
  return directoryMethod(undefined,key)?(...args:unknown[])=>invoke(undefined,String(key),args):undefined;
 }});
}
