"use server";
import { redirect } from 'next/navigation';
import { checkInquiryRateLimit } from '@daegwang/server/features/inquiries/rate-limit';
import { parsePublicInquiry } from '@daegwang/contracts/features/inquiries/schema';
import { getPrisma } from '@daegwang/database/prisma';
export type PublicInquiryState = { message?: string; errors?: Record<string, string[]> };
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

  const returnPath =
    formData.get("returnPath") === "/newcomer/register"
      ? "/newcomer/register"
      : "/newcomer/contact";
  redirect(`${returnPath}?submitted=1`);
}

