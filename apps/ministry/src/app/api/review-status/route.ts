import {enabled} from '@/lib/workspace';
import {operationalEnabled} from '@/lib/operational-config';
export function GET(request:Request){
 const isolated=process.env.MINISTRY_TEST_MODE==='true'&&!!process.env.MINISTRY_LOCAL_DB_PATH;
 if(operationalEnabled()||!enabled(request.headers.get('host'))||!isolated)return Response.json({testMode:false},{status:403,headers:{'Cache-Control':'no-store'}});
 return Response.json({testMode:true},{headers:{'Cache-Control':'no-store'}});
}
