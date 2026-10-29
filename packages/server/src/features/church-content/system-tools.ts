import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {systemToolsQuery,systemToolsCommand} from '@daegwang/contracts/system-tools';
import {ContentManagementError} from './management';
import {getUnreferencedMediaWhere} from '../media/queries';
import {cleanupMedia} from '../media/cleanup';
export function createSystemTools(db:PrismaClient,remove:(bucket:string,paths:string[])=>Promise<void>){
 async function admin(tx:Pick<Prisma.TransactionClient,'adminProfile'>,user:string){const a=await tx.adminProfile.findUnique({where:{authUserId:user}});if(!a?.isActive||a.role!=='SUPER_ADMIN')throw new ContentManagementError(403,'운영 도구에는 최고관리자 권한이 필요합니다.');return a;}
 return {
  async list(user:string,raw:unknown){const input=systemToolsQuery.parse(raw);return db.$transaction(async tx=>{await admin(tx,user);const pagination={skip:input.page*40,take:41};
   const rows=input.kind==='ACTIVITY'?(await tx.activityLog.findMany({...pagination,orderBy:[{createdAt:'desc'},{id:'desc'}],select:{id:true,action:true,summary:true,entityType:true,createdAt:true,actor:{select:{displayName:true}}}})).map(row=>({id:row.id,title:row.summary||`${row.entityType} 변경`,description:`${row.actor?.displayName||'시스템'} · ${row.action}`,at:row.createdAt.toISOString()})):
    (await tx.media.findMany({...pagination,where:{...getUnreferencedMediaWhere(),bucket:'public-assets'},orderBy:[{createdAt:'asc'},{id:'asc'}],select:{id:true,originalName:true,mimeType:true,sizeBytes:true,createdAt:true}})).map(row=>({id:row.id,title:row.originalName,description:row.mimeType,size:row.sizeBytes,at:row.createdAt.toISOString()}));
   return {kind:input.kind,data:rows.slice(0,40),nextPage:rows.length>40?input.page+1:null};
  });},
  async save(user:string,raw:unknown){const input=systemToolsCommand.parse(raw);const actor=await admin(db,user);
   const guarded={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){return db.$transaction(async tx=>{await admin(tx,user);return work(tx);});}} as Pick<PrismaClient,'$transaction'>;
   return {saved:true,...await cleanupMedia(guarded,{...getUnreferencedMediaWhere(),bucket:'public-assets',id:{in:input.ids}},actor.id,remove)};
  },
 };
}
