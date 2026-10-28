import 'server-only';
import {createDeletionProvider} from './deletion-provider';
export function memberDeletionProvider(){
 const secretKey=process.env.SUPABASE_SECRET_KEY;const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const publishableKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!secretKey||!url||!publishableKey)return undefined;
 let valid=secretKey.startsWith('sb_secret_');if(!valid){try{valid=JSON.parse(Buffer.from(secretKey.split('.')[1],'base64url').toString()).role==='service_role';}catch{return undefined;}}
 return valid?createDeletionProvider({url,publishableKey,secretKey}):undefined;
}
