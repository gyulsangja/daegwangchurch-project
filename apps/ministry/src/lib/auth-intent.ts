import 'server-only';
import {createHmac,timingSafeEqual} from 'node:crypto';
function sign(value:string){const key=process.env.MINISTRY_DATABASE_URL;if(!key)throw new Error('AUTH_SETUP');return createHmac('sha256',key).update(`password-recovery:${value}`).digest('hex');}
export function recoveryIntent(userId:string){const value=`${userId}.${Date.now()}`;return `${value}.${sign(value)}`;}
export function validRecoveryIntent(token:string|undefined,userId:string){if(!token)return false;const [id,time,signature]=token.split('.');if(id!==userId||!/^\d+$/.test(time??'')||!/^[a-f0-9]{64}$/.test(signature??'')||Date.now()-Number(time)>600000||Number(time)>Date.now())return false;return timingSafeEqual(Buffer.from(signature),Buffer.from(sign(`${id}.${time}`)));}
