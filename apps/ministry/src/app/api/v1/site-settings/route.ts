import {handle,readInput} from '@/lib/http';
import {manageSiteSettings} from '@/lib/site-settings-management';
export function GET(request:Request){return handle(request,(_service,actor,session)=>manageSiteSettings(actor,{},false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>manageSiteSettings(actor,await readInput(request,50000),true,session));}
