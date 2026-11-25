import {z} from 'zod';
import {authClient} from '@/lib/auth';
import {operationalEnabled,matchesOrigin} from '@/lib/operational-config';
import {readInput} from '@/lib/http';
export async function POST(request:Request){
 if(!operationalEnabled())return Response.json({message:'운영 로그인이 아직 설정되지 않았습니다.'},{status:503});
 if(!matchesOrigin(request))return Response.json({message:'로그인 주소를 확인해 주세요. 개발 서버에서는 http://localhost:3002 로 접속하세요.'},{status:403});
 try{const input=z.object({email:z.email().max(254),password:z.string().min(1).max(200)}).strict().parse(await readInput(request));
 const {error}=await (await authClient()).auth.signInWithPassword(input);
 if(error && (error.name==='AuthRetryableFetchError'||(error.status??0)>=500))return Response.json({message:'인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:503});
 return error?Response.json({message:'로그인 정보를 확인해 주세요.'},{status:401}):Response.json({ok:true});
 }catch{return Response.json({message:'로그인 요청을 처리하지 못했습니다.'},{status:400});}
}
