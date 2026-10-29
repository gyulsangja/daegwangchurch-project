import 'server-only';
import type {Actor} from '@daegwang/ministry-core/directory';
import {DirectoryError} from '@daegwang/ministry-core/directory';
import {monthSchema} from '@daegwang/contracts/features/calendar';
import {ministryTransaction} from '@daegwang/database/ministry-postgres';
import {readMinistrySummary} from '@daegwang/database/ministry-summary';
import {ministryPool} from './operational-directory';
import {operationalEnabled} from './operational-config';
export async function summaryReport(actor:Actor,value:string){const month=monthSchema.parse(value);if(!['ADMIN','OFFICE','COUNCIL'].includes(actor.role))throw new DirectoryError('FORBIDDEN');
 if(!operationalEnabled())return {total:0,members:[],attendance:[],month};
 return ministryTransaction(ministryPool(),actor.id,actor.churchId,async(db,grant)=>{if(!['ADMIN','OFFICE','COUNCIL'].includes(grant.role))throw new DirectoryError('FORBIDDEN');return readMinistrySummary(db,actor.churchId,month);},{aal:'aal1',enforceMfa:false,readOnly:true});
}
