import { z } from "zod";

const dateTime = z.string().trim().min(1, "시작 날짜와 시간을 입력해 주세요.").refine((value) => !Number.isNaN(Date.parse(value)), "날짜와 시간을 확인해 주세요.");
const optionalDateTime = z.string().trim().refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "날짜와 시간을 확인해 주세요.").transform((value) => value || undefined);
const optionalText = (max: number) => z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160, "제목은 160자 이내로 입력해 주세요."),
    category: z.string().trim().min(1, "분류를 입력해 주세요.").max(40, "분류는 40자 이내로 입력해 주세요."),
    startsAt: dateTime,
    endsAt: optionalDateTime,
    isAllDay: z.boolean(),
    location: optionalText(160),
    ministryName: optionalText(80),
    description: optionalText(5000),
    status: z.enum(["DRAFT", "PUBLISHED", "PRIVATE"]),
  })
  .refine((data) => !data.endsAt || new Date(data.startsAt) < new Date(data.endsAt), {
    message: "종료 시간은 시작 시간보다 뒤여야 합니다.",
    path: ["endsAt"],
  });

export function parseEventFormData(formData: FormData) {
  return eventFormSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? "",
    isAllDay: formData.get("isAllDay") === "on",
    location: formData.get("location") ?? "",
    ministryName: formData.get("ministryName") ?? "",
    description: formData.get("description") ?? "",
    status: formData.get("status"),
  });
}

export const eventStatusLabels = {
  DRAFT: "임시저장",
  PUBLISHED: "공개",
  PRIVATE: "비공개",
} as const;

