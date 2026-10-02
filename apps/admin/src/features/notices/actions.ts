"use server";

import { revalidatePath } from "@/lib/revalidate";
import { redirect } from "next/navigation";

import { parseNoticeFormData } from "@daegwang/contracts/features/notices/schema";
import { requireAdmin } from "../../lib/auth/permissions";
import { getPrisma } from "@daegwang/database/prisma";
import { createClient } from "../../lib/supabase/server";

export type NoticeActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

const PUBLIC_BUCKET = "public-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 10;
const allowedTypes = new Map([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["text/plain", "txt"],
  ["application/x-hwp", "hwp"],
  ["application/haansofthwp", "hwp"],
  ["application/vnd.hancom.hwp", "hwp"],
]);

function buildSlug(title: string) {
  const base = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `${base || "notice"}-${Date.now().toString(36)}`;
}

function toDate(value?: string) {
  return value ? new Date(value) : null;
}

function getAttachmentFiles(formData: FormData) {
  return formData.getAll("attachmentFiles").filter((value): value is File => value instanceof File && value.size > 0);
}

function validateAttachments(files: File[]) {
  if (files.length > MAX_ATTACHMENT_COUNT) return `첨부파일은 한 번에 최대 ${MAX_ATTACHMENT_COUNT}개까지 업로드할 수 있습니다.`;
  if (files.some((file) => !allowedTypes.has(file.type))) return "PDF, 이미지, DOCX, XLSX, PPTX, HWP, TXT 파일만 업로드할 수 있습니다.";
  if (files.some((file) => file.size > MAX_FILE_SIZE)) return "각 첨부파일은 5MB 이하만 업로드할 수 있습니다.";
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) return "첨부파일 전체 용량은 10MB 이하여야 합니다.";
  return null;
}

