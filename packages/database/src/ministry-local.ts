// Local synthetic-data storage only. This is not the production pastoral schema.
import {DatabaseSync,backup} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const digest=(payload:string)=>createHash('sha256').update(payload).digest('hex');
export class MinistryStorageError extends Error {constructor(){super('MINISTRY_LOCAL_STORAGE_UNAVAILABLE');this.name='MinistryStorageError';}}
export function withMinistrySnapshot<T,S>(path:string,initial:()=>S,operation:(snapshot:unknown)=>{snapshot:S;result:T}):T {
  mkdirSync(dirname(path),{recursive:true});
  let db:DatabaseSync|undefined;let transaction=false;
  try {
    db=new DatabaseSync(path,{timeout:5000});
    db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE');transaction=true;
    db.exec('CREATE TABLE IF NOT EXISTS ministry_review_snapshot (id INTEGER PRIMARY KEY CHECK(id=1), format_version INTEGER NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, checksum TEXT NOT NULL, updated_at TEXT NOT NULL)');
    const row=db.prepare('SELECT format_version,payload,checksum FROM ministry_review_snapshot WHERE id=1').get();
    let snapshot:unknown;
    if(row){
      if(row.format_version!==1 || typeof row.payload!=='string' || digest(row.payload)!==row.checksum)throw new MinistryStorageError();
      try{snapshot=JSON.parse(row.payload);}catch{throw new MinistryStorageError();}
    }else{snapshot=initial();}
    const output=operation(snapshot);
    const payload=JSON.stringify(output.snapshot);
    // Commit data and audit together; failures never leave the in-memory mutation live.
    if(!row || row.payload!==payload)db.prepare('INSERT INTO ministry_review_snapshot(id,format_version,revision,payload,checksum,updated_at) VALUES(1,1,1,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=revision+1,payload=excluded.payload,checksum=excluded.checksum,updated_at=excluded.updated_at').run(payload,digest(payload),new Date().toISOString());
    db.exec('COMMIT');transaction=false;return output.result;
  }catch(error){
    if(transaction){try{db?.exec('ROLLBACK');}catch{/* Preserve original failure. */}}
    if(error instanceof Error && ('code' in error) && String(error.code).startsWith('ERR_SQLITE'))throw new MinistryStorageError();
    throw error;
  }finally{db?.close();}
}
export async function backupMinistryLocal(source:string,destination:string){
  mkdirSync(dirname(destination),{recursive:true});
  const db=new DatabaseSync(source,{readOnly:true,timeout:5000});
  try{await backup(db,destination);}finally{db.close();}
}
