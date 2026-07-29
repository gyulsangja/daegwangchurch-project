"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseWorshipFormData } from "@/features/worship/schema";
import { requireAdmin } from "@/lib/auth/permissions";
import { getPrisma } from "@/lib/db/prisma";
import { parseYouTubeUrl } from "@/lib/youtube/parser";

export type WorshipActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

const publicWorshipPaths = [
  "/",
  "/worship/sunday-morning",
  "/worship/first-hour",
  "/worship/sunday-afternoon",
  "/worship/wednesday",
  "/worship/special",
  "/worship/praise",
];

function revalidateWorship() {
  revalidatePath("/admin/worship");
  for (const path of publicWorshipPaths) revalidatePath(path);
}

function buildSlug(type: string, contentDate: string, videoId: string) {
  return `${type.toLowerCase().replaceAll("_", "-")}-${contentDate}-${videoId}`;
}

function parseInput(formData: FormData):
  | { success: true; data: ReturnType<typeof parseWorshipFormData>["data"] & object }
  | { success: false; state: WorshipActionState } {
  const result = parseWorshipFormData(formData);
  if (!result.success) {
    return {
      success: false,
      state: {
        message: "입력값을 확인해 주세요.",
        errors: result.error.flatten().fieldErrors,
      },
    };
  }
  return { success: true, data: result.data };
}

export async function createWorshipAction(
  _previousState: WorshipActionState,
  formData: FormData,
): Promise<WorshipActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;

  const youtube = parseYouTubeUrl(parsed.data.youtubeUrl);
  if (!youtube) return { message: "YouTube URL을 확인해 주세요." };

  const prisma = getPrisma();
  let slug = "";
  let createdId = "";
  try {
    slug = buildSlug(parsed.data.type, parsed.data.contentDate, youtube.videoId);
    await prisma.$transaction(async (tx) => {
      const content = await tx.worshipContent.create({
        data: {
          type: parsed.data.type,
          title: parsed.data.title,
          slug,
          contentDate: new Date(`${parsed.data.contentDate}T00:00:00.000Z`),
          youtubeUrl: youtube.canonicalUrl,
          youtubeVideoId: youtube.videoId,
          thumbnailUrl: youtube.thumbnailUrl,
          preacher: parsed.data.preacher,
          sermonTitle: parsed.data.sermonTitle,
          scripture: parsed.data.scripture,
          description: parsed.data.description,
          summary: parsed.data.summary,
          status: parsed.data.status,
          isPinned: parsed.data.isPinned,
          publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
        },
      });
      createdId = content.id;

      await tx.activityLog.create({
        data: {
          actorId: admin.id,
          action: "CREATE",
          entityType: "WorshipContent",
          entityId: content.id,
          summary: `예배 콘텐츠 '${content.title}' 등록`,
        },
      });
    });
  } catch (error) {
    console.error("Failed to create worship content", error);
    return { message: "저장하지 못했습니다. 동일한 영상이 이미 등록되었는지 확인해 주세요." };
  }

  revalidateWorship();
  redirect(`/admin/worship/${createdId}/edit?saved=1`);
}

export async function updateWorshipAction(
  id: string,
  _previousState: WorshipActionState,
  formData: FormData,
): Promise<WorshipActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;

  const youtube = parseYouTubeUrl(parsed.data.youtubeUrl);
  if (!youtube) return { message: "YouTube URL을 확인해 주세요." };

  const slug = buildSlug(parsed.data.type, parsed.data.contentDate, youtube.videoId);
  const prisma = getPrisma();
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.worshipContent.findFirst({ where: { id, deletedAt: null } });
      if (!current) throw new Error("NOT_FOUND");

      const content = await tx.worshipContent.update({
        where: { id },
        data: {
          type: parsed.data.type,
          title: parsed.data.title,
          slug,
          contentDate: new Date(`${parsed.data.contentDate}T00:00:00.000Z`),
          youtubeUrl: youtube.canonicalUrl,
          youtubeVideoId: youtube.videoId,
          thumbnailUrl: youtube.thumbnailUrl,
          preacher: parsed.data.preacher,
          sermonTitle: parsed.data.sermonTitle,
          scripture: parsed.data.scripture,
          description: parsed.data.description,
          summary: parsed.data.summary,
          status: parsed.data.status,
          isPinned: parsed.data.isPinned,
          publishedAt:
            parsed.data.status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: admin.id,
          action: "UPDATE",
          entityType: "WorshipContent",
          entityId: content.id,
          summary: `예배 콘텐츠 '${content.title}' 수정`,
          changes: { previousStatus: current.status, nextStatus: content.status },
        },
      });
    });
  } catch (error) {
    console.error("Failed to update worship content", error);
    return { message: "수정 내용을 저장하지 못했습니다." };
  }

  revalidateWorship();
  redirect(`/admin/worship/${id}/edit?saved=1`);
}

export async function deleteWorshipAction(id: string) {
  const admin = await requireAdmin();
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    const content = await tx.worshipContent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "DELETE",
        entityType: "WorshipContent",
        entityId: content.id,
        summary: `예배 콘텐츠 '${content.title}' 삭제`,
      },
    });
  });

  revalidateWorship();
  redirect("/admin/worship");
}
