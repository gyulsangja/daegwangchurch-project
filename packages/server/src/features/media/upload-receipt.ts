import {createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {imageMime} from '@daegwang/contracts/media-management';
const manifest=z.object({userId:z.uuid(),mediaId:z.uuid(),path:z.string().regex(/^images\/managed\/[a-f0-9-]{36}\.(jpg|png|webp)$/),mimeType:imageMime,size:z.number().int().positive().max(2*1024*1024),expires:z.number().int()}).strict();
export function signImageReceipt(value:z.infer<typeof manifest>,key:string){
 if(key.length<20)throw Error('UPLOAD_NOT_CONFIGURED');
 const payload=Buffer.from(JSON.stringify(manifest.parse(value))).toString('base64url');
 return payload+'.'+createHmac('sha256',key).update('managed-image:'+payload).digest('base64url');
}
export function verifyImageReceipt(token:string,userId:string,key:string,now=Date.now()){
 if(key.length<20||token.length>4000)throw Error('INVALID_RECEIPT');
 const [payload,signature,...extra]=token.split('.');if(!payload||!signature||extra.length)throw Error('INVALID_RECEIPT');
 const expected=createHmac('sha256',key).update('managed-image:'+payload).digest();const actual=Buffer.from(signature,'base64url');
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('INVALID_RECEIPT');
 const value=manifest.parse(JSON.parse(Buffer.from(payload,'base64url').toString('utf8')));
 if(value.userId!==userId||value.expires<=now)throw Error('INVALID_RECEIPT');return value;
}
