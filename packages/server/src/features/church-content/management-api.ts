import {ZodError} from 'zod';
import {ContentManagementError} from './management';
type Dependencies={authenticate:(token:string)=>Promise<string|null>;list:(user:string,input:unknown)=>Promise<unknown>;save:(user:string,input:unknown)=>Promise<unknown>};
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export function createContentManagementHandler(deps:Dependencies){
 return async function handle(request:Request){
  const error=(status:number,message:string)=>Response.json({message},{status,headers});
  // Server-to-server bearer requests only. Cookies and browser-origin requests are never accepted.
  if(request.headers.has('origin'))return error(403,'허용되지 않은 요청입니다.');
  const token=request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
  if(!token||token.length>8192)return error(401,'로그인이 필요합니다.');
  try{
   const user=await deps.authenticate(token);if(!user)return error(401,'로그인이 필요합니다.');
   if(request.method==='GET'){
    const query=new URL(request.url).searchParams;
    if([...query.keys()].some(k=>query.getAll(k).length!==1))return error(422,'조회 조건을 확인해 주세요.');
    return Response.json(await deps.list(user,Object.fromEntries(query)),{headers});
   }
   if(request.method!=='POST')return error(405,'지원하지 않는 요청입니다.');
   if(!request.headers.get('content-type')?.startsWith('application/json'))return error(415,'JSON 요청이 필요합니다.');
   const reader=request.body?.getReader();if(!reader)return error(400,'입력 내용을 확인해 주세요.');
   const chunks:Uint8Array[]=[];let size=0;
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();return error(413,'입력 내용이 너무 큽니다.');}chunks.push(value);}
   return Response.json(await deps.save(user,JSON.parse(Buffer.concat(chunks).toString('utf8'))),{headers});
  }catch(e){
   if(e instanceof ContentManagementError)return error(e.status,e.message);
   if(e instanceof ZodError)return error(422,e.issues[0]?.message??'입력 내용을 확인해 주세요.');
   if(e instanceof SyntaxError)return error(400,'입력 내용을 확인해 주세요.');
   return error(503,'콘텐츠를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
 };
}
