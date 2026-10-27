import {handle,readInput} from '@/lib/http';
import {pastoralCreate,pastoralChange} from '@daegwang/contracts/ministry-pastoral';
import {verifyAddedContentLinks} from '@/lib/verify-content-links';
import {canReadPastoralCalendar} from '@daegwang/ministry-core/calendar-access';
import {DirectoryError} from '@daegwang/ministry-core/directory';
export function POST(request:Request){return handle(request,async(service,actor)=>{
 if(!canReadPastoralCalendar(actor))throw new DirectoryError('FORBIDDEN');
 const input=pastoralCreate.parse(await readInput(request,64000));
 await verifyAddedContentLinks(input.contentLinks??[]);
 return service.pastoral.create(actor,input);
});}
export function PUT(request:Request){return handle(request,async(service,actor)=>{
 if(!canReadPastoralCalendar(actor))throw new DirectoryError('FORBIDDEN');
 const input=pastoralChange.parse(await readInput(request,64000));
 if(input.contentLinks)await verifyAddedContentLinks(input.contentLinks,await service.pastoral.contentLinks(actor,input.id));
 return service.pastoral.update(actor,input);
});}
