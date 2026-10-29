import type {Media,Prisma,PrismaClient} from '@daegwang/database/generated/client';
// Foreign keys serialize a concurrent attachment creation with this deletion.
// Storage removal must only happen after the reference-checked DB commit.
export async function cleanupMedia(db:Pick<PrismaClient,'$transaction'>,where:Prisma.MediaWhereInput,actorId:string,remove:(bucket:string,paths:string[])=>Promise<void>){
 const removed=await db.$transaction(async tx=>{
  const candidates=await tx.media.findMany({where,orderBy:{createdAt:'asc'},take:200});const rows:Media[]=[];
  for(const row of candidates){if((await tx.media.deleteMany({where:{AND:[where,{id:row.id}]}})).count===1)rows.push(row);}
  await tx.activityLog.create({data:{actorId,action:'DELETE',entityType:'Media',summary:'미사용 파일 참조 정리',changes:{count:rows.length,sizeBytes:rows.reduce((sum,row)=>sum+row.sizeBytes,0)}}});return rows;
 });
 const failed:Media[]=[];
 for(const [bucket,rows] of Map.groupBy(removed,row=>row.bucket)){
  try{await remove(bucket,rows.map(row=>row.objectPath));}catch{failed.push(...rows);}
 }
 // Failed storage removals remain non-selectable and can be retried by cleanup.
 if(failed.length)await db.$transaction(async tx=>{
  for(const row of failed)await tx.media.create({data:{...row,deletedAt:new Date()}});
  await tx.activityLog.create({data:{actorId,action:'UPDATE',entityType:'Media',summary:'파일 정리 재시도 대기',changes:{count:failed.length}}});
 });
 return {count:removed.length-failed.length,storageFailures:failed.length};
}
