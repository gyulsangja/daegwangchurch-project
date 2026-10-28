import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {requireSupabaseConfig} from '@daegwang/config/env';
import {getPrisma} from '@daegwang/database/prisma';
import {createBulletinUploadManagement} from './upload-management';
import {ContentManagementError} from '../church-content/management';
export async function manageBulletinUpload(userId:string,input:unknown){
 const {url}=requireSupabaseConfig();const key=process.env.SUPABASE_SECRET_KEY;
 if(!key||key.length<20)throw Error('UPLOAD_NOT_CONFIGURED');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});
 return createBulletinUploadManagement(getPrisma(),{
  async sign(path){const {data,error}=await client.storage.from('public-assets').createSignedUploadUrl(path,{upsert:false});if(error||!data)throw Error('UPLOAD_SIGNING_FAILED');return data.signedUrl;},
  async verify(path,size){
   const response=await fetch(`${url}/storage/v1/object/public/public-assets/${path}`,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
   if(!response.ok||!response.body)throw new ContentManagementError(409,'파일 업로드가 완료되지 않았습니다. 다시 시도해 주세요.');
   const reader=response.body.getReader();let total=0;const chunks:Uint8Array[]=[];
   for(;;){const part=await reader.read();if(part.done)break;total+=part.value.length;if(total>size||total>10*1024*1024){await reader.cancel();throw new ContentManagementError(409,'업로드한 파일 크기가 일치하지 않습니다.');}chunks.push(part.value);}
   const bytes=Buffer.concat(chunks);
   if(total!==size||bytes.subarray(0,5).toString()!=='%PDF-'||!bytes.subarray(-1024).includes(Buffer.from('%%EOF')))throw new ContentManagementError(409,'올바른 PDF 파일인지 확인해 주세요.');
  },
 },key)(userId,input);
}
