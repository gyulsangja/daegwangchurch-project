import {handle,readInput} from '@/lib/http';
import {manageMedia} from '@/lib/media-management';
export function GET(request:Request){return handle(request,(_s,actor,session)=>manageMedia(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_s,actor,session)=>manageMedia(actor,await readInput(request,10000),true,session));}
