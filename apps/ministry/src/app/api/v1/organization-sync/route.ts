import {handle,readInput} from '@/lib/http';
import {organizationSync} from '@/lib/organization-sync';
export function GET(request:Request){return handle(request,(_service,actor,session)=>organizationSync(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>organizationSync(actor,await readInput(request,30000),true,session));}
