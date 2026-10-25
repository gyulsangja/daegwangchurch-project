import {handle,readInput} from '@/lib/http';
import {integrationInbox,applyIntegration} from '@/lib/integration';
export function GET(request:Request){return handle(request,(_service,actor)=>integrationInbox(actor));}
export function POST(request:Request){return handle(request,async(_service,actor)=>applyIntegration(actor,await readInput(request)));}
