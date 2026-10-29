import {handle,readInput} from '@/lib/http';
import {managePages} from '@/lib/page-management';
export function GET(request:Request){return handle(request,(_service,actor,session)=>managePages(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>managePages(actor,await readInput(request,100000),true,session));}
