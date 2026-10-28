import type {Prisma} from '@daegwang/database/generated/client';
export async function rememberBulletinFile(tx:Prisma.TransactionClient,row:{id:string;pdfMediaId:string;title:string;updatedAt:Date}){
 await tx.bulletinFileVersion.upsert({where:{bulletinId_mediaId:{bulletinId:row.id,mediaId:row.pdfMediaId}},create:{bulletinId:row.id,mediaId:row.pdfMediaId,title:row.title,capturedAt:row.updatedAt},update:{}});
}
