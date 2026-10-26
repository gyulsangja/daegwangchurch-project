import {handle,readInput} from '@/lib/http';
export function POST(request:Request){return handle(request,async(service,actor)=>service.families.link(actor,await readInput(request)));}
