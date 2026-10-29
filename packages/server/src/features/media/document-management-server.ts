import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {requireSupabaseConfig} from '@daegwang/config/env';
import {getPrisma} from '@daegwang/database/prisma';
import {documentTypes} from '@daegwang/contracts/document-upload';
import {createDocumentManagement} from './document-management';
import {verifyDocumentBytes} from './document-verification';
import {ContentManagementError} from '../church-content/management';
export async function manageDocumentUpload(user:string,raw:unknown){
 const {url}=requireSupabaseConfig(),key=process.env.SUPABASE_SECRET_KEY??'';
 return createDocumentManagement(getPrisma(),{
  async sign(path){if(key.length<20)throw Error('UPLOAD_NOT_CONFIGURED');const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await client.storage.from('public-assets').createSignedUploadUrl(path,{upsert:false});if(error||!data)throw Error('UPLOAD_SIGNING_FAILED');return data.signedUrl;},
  async verifyDocument(path,size,extension){try{
   const r=await fetch(`${url}/storage/v1/object/public/public-assets/${path}`,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok||!r.body||r.headers.get('content-type')?.split(';')[0]!==documentTypes[extension])throw Error('INVALID_DOCUMENT');
   const reader=r.body.getReader(),chunks:Uint8Array[]=[];let total=0;for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>size||total>5*1024*1024){await reader.cancel();throw Error('INVALID_DOCUMENT');}chunks.push(value);}if(total!==size)throw Error('INVALID_DOCUMENT');verifyDocumentBytes(Buffer.concat(chunks),extension);
  }catch{throw new ContentManagementError(409,'파일 형식·용량을 확인하지 못했습니다. 올바른 문서를 다시 선택해 주세요.');}},
 },key,url)(user,raw);
}
