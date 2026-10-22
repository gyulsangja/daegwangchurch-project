import {handle,readInput} from '@/lib/http';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return handle(request,async(service,actor)=>service.families.archive(actor,(await params).id,await readInput(request)));}
