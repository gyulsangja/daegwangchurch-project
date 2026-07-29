import { z } from "zod";

import { parseYouTubeUrl } from "@/lib/youtube/parser";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max}자 이내로 입력해 주세요.`)
    .transform((value) => value || undefined);

export const worshipFormSchema = z.object({
  type: z.enum([
    "SUNDAY_MORNING",
    "FIRST_HOUR",
    "SUNDAY_AFTERNOON",
    "WEDNESDAY",
    "SPECIAL",
    "PRAISE",
  ]),
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160),
  contentDate: z.iso.date("날짜를 확인해 주세요."),
  youtubeUrl: z
    .string()
    .trim()
    .min(1, "YouTube URL을 입력해 주세요.")
    .refine((value) => parseYouTubeUrl(value) !== null, "유효한 YouTube 영상 URL을 입력해 주세요."),
  preacher: optionalText(80),
  sermonTitle: optionalText(160),
  scripture: optionalText(160),
  description: optionalText(2000),
  summary: optionalText(500),
  status: z.enum(["DRAFT", "PUBLISHED", "PRIVATE"]),
  isPinned: z.boolean(),
});

export type WorshipFormInput = z.infer<typeof worshipFormSchema>;

export function parseWorshipFormData(formData: FormData) {
  return worshipFormSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    contentDate: formData.get("contentDate"),
    youtubeUrl: formData.get("youtubeUrl"),
    preacher: formData.get("preacher") ?? "",
    sermonTitle: formData.get("sermonTitle") ?? "",
    scripture: formData.get("scripture") ?? "",
    description: formData.get("description") ?? "",
    summary: formData.get("summary") ?? "",
    status: formData.get("status"),
    isPinned: formData.get("isPinned") === "on",
  });
}

export const worshipTypeLabels = {
  SUNDAY_MORNING: "주일 오전예배",
  FIRST_HOUR: "첫 시간 주님께",
  SUNDAY_AFTERNOON: "주일 오후예배",
  WEDNESDAY: "수요기도회",
  SPECIAL: "특별예배",
  PRAISE: "찬양",
} as const;

export const contentStatusLabels = {
  DRAFT: "임시저장",
  PUBLISHED: "공개",
  PRIVATE: "비공개",
} as const;
