import { z } from "zod";

const optional = (max: number) => z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);

export const publicInquirySchema = z.object({
  type: z.enum(["NEWCOMER", "COUNSELING", "PRAYER", "GENERAL"]),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(80),
  phone: optional(40), email: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, "이메일 주소를 확인해 주세요.").transform((value) => value || undefined),
  preferredContact: optional(40), title: optional(160), content: z.string().trim().min(10, "문의 내용을 10자 이상 입력해 주세요.").max(5000),
  privacyAgreed: z.literal(true, { error: "개인정보 수집 및 이용에 동의해 주세요." }), website: z.string().max(0),
}).refine((data) => Boolean(data.phone || data.email), { message: "전화번호 또는 이메일 중 하나를 입력해 주세요.", path: ["phone"] });

export function parsePublicInquiry(formData: FormData) { return publicInquirySchema.safeParse({ type: formData.get("type"), name: formData.get("name"), phone: formData.get("phone") ?? "", email: formData.get("email") ?? "", preferredContact: formData.get("preferredContact") ?? "", title: formData.get("title") ?? "", content: formData.get("content"), privacyAgreed: formData.get("privacyAgreed") === "on", website: formData.get("website") ?? "" }); }

export const inquiryTypeLabels = { NEWCOMER: "새가족", COUNSELING: "상담", PRAYER: "기도 요청", GENERAL: "일반 문의" } as const;
export const inquiryStatusLabels = { NEW: "신규", CHECKED: "확인", CONTACTING: "연락 중", COMPLETED: "처리 완료", ON_HOLD: "보류" } as const;
export const inquiryStatusSchema = z.enum(["NEW", "CHECKED", "CONTACTING", "COMPLETED", "ON_HOLD"]);
export const inquiryNoteSchema = z.string().trim().min(1, "메모 내용을 입력해 주세요.").max(3000);
