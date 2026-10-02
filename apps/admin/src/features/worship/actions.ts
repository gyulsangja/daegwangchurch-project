"use server";

import { revalidatePath } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { worshipFormDataToInput } from "@daegwang/contracts/features/worship/schema";
import { getWorshipService } from "@daegwang/server/features/worship/service";
import { requireAdmin } from "../../lib/auth/permissions";

export type WorshipActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

const publicWorshipPaths = [
  "/", "/worship/sunday-morning", "/worship/first-hour",
  "/worship/sunday-afternoon", "/worship/wednesday", "/worship/special", "/worship/praise",
];

function revalidateWorship() {
  revalidatePath("/admin/worship");
  for (const path of publicWorshipPaths) revalidatePath(path);
}

function validationState(error: unknown): WorshipActionState | undefined {
  if (error instanceof ZodError) {
    return { message: "입력값을 확인해 주세요.", errors: error.flatten().fieldErrors };
  }
}

export async function createWorshipAction(
  _previousState: WorshipActionState,
  formData: FormData,
): Promise<WorshipActionState> {
  const admin = await requireAdmin();
  let createdId: string;
  try {
    const content = await getWorshipService().create(
      { adminId: admin.id }, worshipFormDataToInput(formData),
    );
    createdId = content.id;
  } catch (error) {
    const state = validationState(error);
    if (state) return state;
    console.error("Failed to create worship content", error);
    return { message: "저장하지 못했습니다. 동일한 영상이 이미 등록되었는지 확인해 주세요." };
  }
  revalidateWorship();
  redirect(`/admin/worship/${createdId}/edit?saved=1`);
}

export async function updateWorshipAction(
  id: string,
  _previousState: WorshipActionState,
  formData: FormData,
): Promise<WorshipActionState> {
  const admin = await requireAdmin();
  try {
    await getWorshipService().update(
      { adminId: admin.id }, id, worshipFormDataToInput(formData),
    );
  } catch (error) {
    const state = validationState(error);
    if (state) return state;
    console.error("Failed to update worship content", error);
    return { message: "수정 내용을 저장하지 못했습니다." };
  }
  revalidateWorship();
  redirect(`/admin/worship/${id}/edit?saved=1`);
}

export async function deleteWorshipAction(id: string) {
  const admin = await requireAdmin();
  await getWorshipService().delete({ adminId: admin.id }, id);
  revalidateWorship();
  redirect("/admin/worship");
}
