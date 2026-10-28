import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {intakeQuery,intakeSave,intakePage,intakeDetail} from '@daegwang/contracts/intake-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageIntake(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN'||!actor.permissions?.includes('CARE'))throw new DirectoryError('FORBIDDEN','목회 돌봄 권한과 기존 접수 담당 권한이 필요합니다.');
 const input=save?intakeSave.parse(raw):intakeQuery.parse(raw);
 const result=await requestCmsManagement(actor,'intake',input,save,session,raw);
 if(save){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true};}
 return 'id'in input&&input.id?intakeDetail.parse(result):intakePage.parse(result);
}
