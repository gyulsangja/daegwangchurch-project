"use server";
import {revalidatePath} from '@/lib/revalidate';
import {ZodError} from 'zod';
import {getPrisma} from '@daegwang/database/prisma';
import {createFixedPageManagement} from '@daegwang/server/features/church-content/page-management';
import {ContentManagementError} from '@daegwang/server/features/church-content/management';
import {fixedPageInfo,type FixedPageKind} from '@daegwang/contracts/page-management';
import {requireAdmin} from '../../lib/auth/permissions';
export type FixedPageActionState={message?:string;success?:boolean;errors?:Record<string,string[]>;expectedUpdatedAt?:string};
async function save(kind:FixedPageKind,state:FixedPageActionState,form:FormData):Promise<FixedPageActionState>{
 const actor=await requireAdmin();const values:Record<string,unknown>=Object.fromEntries(form);if(kind==='home')for(const key of ['showWorship','showNews','showChurch','showWelcome'])values[key]=form.get(key)==='on';
 try{const result=await createFixedPageManagement(getPrisma()).save(actor.authUserId,{kind,expectedUpdatedAt:String(form.get('expectedUpdatedAt')??'')||null,values,confirmed:true});revalidatePath(fixedPageInfo[kind].path);revalidatePath('/admin/pages');return {success:true,message:'저장했습니다.',expectedUpdatedAt:result.expectedUpdatedAt};}
 catch(e){if(e instanceof ZodError){const errors:Record<string,string[]>={};for(const issue of e.issues){const key=String(issue.path[1]??issue.path[0]??'');(errors[key]??=[]).push(issue.message);}return {message:'입력값을 확인해 주세요.',errors,expectedUpdatedAt:state.expectedUpdatedAt};}return {message:e instanceof ContentManagementError?e.message:'페이지를 저장하지 못했습니다.',expectedUpdatedAt:state.expectedUpdatedAt};}
}
export async function saveChurchPageAction(state:FixedPageActionState,form:FormData){return save('church',state,form);}
export async function saveVisionPageAction(state:FixedPageActionState,form:FormData){return save('vision',state,form);}
export async function saveNewcomerEducationAction(state:FixedPageActionState,form:FormData){return save('newcomerEducation',state,form);}
export async function saveHomePageAction(state:FixedPageActionState,form:FormData){return save('home',state,form);}
