"use server";
import { revalidatePath } from "@/lib/revalidate";
import { requireAdmin } from "../../lib/auth/permissions";
import { getPrisma } from "@daegwang/database/prisma";
import { createAppPublicationService, PublicationError } from "@daegwang/server/features/worship/app-publication-core";
import { isAppPublicationEnabled } from "@daegwang/server/features/worship/app-server";

export type AppPublicationState = { message: string; success: boolean };
export async function changeAppPublicationAction(id: string, expectedUpdatedAt: string,
  _state: AppPublicationState, formData: FormData): Promise<AppPublicationState> {
  const admin = await requireAdmin();
  if (!isAppPublicationEnabled()) return { success: false, message: "앱 발행 기능을 준비하고 있습니다." };
  const intent = formData.get("intent");
  if (intent !== "publish" && intent !== "unpublish") return { success: false, message: "작업을 확인해 주세요." };
  try {
    const service = createAppPublicationService(getPrisma());
    if (intent === "publish") await service.publish({ adminId: admin.id }, id, expectedUpdatedAt);
    else await service.unpublish({ adminId: admin.id }, id, expectedUpdatedAt);
  } catch (error) {
    if (error instanceof PublicationError && error.code === "CONFLICT") {
      return { success: false, message: "저장된 내용이 변경되었습니다. 페이지를 새로고침한 뒤 확인해 주세요." };
    }
    return { success: false, message: "앱 발행 상태를 변경하지 못했습니다. 권한과 저장 상태를 확인해 주세요." };
  }
  revalidatePath(`/admin/worship/${id}/edit`);
  return { success: true, message: intent === "publish" ? "저장된 내용을 앱에 발행했습니다." : "앱 발행을 중단했습니다." };
}