async function uploadAttachments(files: File[]) {
  const supabase = await createClient();
  const folder = `notices/${new Date().getFullYear()}/${crypto.randomUUID()}`;
  const uploaded: Array<{ file: File; objectPath: string }> = [];
  try {
    for (const file of files) {
      const extension = allowedTypes.get(file.type)!;
      const objectPath = `${folder}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(objectPath, file, { contentType: file.type, cacheControl: "3600", upsert: false });
      if (error) throw new Error(`STORAGE_UPLOAD: ${error.message}`);
      uploaded.push({ file, objectPath });
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) await supabase.storage.from(PUBLIC_BUCKET).remove(uploaded.map((item) => item.objectPath));
    throw error;
  }
}

async function removeStorageObjects(items: Array<{ bucket: string; objectPath: string }>) {
  if (!items.length) return;
  const supabase = await createClient();
  const grouped = Map.groupBy(items, (item) => item.bucket);
  for (const [bucket, objects] of grouped) {
    const { error } = await supabase.storage.from(bucket).remove(objects.map((item) => item.objectPath));
    if (error) console.error("Failed to remove notice attachments", error);
  }
}

function parseInput(formData: FormData):
  | { success: true; data: ReturnType<typeof parseNoticeFormData>["data"] & object }
  | { success: false; state: NoticeActionState } {
  const result = parseNoticeFormData(formData);
  if (!result.success) {
    return {
      success: false,
      state: { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors },
    };
  }
  return { success: true, data: result.data };
}

function revalidateNoticePaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/notices");
  revalidatePath("/news/notices");
  if (slug) revalidatePath(`/news/notices/${slug}`);
}

export async function createNoticeAction(
  _previousState: NoticeActionState,
  formData: FormData,
): Promise<NoticeActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const files = getAttachmentFiles(formData);
  const attachmentError = validateAttachments(files);
  if (attachmentError) return { message: attachmentError, errors: { attachmentFiles: [attachmentError] } };

  const prisma = getPrisma();
  let createdId = "";
  let uploaded: Awaited<ReturnType<typeof uploadAttachments>> = [];
  try {
    if (files.length) uploaded = await uploadAttachments(files);
    await prisma.$transaction(async (tx) => {
      const mediaIds: string[] = [];
      for (const item of uploaded) {
        const media = await tx.media.create({ data: { bucket: PUBLIC_BUCKET, objectPath: item.objectPath, originalName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size, visibility: "PUBLIC" } });
        mediaIds.push(media.id);
      }
      const notice = await tx.notice.create({
        data: {
          title: parsed.data.title,
          slug: buildSlug(parsed.data.title),
          category: parsed.data.category,
          content: { body: parsed.data.body },
          status: parsed.data.status,
          isImportant: parsed.data.isImportant,
          isPinned: parsed.data.isPinned,
          publishStartsAt: toDate(parsed.data.publishStartsAt),
          publishEndsAt: toDate(parsed.data.publishEndsAt),
          publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
          attachments: { create: mediaIds.map((mediaId, index) => ({ mediaId, sortOrder: index })) },
        },
      });
      createdId = notice.id;
      await tx.activityLog.create({
        data: {
          actorId: admin.id,
          action: "CREATE",
          entityType: "Notice",
          entityId: notice.id,
          summary: `공지사항 '${notice.title}' 등록`,
        },
      });
    });
  } catch (error) {
    console.error("Failed to create notice", error);
    await removeStorageObjects(uploaded.map((item) => ({ bucket: PUBLIC_BUCKET, objectPath: item.objectPath })));
    return { message: "공지사항을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidateNoticePaths();
  redirect(`/admin/notices/${createdId}/edit?saved=1`);
}

export async function updateNoticeAction(
  id: string,
  _previousState: NoticeActionState,
  formData: FormData,
): Promise<NoticeActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const files = getAttachmentFiles(formData);
  const attachmentError = validateAttachments(files);
  if (attachmentError) return { message: attachmentError, errors: { attachmentFiles: [attachmentError] } };

  const prisma = getPrisma();
  const current = await prisma.notice.findFirst({ where: { id, deletedAt: null }, include: { attachments: { include: { media: true }, orderBy: { sortOrder: "asc" } } } });
  if (!current) return { message: "수정할 공지사항을 찾지 못했습니다." };
  const removeIds = new Set(formData.getAll("removeAttachmentIds").filter((value): value is string => typeof value === "string"));
  const removeAttachments = current.attachments.filter((attachment) => removeIds.has(attachment.id));
  const remainingCount = current.attachments.length - removeAttachments.length;
  if (remainingCount + files.length > MAX_ATTACHMENT_COUNT) return { message: `공지사항에는 첨부파일을 최대 ${MAX_ATTACHMENT_COUNT}개까지 등록할 수 있습니다.` };

  let slug = "";
  let uploaded: Awaited<ReturnType<typeof uploadAttachments>> = [];
  try {
    if (files.length) uploaded = await uploadAttachments(files);
    await prisma.$transaction(async (tx) => {
      slug = current.slug;
      const notice = await tx.notice.update({
        where: { id },
        data: {
          title: parsed.data.title,
          category: parsed.data.category,
          content: { body: parsed.data.body },
          status: parsed.data.status,
          isImportant: parsed.data.isImportant,
          isPinned: parsed.data.isPinned,
          publishStartsAt: toDate(parsed.data.publishStartsAt),
          publishEndsAt: toDate(parsed.data.publishEndsAt),
          publishedAt: parsed.data.status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
        },
      });
      if (removeAttachments.length) {
        await tx.noticeAttachment.deleteMany({ where: { id: { in: removeAttachments.map((attachment) => attachment.id) } } });
        await tx.media.updateMany({ where: { id: { in: removeAttachments.map((attachment) => attachment.mediaId) } }, data: { deletedAt: new Date() } });
      }
      if (uploaded.length) {
        const mediaIds: string[] = [];
        for (const item of uploaded) {
          const media = await tx.media.create({ data: { bucket: PUBLIC_BUCKET, objectPath: item.objectPath, originalName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size, visibility: "PUBLIC" } });
          mediaIds.push(media.id);
        }
        const startOrder = Math.max(-1, ...current.attachments.filter((attachment) => !removeIds.has(attachment.id)).map((attachment) => attachment.sortOrder)) + 1;
        await tx.noticeAttachment.createMany({ data: mediaIds.map((mediaId, index) => ({ noticeId: id, mediaId, sortOrder: startOrder + index })) });
      }
      await tx.activityLog.create({
        data: {
          actorId: admin.id,
          action: "UPDATE",
          entityType: "Notice",
          entityId: notice.id,
          summary: `공지사항 '${notice.title}' 수정`,
          changes: { previousStatus: current.status, nextStatus: notice.status, addedAttachments: uploaded.length, removedAttachments: removeAttachments.length },
        },
      });
    });
    await removeStorageObjects(removeAttachments.map((attachment) => ({ bucket: attachment.media.bucket, objectPath: attachment.media.objectPath })));
  } catch (error) {
    console.error("Failed to update notice", error);
    await removeStorageObjects(uploaded.map((item) => ({ bucket: PUBLIC_BUCKET, objectPath: item.objectPath })));
    return { message: "공지사항을 수정하지 못했습니다." };
  }

  revalidateNoticePaths(slug);
  redirect(`/admin/notices/${id}/edit?saved=1`);
}

export async function deleteNoticeAction(id: string) {
  const admin = await requireAdmin();
  const prisma = getPrisma();
  let slug = "";

  await prisma.$transaction(async (tx) => {
    const notice = await tx.notice.update({ where: { id }, data: { deletedAt: new Date() } });
    slug = notice.slug;
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "DELETE",
        entityType: "Notice",
        entityId: notice.id,
        summary: `공지사항 '${notice.title}' 삭제`,
      },
    });
  });

  revalidateNoticePaths(slug);
  redirect("/admin/notices");
}
