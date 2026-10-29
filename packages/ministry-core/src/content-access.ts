import type {Actor} from './directory';
export function isContentOnly(actor:Pick<Actor,'role'>){return actor.role==='CONTENT';}
export function contentOnlyPathAllowed(path:string){return ['/church','/church/manage','/worship','/app-groups','/albums','/church-guide','/site-pages','/church-settings','/account/security'].includes(path);}
export function contentOnlyOperationAllowed(group:string|undefined,method:string){return group===undefined&&method==='config';}
