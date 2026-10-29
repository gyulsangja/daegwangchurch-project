import {handle,readInput} from '@/lib/http';
import {manageSystemTools} from '@/lib/system-tools';
export function GET(request:Request){return handle(request,(_s,actor,session)=>manageSystemTools(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_s,actor,session)=>manageSystemTools(actor,await readInput(request,30000),true,session));}
