import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {requireSupabaseConfig} from '@daegwang/config/env';
import {getPrisma} from '@daegwang/database/prisma';
import {createMediaManagement} from './management';
import {verifyImageBytes} from './image-verification';
import {ContentManagementError} from '../church-content/management';
export function mediaManagementService(){
 const {url}=requireSupabaseConfig();const key=process.env.SUPABASE_SECRET_KEY??'';
 return createMediaManagement(getPrisma(),{
  async sign(path){if(key.length<20)throw Error('UPLOAD_NOT_CONFIGURED');const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});const {data,error}=await client.storage.from('public-assets').createSignedUploadUrl(path,{upsert:false});if(error||!data)throw Error('UPLOAD_SIGNING_FAILED');return data.signedUrl;},
  async verify(path,size,mime){
   try{
    const response=await fetch(`${url}/storage/v1/object/public/public-assets/${path}`,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok||!response.body||response.headers.get('content-type')?.split(';')[0]!==mime)throw Error('INVALID_IMAGE');
    const reader=response.body.getReader();let total=0;const chunks:Uint8Array[]=[];
    for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>size||total>2*1024*1024){await reader.cancel();throw Error('INVALID_IMAGE');}chunks.push(value);}
    if(total!==size)throw Error('INVALID_IMAGE');return await verifyImageBytes(Buffer.concat(chunks),mime);
   }catch{throw new ContentManagementError(409,'이미지 파일을 확인하지 못했습니다. JPG·PNG·WebP 파일을 다시 선택해 주세요.');}
  },
 },key,url);
}
