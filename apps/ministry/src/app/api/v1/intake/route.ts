import {handle,readInput} from '@/lib/http';
import {manageIntake} from '@/lib/intake-management';
export function GET(request:Request){return handle(request,(_service,actor,session)=>manageIntake(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>manageIntake(actor,await readInput(request),true,session));}
