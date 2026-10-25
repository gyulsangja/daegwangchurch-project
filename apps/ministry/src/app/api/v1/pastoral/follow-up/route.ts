import {handle,readInput} from '@/lib/http';
import {z} from 'zod';
const input=z.object({recordId:z.string().min(1).max(100)}).strict();
export function POST(request:Request){return handle(request,async(service,actor)=>service.pastoral.followUp(actor,input.parse(await readInput(request)).recordId));}
