import { z } from "zod";

const optionalNumber = (min: number, max: number, label: string) => z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), `${label}을(를) 확인해 주세요.`).transform((v) => v ? Number(v) : undefined);

export const historyFormSchema = z.object({
  year: z.coerce.number().int().min(1800, "연도를 확인해 주세요.").max(2200, "연도를 확인해 주세요."),
  month: optionalNumber(1, 12, "월"), day: optionalNumber(1, 31, "일"),
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160, "160자 이내로 입력해 주세요."),
  content: z.string().trim().max(2000, "2000자 이내로 입력해 주세요.").transform((v) => v || undefined),
  sortOrder: z.coerce.number().int().min(0).max(9999), isVisible: z.boolean(),
});

export function parseHistoryFormData(formData: FormData) { return historyFormSchema.safeParse({ year: formData.get("year"), month: formData.get("month") ?? "", day: formData.get("day") ?? "", title: formData.get("title"), content: formData.get("content") ?? "", sortOrder: formData.get("sortOrder"), isVisible: formData.get("isVisible") === "on" }); }
