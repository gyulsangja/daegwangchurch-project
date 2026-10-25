import {z} from 'zod';
import {authClient} from '@/lib/auth';
import {operationalEnabled,operationalOrigin} from '@/lib/operational-config';
import {readInput} from '@/lib/http';
export async function POST(request:Request){
 if(!operationalEnabled())return Response.json({message:'운영 로그인이 아직 설정되지 않았습니다.'},{status:503});
 if((request.headers.get('origin')!==operationalOrigin()||request.headers.get('host')!==new URL(operationalOrigin()).host))return new Response(null,{status:403});
 try{const input=z.object({email:z.email().max(254),password:z.string().min(1).max(200)}).strict().parse(await readInput(request));
 const {error}=await (await authClient()).auth.signInWithPassword(input);
 return error?Response.json({message:'로그인 정보를 확인해 주세요.'},{status:401}):Response.json({ok:true});
 }catch{return Response.json({message:'로그인 요청을 처리하지 못했습니다.'},{status:400});}
}
