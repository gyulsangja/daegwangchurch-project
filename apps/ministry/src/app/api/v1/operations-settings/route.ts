import {handle,readInput} from '@/lib/http';
import {manageOperationsSettings} from '@/lib/operations-settings';
export function GET(request:Request){return handle(request,(_s,actor,session)=>manageOperationsSettings(actor,{},false,session));}
export function POST(request:Request){return handle(request,async(_s,actor,session)=>manageOperationsSettings(actor,await readInput(request,50000),true,session));}
