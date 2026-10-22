import 'server-only';
import {randomUUID} from 'node:crypto';
import {createDirectory,type DirectorySnapshot} from '@daegwang/ministry-core/directory';
import {createFixture} from '@daegwang/ministry-core/fixture';
import {withMinistrySnapshot,MinistryStorageError} from '@daegwang/database/ministry-local';
type Service=ReturnType<typeof createDirectory>;
export function persistentDirectory(path:string):Service {
  function call(group:string|undefined,method:string,args:unknown[]):unknown {
    return withMinistrySnapshot(path,()=>createDirectory(createFixture(),randomUUID).snapshot(),raw=>{
      const snapshot=raw as DirectorySnapshot;
      if(!snapshot || snapshot.schemaVersion!==1 || !snapshot.state || !Array.isArray(snapshot.state.members) || !Array.isArray(snapshot.state.churches) || !Array.isArray(snapshot.state.families) || !Array.isArray(snapshot.state.organizations) || !Array.isArray(snapshot.state.audits) || !Array.isArray(snapshot.years) || !Array.isArray(snapshot.records))throw new MinistryStorageError();
      const service=createDirectory(snapshot.state,randomUUID,undefined,snapshot);
      const target=(group?Reflect.get(service,group):service) as object;
      const result=Reflect.apply(Reflect.get(target,method),target,args);
      return {snapshot:service.snapshot(),result};
    });
  }
  const groups=new Set(['years','records','families']);
  // Every public domain call re-reads within a short synchronous SQLite transaction.
  // No async HTTP/body parsing or network calls run while the database is locked.
  return new Proxy({} as Service,{get(_target,key){
    if(typeof key!=='string')return undefined;
    if(groups.has(key))return new Proxy({},{get(_group,method){return typeof method==='string'?(...args:unknown[])=>call(key,method,args):undefined;}});
    return (...args:unknown[])=>call(undefined,key,args);
  }});
}
