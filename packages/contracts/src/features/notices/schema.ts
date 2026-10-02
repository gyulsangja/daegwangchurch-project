import { z } from "zod";

const optionalDateTime = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "날짜와 시간을 확인해 주세요.")
  .transform((value) => value || undefined);

export const noticeFormSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160, "제목은 160자 이내로 입력해 주세요."),
    category: z.string().trim().min(1, "분류를 입력해 주세요.").max(40, "분류는 40자 이내로 입력해 주세요."),
    body: z.string().trim().min(1, "본문을 입력해 주세요.").max(20000, "본문은 20,000자 이내로 입력해 주세요."),
    status: z.enum(["DRAFT", "PUBLISHED", "PRIVATE"]),
    isImportant: z.boolean(),
    isPinned: z.boolean(),
    publishStartsAt: optionalDateTime,
    publishEndsAt: optionalDateTime,
  })
  .refine(
    (data) => !data.publishStartsAt || !data.publishEndsAt || new Date(data.publishStartsAt) < new Date(data.publishEndsAt),
    { message: "게시 종료일은 시작일보다 뒤여야 합니다.", path: ["publishEndsAt"] },
  );

export type NoticeFormInput = z.infer<typeof noticeFormSchema>;

export function parseNoticeFormData(formData: FormData) {
  return noticeFormSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    body: formData.get("body"),
    status: formData.get("status"),
    isImportant: formData.get("isImportant") === "on",
    isPinned: formData.get("isPinned") === "on",
    publishStartsAt: formData.get("publishStartsAt") ?? "",
    publishEndsAt: formData.get("publishEndsAt") ?? "",
  });
}

export const noticeStatusLabels = {
  DRAFT: "임시저장",
  PUBLISHED: "공개",
  PRIVATE: "비공개",
} as const;

