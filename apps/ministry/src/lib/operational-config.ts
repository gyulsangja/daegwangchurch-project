export function operationalEnabled(){return process.env.MINISTRY_OPERATIONAL_ENABLED==='true';}
export function operationalOrigin(){
 const url=new URL(process.env.MINISTRY_ORIGIN??'http://invalid.local');
 if(url.protocol!=='https:'&&!(process.env.NODE_ENV==='development'&&['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('MINISTRY_ORIGIN_REQUIRED');
 if(url.hostname==='invalid.local'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('MINISTRY_ORIGIN_REQUIRED');
 return url.origin;
}
