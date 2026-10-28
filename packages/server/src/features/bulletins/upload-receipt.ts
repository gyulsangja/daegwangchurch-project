import {createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
const manifest=z.object({userId:z.uuid(),mediaId:z.uuid(),path:z.string().regex(/^bulletins\/managed\/[a-f0-9-]{36}\.pdf$/),size:z.number().int().positive().max(10*1024*1024),expires:z.number().int()}).strict();
export type UploadManifest=z.infer<typeof manifest>;
export function signUploadReceipt(value:UploadManifest,key:string){
 if(key.length<20)throw Error('UPLOAD_SIGNING_NOT_CONFIGURED');
 const payload=Buffer.from(JSON.stringify(manifest.parse(value))).toString('base64url');
 return payload+'.'+createHmac('sha256',key).update('bulletin-upload:'+payload).digest('base64url');
}
export function verifyUploadReceipt(token:string,userId:string,key:string,now=Date.now()){
 if(key.length<20||token.length>4000)throw Error('INVALID_UPLOAD_RECEIPT');
 const [payload,signature,...extra]=token.split('.');if(!payload||!signature||extra.length)throw Error('INVALID_UPLOAD_RECEIPT');
 const expected=createHmac('sha256',key).update('bulletin-upload:'+payload).digest();const actual=Buffer.from(signature,'base64url');
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('INVALID_UPLOAD_RECEIPT');
 const value=manifest.parse(JSON.parse(Buffer.from(payload,'base64url').toString('utf8')));
 if(value.userId!==userId||value.expires<=now)throw Error('INVALID_UPLOAD_RECEIPT');return value;
}
