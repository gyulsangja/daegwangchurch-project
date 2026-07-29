import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);

export const bulletinFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160, "제목은 160자 이내로 입력해 주세요."),
  worshipDate: z.iso.date("예배 날짜를 확인해 주세요."),
  summary: optionalText(1000),
  status: z.enum(["DRAFT", "PUBLISHED", "PRIVATE"]),
});

export function parseBulletinFormData(formData: FormData) {
  return bulletinFormSchema.safeParse({
    title: formData.get("title"),
    worshipDate: formData.get("worshipDate"),
    summary: formData.get("summary") ?? "",
    status: formData.get("status"),
  });
}

export const bulletinStatusLabels = {
  DRAFT: "임시저장",
  PUBLISHED: "공개",
  PRIVATE: "비공개",
} as const;

