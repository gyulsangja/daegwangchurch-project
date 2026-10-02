import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);

export const albumFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160, "제목은 160자 이내로 입력해 주세요."),
  eventDate: z.iso.date("행사 날짜를 확인해 주세요."),
  category: z.string().trim().min(1, "분류를 입력해 주세요.").max(40, "분류는 40자 이내로 입력해 주세요."),
  description: optionalText(3000),
  status: z.enum(["DRAFT", "PUBLISHED", "PRIVATE"]),
  showOnMain: z.boolean(),
});

export function parseAlbumFormData(formData: FormData) {
  return albumFormSchema.safeParse({
    title: formData.get("title"),
    eventDate: formData.get("eventDate"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    status: formData.get("status"),
    showOnMain: formData.get("showOnMain") === "on",
  });
}

export const albumStatusLabels = {
  DRAFT: "임시저장",
  PUBLISHED: "공개",
  PRIVATE: "비공개",
} as const;

