"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseAlbumFormData } from "@/features/albums/schema";
import { requireAdmin } from "@/lib/auth/permissions";
import { getPrisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export type AlbumActionState = { message?: string; errors?: Record<string, string[]> };

const PUBLIC_BUCKET = "public-assets";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_COUNT = 30;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function buildSlug(title: string) {
  const base = title.normalize("NFKC").toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 70);
  return `${base || "album"}-${Date.now().toString(36)}`;
}

function getImageFiles(formData: FormData) {
  return formData.getAll("imageFiles").filter((value): value is File => value instanceof File && value.size > 0);
}

function validateImages(files: File[], required: boolean) {
  if (required && files.length === 0) return "사진을 한 장 이상 선택해 주세요.";
  if (files.length > MAX_IMAGE_COUNT) return `사진은 한 번에 최대 ${MAX_IMAGE_COUNT}장까지 업로드할 수 있습니다.`;
  if (files.some((file) => !allowedTypes.has(file.type))) return "JPG, PNG, WebP 이미지만 업로드할 수 있습니다.";
  if (files.some((file) => file.size > MAX_IMAGE_SIZE)) return "각 이미지는 5MB 이하만 업로드할 수 있습니다.";
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) return "한 번에 업로드하는 이미지 전체 용량은 10MB 이하여야 합니다.";
  return null;
}

function parseInput(formData: FormData):
  | { success: true; data: ReturnType<typeof parseAlbumFormData>["data"] & object }
  | { success: false; state: AlbumActionState } {
  const result = parseAlbumFormData(formData);
  if (!result.success) return { success: false, state: { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors } };
  return { success: true, data: result.data };
}

