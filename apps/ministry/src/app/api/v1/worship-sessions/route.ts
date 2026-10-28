import {handle,readInput} from '@/lib/http';
import {worshipSessions} from '@/lib/worship-sessions';
export function GET(request:Request){return handle(request,(_service,actor,session)=>worshipSessions(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>worshipSessions(actor,await readInput(request,50000),true,session));}
