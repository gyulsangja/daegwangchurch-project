import {handle,readInput} from '@/lib/http';
import {manageWorship} from '@/lib/worship-management';
export function GET(request:Request){return handle(request,(_service,actor,session)=>manageWorship(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>manageWorship(actor,await readInput(request),true,session));}