async function uploadImages(files: File[], eventDate: string) {
  const supabase = await createClient();
  const folder = `albums/${eventDate.slice(0, 4)}/${crypto.randomUUID()}`;
  const uploaded: Array<{ file: File; objectPath: string }> = [];
  try {
    for (const file of files) {
      const extension = allowedTypes.get(file.type)!;
      const objectPath = `${folder}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(objectPath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
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
    if (error) console.error("Failed to remove album images", error);
  }
}

function revalidateAlbumPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/albums");
  revalidatePath("/news/albums");
  if (slug) revalidatePath(`/news/albums/${slug}`);
}

export async function createAlbumAction(_state: AlbumActionState, formData: FormData): Promise<AlbumActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const files = getImageFiles(formData);
  const imageError = validateImages(files, true);
  if (imageError) return { message: imageError, errors: { imageFiles: [imageError] } };

  let uploaded: Awaited<ReturnType<typeof uploadImages>> = [];
  let createdId = "";
  try {
    uploaded = await uploadImages(files, parsed.data.eventDate);
    await getPrisma().$transaction(async (tx) => {
      const mediaIds: string[] = [];
      for (const item of uploaded) {
        const media = await tx.media.create({ data: { bucket: PUBLIC_BUCKET, objectPath: item.objectPath, originalName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size, visibility: "PUBLIC" } });
        mediaIds.push(media.id);
      }
      const album = await tx.album.create({
        data: {
          title: parsed.data.title,
          slug: buildSlug(parsed.data.title),
          eventDate: new Date(`${parsed.data.eventDate}T00:00:00.000Z`),
          category: parsed.data.category,
          description: parsed.data.description,
          coverImageId: mediaIds[0],
          status: parsed.data.status,
          showOnMain: parsed.data.showOnMain,
          publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
          images: { create: mediaIds.map((mediaId, index) => ({ mediaId, sortOrder: index })) },
        },
      });
      createdId = album.id;
      await tx.activityLog.create({ data: { actorId: admin.id, action: "CREATE", entityType: "Album", entityId: album.id, summary: `행사앨범 '${album.title}' 등록` } });
    });
  } catch (error) {
    console.error("Failed to create album", error);
    await removeStorageObjects(uploaded.map((item) => ({ bucket: PUBLIC_BUCKET, objectPath: item.objectPath })));
    return { message: "행사앨범을 저장하지 못했습니다. 이미지 형식과 Storage 정책을 확인해 주세요." };
  }
  revalidateAlbumPaths();
  redirect(`/admin/albums/${createdId}/edit?saved=1`);
}

export async function updateAlbumAction(id: string, _state: AlbumActionState, formData: FormData): Promise<AlbumActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const files = getImageFiles(formData);
  const imageError = validateImages(files, false);
  if (imageError) return { message: imageError, errors: { imageFiles: [imageError] } };

  const prisma = getPrisma();
  const current = await prisma.album.findFirst({ where: { id, deletedAt: null }, include: { images: { include: { media: true }, orderBy: { sortOrder: "asc" } } } });
  if (!current) return { message: "수정할 앨범을 찾지 못했습니다." };

  const removeIds = new Set(formData.getAll("removeImageIds").filter((value): value is string => typeof value === "string"));
  const removeImages = current.images.filter((image) => removeIds.has(image.id));
  const remainingImages = current.images.filter((image) => !removeIds.has(image.id));
  if (remainingImages.length + files.length === 0) return { message: "앨범에는 사진이 한 장 이상 필요합니다.", errors: { imageFiles: ["기존 사진을 남기거나 새 사진을 추가해 주세요."] } };
  if (remainingImages.length + files.length > MAX_IMAGE_COUNT) return { message: `앨범에는 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있습니다.` };

  let uploaded: Awaited<ReturnType<typeof uploadImages>> = [];
  try {
    if (files.length) uploaded = await uploadImages(files, parsed.data.eventDate);
    await prisma.$transaction(async (tx) => {
      const newMediaIds: string[] = [];
      for (const item of uploaded) {
        const media = await tx.media.create({ data: { bucket: PUBLIC_BUCKET, objectPath: item.objectPath, originalName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size, visibility: "PUBLIC" } });
        newMediaIds.push(media.id);
      }
      const requestedCover = formData.get("coverMediaId");
      const availableMediaIds = [...remainingImages.map((image) => image.mediaId), ...newMediaIds];
      const coverImageId = typeof requestedCover === "string" && availableMediaIds.includes(requestedCover)
        ? requestedCover
        : availableMediaIds.includes(current.coverImageId ?? "") ? current.coverImageId : availableMediaIds[0];

      await tx.album.update({
        where: { id },
        data: {
          title: parsed.data.title,
          eventDate: new Date(`${parsed.data.eventDate}T00:00:00.000Z`),
          category: parsed.data.category,
          description: parsed.data.description,
          coverImageId,
          status: parsed.data.status,
          showOnMain: parsed.data.showOnMain,
          publishedAt: parsed.data.status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
        },
      });
      if (removeImages.length) {
        await tx.albumImage.deleteMany({ where: { id: { in: removeImages.map((image) => image.id) } } });
        await tx.media.updateMany({ where: { id: { in: removeImages.map((image) => image.mediaId) } }, data: { deletedAt: new Date() } });
      }
      if (newMediaIds.length) {
        const startOrder = Math.max(-1, ...remainingImages.map((image) => image.sortOrder)) + 1;
        await tx.albumImage.createMany({ data: newMediaIds.map((mediaId, index) => ({ albumId: id, mediaId, sortOrder: startOrder + index })) });
      }
      for (const image of remainingImages) {
        const captionValue = formData.get(`caption_${image.id}`);
        const altValue = formData.get(`alt_${image.id}`);
        const caption = typeof captionValue === "string" ? captionValue.trim().slice(0, 300) || null : image.caption;
        const altText = typeof altValue === "string" ? altValue.trim().slice(0, 200) || null : image.media.altText;
        await tx.albumImage.update({ where: { id: image.id }, data: { caption } });
        await tx.media.update({ where: { id: image.mediaId }, data: { altText } });
      }
      await tx.activityLog.create({ data: { actorId: admin.id, action: "UPDATE", entityType: "Album", entityId: id, summary: `행사앨범 '${parsed.data.title}' 수정`, changes: { addedImages: newMediaIds.length, removedImages: removeImages.length } } });
    });
    await removeStorageObjects(removeImages.map((image) => ({ bucket: image.media.bucket, objectPath: image.media.objectPath })));
  } catch (error) {
    console.error("Failed to update album", error);
    await removeStorageObjects(uploaded.map((item) => ({ bucket: PUBLIC_BUCKET, objectPath: item.objectPath })));
    return { message: "행사앨범을 수정하지 못했습니다." };
  }
  revalidateAlbumPaths(current.slug);
  redirect(`/admin/albums/${id}/edit?saved=1`);
}

export async function deleteAlbumAction(id: string) {
  const admin = await requireAdmin();
  let slug = "";
  await getPrisma().$transaction(async (tx) => {
    const album = await tx.album.update({ where: { id }, data: { deletedAt: new Date() } });
    slug = album.slug;
    await tx.activityLog.create({ data: { actorId: admin.id, action: "DELETE", entityType: "Album", entityId: album.id, summary: `행사앨범 '${album.title}' 삭제` } });
  });
  revalidateAlbumPaths(slug);
  redirect("/admin/albums");
}
