"use server";

import { revalidatePath } from "next/cache";

import { pageKeys } from "@/features/pages/content";
import { parseChurchPageFormData, parseHomePageFormData, parseNewcomerEducationFormData, parseVisionPageFormData } from "@/features/pages/schema";
import { requireAdmin } from "@/lib/auth/permissions";
import { getPrisma } from "@/lib/db/prisma";

export type FixedPageActionState = { message?: string; success?: boolean; errors?: Record<string, string[]> };

async function savePage(key: string, title: string, description: string, content: object, status: "DRAFT" | "PUBLISHED" | "PRIVATE", path: string) {
  const admin = await requireAdmin();
  try {
    await getPrisma().$transaction(async (tx) => {
      const current = await tx.page.findUnique({ where: { key } });
      const page = await tx.page.upsert({
        where: { key },
        create: { key, title, description, content, status, publishedAt: status === "PUBLISHED" ? new Date() : null },
        update: { title, description, content, status, deletedAt: null, publishedAt: status === "PUBLISHED" ? current?.publishedAt ?? new Date() : null },
      });
      await tx.activityLog.create({ data: { actorId: admin.id, action: current ? "UPDATE" : "CREATE", entityType: "Page", entityId: page.id, summary: `고정 페이지 '${title}' 저장` } });
    });
  } catch (error) {
    console.error(`Failed to save page ${key}`, error);
    return { message: "페이지를 저장하지 못했습니다." } satisfies FixedPageActionState;
  }
  revalidatePath(path); revalidatePath("/admin/pages");
  return { success: true, message: "저장했습니다." } satisfies FixedPageActionState;
}

export async function saveChurchPageAction(_state: FixedPageActionState, formData: FormData): Promise<FixedPageActionState> {
  const result = parseChurchPageFormData(formData);
  if (!result.success) return { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors };
  const d = result.data;
  return savePage(pageKeys.church, "교회소개", d.heroDescription, { heroTitle: d.heroTitle, heroDescription: d.heroDescription, sinceLabel: d.sinceLabel, motto: d.motto, sectionTitle: d.sectionTitle, body: d.body, values: [{ title: d.value1Title, description: d.value1Description }, { title: d.value2Title, description: d.value2Description }, { title: d.value3Title, description: d.value3Description }] }, d.status, "/about/church");
}

export async function saveVisionPageAction(_state: FixedPageActionState, formData: FormData): Promise<FixedPageActionState> {
  const result = parseVisionPageFormData(formData);
  if (!result.success) return { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors };
  const d = result.data;
  return savePage(pageKeys.vision, "비전과 사명", d.heroDescription, { heroTitle: d.heroTitle, heroDescription: d.heroDescription, philosophy: d.philosophy, motto: d.motto, directionTitle: d.directionTitle, directionDescription: d.directionDescription, directions: [d.direction1, d.direction2, d.direction3] }, d.status, "/about/vision");
}

export async function saveNewcomerEducationAction(_state: FixedPageActionState, formData: FormData): Promise<FixedPageActionState> {
  const result = parseNewcomerEducationFormData(formData);
  if (!result.success) return { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors };
  const d = result.data;
  return savePage(pageKeys.newcomerEducation, "새가족 교육", d.heroDescription, { heroTitle: d.heroTitle, heroDescription: d.heroDescription, processTitle: d.processTitle, duration: d.duration, location: d.location, leader: d.leader, applicationInfo: d.applicationInfo, steps: [1, 2, 3, 4, 5].map((number) => ({ title: d[`step${number}Title` as keyof typeof d], description: d[`step${number}Description` as keyof typeof d] })) }, d.status, "/newcomer/education");
}

export async function saveHomePageAction(_state: FixedPageActionState, formData: FormData): Promise<FixedPageActionState> { const result = parseHomePageFormData(formData); if (!result.success) return { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors }; const { status, ...content } = result.data; return savePage(pageKeys.home, "메인 화면", content.heroDescription, content, status, "/"); }
