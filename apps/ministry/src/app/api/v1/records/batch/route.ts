import {handle,readInput} from '@/lib/http';
export function POST(request:Request){return handle(request,async(service,actor)=>service.records.batch(actor,await readInput(request,1500000)));}
