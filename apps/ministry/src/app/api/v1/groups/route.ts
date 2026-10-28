import {handle,readInput} from '@/lib/http';
import {manageGroups} from '@/lib/group-management';
export function GET(request:Request){return handle(request,(_service,actor,session)=>manageGroups(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>manageGroups(actor,await readInput(request),true,session));}
