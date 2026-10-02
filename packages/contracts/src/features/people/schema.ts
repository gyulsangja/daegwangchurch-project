import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).transform((value) => value || undefined);

export const personFormSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(80, "이름은 80자 이내로 입력해 주세요."),
  position: z.string().trim().min(1, "직분을 입력해 주세요.").max(80, "직분은 80자 이내로 입력해 주세요."),
  ministry: optionalText(120),
  introduction: optionalText(5000),
  careerText: optionalText(3000),
  quote: optionalText(500),
  isSeniorPastor: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, "노출 순서는 0 이상이어야 합니다.").max(9999),
  removeProfileImage: z.boolean(),
});

export function parsePersonFormData(formData: FormData) {
  return personFormSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position"),
    ministry: formData.get("ministry") ?? "",
    introduction: formData.get("introduction") ?? "",
    careerText: formData.get("careerText") ?? "",
    quote: formData.get("quote") ?? "",
    isSeniorPastor: formData.get("isSeniorPastor") === "on",
    isVisible: formData.get("isVisible") === "on",
    sortOrder: formData.get("sortOrder") ?? "0",
    removeProfileImage: formData.get("removeProfileImage") === "on",
  });
}

