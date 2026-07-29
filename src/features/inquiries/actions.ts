"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkInquiryRateLimit } from "@/features/inquiries/rate-limit";
import { getInquiryRetentionDays } from "@/features/inquiries/policy";
import {
  inquiryNoteSchema,
  inquiryStatusSchema,
  parsePublicInquiry,
} from "@/features/inquiries/schema";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { getPrisma } from "@/lib/db/prisma";

export type PublicInquiryState = {
  message?: string;
  errors?: Record<string, string[]>;
};
export type AdminInquiryState = { message?: string; success?: boolean };

export async function submitInquiryAction(
  _state: PublicInquiryState,
  formData: FormData,
): Promise<PublicInquiryState> {
  const result = parsePublicInquiry(formData);
  if (!result.success) {
    return {
      message: "입력 내용을 확인해 주세요.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const rateLimit = await checkInquiryRateLimit();
  if (!rateLimit.allowed) {
    return {
      message: `짧은 시간에 너무 많은 문의가 접수되었습니다. 약 ${rateLimit.retryAfterMinutes}분 후 다시 시도해 주세요.`,
    };
  }

  const d = result.data;
  try {
    await getPrisma().inquiry.create({
      data: {
        type: d.type,
        name: d.name,
        phone: d.phone ?? null,
        email: d.email ?? null,
        preferredContact: d.preferredContact ?? null,
        title: d.title ?? null,
        content: d.content,
        privacyAgreedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to submit inquiry", error);
    return { message: "문의를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/admin/inquiries");
  const returnPath =
    formData.get("returnPath") === "/newcomer/register"
      ? "/newcomer/register"
      : "/newcomer/contact";
  redirect(`${returnPath}?submitted=1`);
}

export async function updateInquiryStatusAction(
  id: string,
  _state: AdminInquiryState,
  formData: FormData,
): Promise<AdminInquiryState> {
  const admin = await requireSuperAdmin();
  const result = inquiryStatusSchema.safeParse(formData.get("status"));
  if (!result.success) return { message: "처리 상태를 확인해 주세요." };

  const current = await getPrisma().inquiry.findFirst({
    where: { id, deletedAt: null },
  });
  if (!current) return { message: "문의를 찾지 못했습니다." };

  const now = new Date();
  await getPrisma().$transaction(async (tx) => {
    await tx.inquiry.update({
      where: { id },
      data: {
        status: result.data,
        checkedAt: current.checkedAt ?? now,
        completedAt:
          result.data === "COMPLETED" ? current.completedAt ?? now : null,
      },
    });
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "UPDATE",
        entityType: "Inquiry",
        entityId: id,
        summary: `문의 처리 상태 변경: ${current.status} → ${result.data}`,
      },
    });
  });
  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin/inquiries");
  return { success: true, message: "처리 상태를 변경했습니다." };
}

export async function addInquiryNoteAction(
  id: string,
  _state: AdminInquiryState,
  formData: FormData,
): Promise<AdminInquiryState> {
  const admin = await requireSuperAdmin();
  const result = inquiryNoteSchema.safeParse(formData.get("note"));
  if (!result.success) {
    return { message: result.error.issues[0]?.message ?? "메모를 입력해 주세요." };
  }

  await getPrisma().$transaction(async (tx) => {
    await tx.inquiryNote.create({
      data: { inquiryId: id, authorId: admin.id, content: result.data },
    });
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "UPDATE",
        entityType: "Inquiry",
        entityId: id,
        summary: "문의 내부 메모 추가",
      },
    });
  });
  revalidatePath(`/admin/inquiries/${id}`);
  return { success: true, message: "내부 메모를 추가했습니다." };
}

export async function purgeExpiredInquiriesAction() {
  const admin = await requireSuperAdmin();
  const retentionDays = getInquiryRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await getPrisma().$transaction(async (tx) => {
    const deleted = await tx.inquiry.deleteMany({
      where: { status: "COMPLETED", completedAt: { lte: cutoff } },
    });
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "DELETE",
        entityType: "Inquiry",
        summary: `보관기간 경과 문의 영구 삭제: ${deleted.count}건`,
      },
    });
    return deleted;
  });

  revalidatePath("/admin/inquiries");
  redirect(`/admin/inquiries?purged=${result.count}`);
}

export async function deleteInquiryAction(id: string) {
  const admin = await requireSuperAdmin();
  await getPrisma().$transaction(async (tx) => {
    await tx.inquiry.delete({ where: { id } });
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "DELETE",
        entityType: "Inquiry",
        entityId: id,
        summary: "문의 영구 삭제",
      },
    });
  });
  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries");
}
