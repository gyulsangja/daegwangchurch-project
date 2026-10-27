import type {Actor} from './directory';
export function isContentOnly(actor:Pick<Actor,'role'>){return actor.role==='CONTENT';}
export function contentOnlyPathAllowed(path:string){return path==='/church'||path==='/church/manage'||path==='/account/security';}
export function contentOnlyOperationAllowed(group:string|undefined,method:string){return group===undefined&&method==='config';}
