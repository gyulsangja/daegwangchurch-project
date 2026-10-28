import {handle,readInput} from '@/lib/http';
import {manageMemberAccounts} from '@/lib/member-account-management';
export function GET(request:Request){return handle(request,(_service,actor,session)=>manageMemberAccounts(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_service,actor,session)=>manageMemberAccounts(actor,await readInput(request),true,session));}
