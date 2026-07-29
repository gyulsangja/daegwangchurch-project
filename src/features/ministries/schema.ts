import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);

export const ministryFormSchema = z.object({
  name: z.string().trim().min(1, "사역명을 입력해 주세요.").max(100),
  slug: z.string().trim().min(1, "주소를 입력해 주세요.").max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "영문 소문자, 숫자와 하이픈만 사용할 수 있습니다."),
  type: z.enum(["ELEMENTARY", "YOUTH", "YOUNG_ADULT", "NEWCOMER", "BLESSING_FOOTBALL", "OTHER"]),
  introduction: z.string().trim().min(1, "소개를 입력해 주세요.").max(5000),
  audience: optionalText(120), meetingDay: optionalText(80), meetingTime: optionalText(80), location: optionalText(160), leader: optionalText(100),
  contactName: optionalText(100), contactValue: optionalText(200), showContact: z.boolean(), programText: optionalText(3000),
  status: z.enum(["DRAFT", "PUBLISHED", "PRIVATE"]), sortOrder: z.coerce.number().int().min(0).max(9999), removeCoverImage: z.boolean(),
});

export function parseMinistryFormData(formData: FormData) { return ministryFormSchema.safeParse({
  name: formData.get("name"), slug: formData.get("slug"), type: formData.get("type"), introduction: formData.get("introduction"),
  audience: formData.get("audience") ?? "", meetingDay: formData.get("meetingDay") ?? "", meetingTime: formData.get("meetingTime") ?? "", location: formData.get("location") ?? "", leader: formData.get("leader") ?? "",
  contactName: formData.get("contactName") ?? "", contactValue: formData.get("contactValue") ?? "", showContact: formData.get("showContact") === "on", programText: formData.get("programText") ?? "",
  status: formData.get("status"), sortOrder: formData.get("sortOrder") ?? "0", removeCoverImage: formData.get("removeCoverImage") === "on",
}); }

export const ministryTypeLabels = { ELEMENTARY: "유초등부", YOUTH: "중고등부", YOUNG_ADULT: "청년부", NEWCOMER: "새가족", BLESSING_FOOTBALL: "축복축구교실", OTHER: "기타 사역" } as const;
export const ministryStatusLabels = { DRAFT: "임시저장", PUBLISHED: "공개", PRIVATE: "비공개" } as const;
