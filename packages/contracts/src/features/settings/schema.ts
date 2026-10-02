import { z } from "zod";
const optional = (max: number) => z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);
const optionalUrl = z.string().trim().refine((value) => value === "" || z.url().safeParse(value).success, "올바른 URL을 입력해 주세요.").transform((value) => value || undefined);
const coordinate = (min: number, max: number, label: string) => z.string().trim().refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= min && Number(value) <= max), `${label}을 확인해 주세요.`).transform((value) => value ? Number(value) : undefined);
export const siteSettingSchema = z.object({
  siteName: z.string().trim().min(1, "교회명을 입력해 주세요.").max(100), description: optional(300), canonicalUrl: z.url("올바른 대표 URL을 입력해 주세요."),
  address: optional(200), addressDetail: optional(200), phone: optional(40), email: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, "이메일 주소를 확인해 주세요.").transform((value) => value || undefined),
  mapLatitude: coordinate(-90, 90, "위도"), mapLongitude: coordinate(-180, 180, "경도"), youtubeUrl: optionalUrl,
  transitInfo: optional(1000), parkingInfo: optional(1000), privacyOfficer: optional(100), privacyContact: optional(200),
});
export function parseSiteSetting(formData: FormData) { return siteSettingSchema.safeParse(Object.fromEntries(formData.entries())); }
