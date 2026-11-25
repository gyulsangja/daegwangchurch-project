import {ministryHost, financeHost} from './church-domains';
export function operationalEnabled(){return process.env.MINISTRY_OPERATIONAL_ENABLED==='true';}
export function operationalOrigin(){
 const url=new URL(process.env.MINISTRY_ORIGIN??'http://invalid.local');
 if(url.protocol!=='https:'&&!(process.env.NODE_ENV==='development'&&['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('MINISTRY_ORIGIN_REQUIRED');
 if(url.hostname==='invalid.local'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('MINISTRY_ORIGIN_REQUIRED');
 return url.origin;
}

export function trustedOrigin(host:string|null) {
 const canonical=operationalOrigin();
 if(host===new URL(canonical).host)return canonical;
 if(process.env.NODE_ENV==='production' && (host===ministryHost||host===financeHost))return 'https://'+host;
 return null;
}
export function matchesOrigin(request:Request) {
 const trusted=trustedOrigin(request.headers.get('host'));
 return !!trusted && request.headers.get('origin')===trusted;
}
