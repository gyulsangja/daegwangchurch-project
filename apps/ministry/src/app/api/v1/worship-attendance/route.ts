import {DirectoryError} from '@daegwang/ministry-core/directory';
import {worshipAttendanceQuery,worshipAttendancePage} from '@daegwang/contracts/worship-sessions';
import {ministryTransaction} from '@daegwang/database/ministry-postgres';
import {listWorshipAttendance} from '@daegwang/database/ministry-worship';
import {handle} from '@/lib/http';
import {ministryPool} from '@/lib/operational-directory';
import {operationalEnabled} from '@/lib/operational-config';
export function GET(request:Request){return handle(request,async(_service,actor,session)=>{
 if(!operationalEnabled()||actor.role!=='ADMIN'||!session)throw new DirectoryError('FORBIDDEN');
 const q=worshipAttendanceQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
 return worshipAttendancePage.parse(await ministryTransaction(ministryPool(),actor.id,actor.churchId,(db,grant)=>listWorshipAttendance(db,grant,q.month,q.page,q.ids),{aal:session.aal,enforceMfa:false,readOnly:true}));
});}
