import { z } from "zod";
export const adminProfileSchema = z.object({ authUserId: z.uuid("Supabase Auth 사용자 UUID를 확인해 주세요."), email: z.email("이메일 주소를 확인해 주세요."), displayName: z.string().trim().min(1, "표시 이름을 입력해 주세요.").max(80), role: z.enum(["SUPER_ADMIN", "ADMIN"]), isActive: z.boolean() });
export function parseAdminProfile(formData: FormData) { return adminProfileSchema.safeParse({ authUserId: formData.get("authUserId"), email: formData.get("email"), displayName: formData.get("displayName"), role: formData.get("role"), isActive: formData.get("isActive") === "on" }); }
export const adminRoleLabels = { SUPER_ADMIN: "최고 관리자", ADMIN: "일반 관리자" } as const;
