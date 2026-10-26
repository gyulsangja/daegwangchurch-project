import {handle,readInput} from '@/lib/http';
export function POST(request:Request){return handle(request,async(service,actor)=>service.pastoral.create(actor,await readInput(request,64000)));}
export function PUT(request:Request){return handle(request,async(service,actor)=>service.pastoral.update(actor,await readInput(request,64000)));}
