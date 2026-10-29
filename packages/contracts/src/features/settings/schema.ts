import { z } from "zod";
const optional = (max: number) => z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);
const httpUrl = z.url().refine(value=>/^https?:\/\//i.test(value),'http 또는 https 주소를 입력해 주세요.');
const optionalUrl = z.string().trim().refine((value) => value === "" || httpUrl.safeParse(value).success, "올바른 URL을 입력해 주세요.").transform((value) => value || undefined);
const coordinate = (min: number, max: number, label: string) => z.string().trim().refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= min && Number(value) <= max), `${label}을 확인해 주세요.`).transform((value) => value ? Number(value) : undefined);
export const siteSettingSchema = z.object({
  siteName: z.string().trim().min(1, "교회명을 입력해 주세요.").max(100), description: optional(300), canonicalUrl: httpUrl,
  address: optional(200), addressDetail: optional(200), phone: optional(40), email: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, "이메일 주소를 확인해 주세요.").transform((value) => value || undefined),
  mapLatitude: coordinate(-90, 90, "위도"), mapLongitude: coordinate(-180, 180, "경도"), youtubeUrl: optionalUrl,
  transitInfo: optional(1000), parkingInfo: optional(1000), privacyOfficer: optional(100), privacyContact: optional(200),
  offeringBank: optional(100).default(''), offeringNumber: optional(100).default(''), offeringHolder: optional(100).default(''), offeringNote: optional(1000).default(''),
}).superRefine((data, ctx) => {
  const fields = ['offeringBank', 'offeringNumber', 'offeringHolder'] as const;
  if (fields.some(field => data[field])) for (const field of fields) if (!data[field]) ctx.addIssue({ code: 'custom', path: [field], message: '헌금 계좌의 은행·계좌번호·예금주를 모두 입력해 주세요.' });
  if (data.offeringNumber && !/^[0-9\s-]+$/.test(data.offeringNumber)) ctx.addIssue({ code: 'custom', path: ['offeringNumber'], message: '계좌번호는 숫자와 하이픈으로 입력해 주세요.' });
});
export function parseSiteSetting(formData: FormData) { return siteSettingSchema.safeParse(Object.fromEntries(formData.entries())); }
