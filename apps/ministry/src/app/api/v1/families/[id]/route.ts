import {handle,readInput} from '@/lib/http';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return handle(request,async(service,actor)=>service.families.update(actor,(await params).id,await readInput(request)));}
