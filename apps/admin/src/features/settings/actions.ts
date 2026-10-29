"use server";
import { revalidatePath } from "@/lib/revalidate";
import { parseSiteSetting } from "@daegwang/contracts/features/settings/schema";
import {createSiteSettingsManagement} from '@daegwang/server/features/church-content/site-settings-management';
import {ContentManagementError} from '@daegwang/server/features/church-content/management';
import { requireAdmin } from "../../lib/auth/permissions";
import { getPrisma } from "@daegwang/database/prisma";
export type SiteSettingActionState = { message?: string; success?: boolean; errors?: Record<string, string[]>;expectedUpdatedAt?:string };
export async function saveSiteSettingAction(_state: SiteSettingActionState, formData: FormData): Promise<SiteSettingActionState> {
 const admin=await requireAdmin();const result=parseSiteSetting(formData);if(!result.success)return {expectedUpdatedAt:_state.expectedUpdatedAt,message:'입력값을 확인해 주세요.',errors:result.error.flatten().fieldErrors};
 try{const saved=await createSiteSettingsManagement(getPrisma()).save(admin.authUserId,{expectedUpdatedAt:String(formData.get('expectedUpdatedAt')??'')||null,values:Object.fromEntries(formData),confirmed:true});
  for(const path of ['/location','/privacy','/offering','/admin/settings'])revalidatePath(path);revalidatePath('/','layout');return {success:true,message:'사이트 설정을 저장했습니다.',expectedUpdatedAt:saved.expectedUpdatedAt};
 }catch(e){return {expectedUpdatedAt:_state.expectedUpdatedAt,message:e instanceof ContentManagementError?e.message:'사이트 설정을 저장하지 못했습니다. 새로고침 후 다시 확인해 주세요.'};}
}
