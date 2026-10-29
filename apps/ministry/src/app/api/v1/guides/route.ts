import {handle,readInput} from '@/lib/http';
import {manageGuides} from '@/lib/guide-management';
export function GET(request:Request){return handle(request,(_s,actor,session)=>manageGuides(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_s,actor,session)=>manageGuides(actor,await readInput(request,100000),true,session));}
