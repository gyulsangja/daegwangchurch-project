import {handle,readInput} from '@/lib/http';
export async function GET(request:Request){return handle(request,(service,actor)=>service.families.list(actor));}
export async function POST(request:Request){return handle(request,async(service,actor)=>service.families.create(actor,await readInput(request)));}
