"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { parsePersonFormData } from "@/features/people/schema";
import { requireAdmin } from "@/lib/auth/permissions";
import { getPrisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export type PersonActionState = { message?: string; errors?: Record<string, string[]> };

const PUBLIC_BUCKET = "public-assets";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

function getProfileFile(formData: FormData) {
  const value = formData.get("profileImage");
  return value instanceof File && value.size > 0 ? value : null;
}

function validateImage(file: File | null) {
  if (!file) return null;
  if (!allowedTypes.has(file.type)) return "JPG, PNG, WebP 이미지만 업로드할 수 있습니다.";
  if (file.size > MAX_IMAGE_SIZE) return "프로필 이미지는 5MB 이하만 업로드할 수 있습니다.";
  return null;
}

function parseInput(formData: FormData):
  | { success: true; data: ReturnType<typeof parsePersonFormData>["data"] & object }
  | { success: false; state: PersonActionState } {
  const result = parsePersonFormData(formData);
  if (!result.success) return { success: false, state: { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors } };
  return { success: true, data: result.data };
}

function careerData(value?: string) {
  return value ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : undefined;
}

async function uploadProfileImage(file: File) {
  const supabase = await createClient();
  const extension = allowedTypes.get(file.type)!;
  const objectPath = `people/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(objectPath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`STORAGE_UPLOAD: ${error.message}`);
  return objectPath;
}

async function removeProfileImage(bucket: string, objectPath: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([objectPath]);
  if (error) console.error("Failed to remove profile image", error);
}

function revalidatePeople() {
  revalidatePath("/admin/people");
  revalidatePath("/about/people");
}

export async function createPersonAction(_state: PersonActionState, formData: FormData): Promise<PersonActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const file = getProfileFile(formData);
  const imageError = validateImage(file);
  if (imageError) return { message: imageError, errors: { profileImage: [imageError] } };

  let objectPath = "";
  let createdId = "";
  try {
    if (file) objectPath = await uploadProfileImage(file);
    await getPrisma().$transaction(async (tx) => {
      let profileImageId: string | undefined;
      if (file && objectPath) {
        const media = await tx.media.create({ data: { bucket: PUBLIC_BUCKET, objectPath, originalName: file.name, mimeType: file.type, sizeBytes: file.size, altText: `${parsed.data.name} ${parsed.data.position}`, visibility: "PUBLIC" } });
        profileImageId = media.id;
      }
      const person = await tx.person.create({
        data: {
          name: parsed.data.name,
          position: parsed.data.position,
          ministry: parsed.data.ministry ?? null,
          introduction: parsed.data.introduction ?? null,
          career: careerData(parsed.data.careerText) ?? Prisma.JsonNull,
          profileImageId,
          quote: parsed.data.quote ?? null,
          isSeniorPastor: parsed.data.isSeniorPastor,
          isVisible: parsed.data.isVisible,
          sortOrder: parsed.data.sortOrder,
        },
      });
      createdId = person.id;
      await tx.activityLog.create({ data: { actorId: admin.id, action: "CREATE", entityType: "Person", entityId: person.id, summary: `교역자 '${person.name}' 등록` } });
    });
  } catch (error) {
    console.error("Failed to create person", error);
    if (objectPath) await removeProfileImage(PUBLIC_BUCKET, objectPath);
    return { message: "교역자 정보를 저장하지 못했습니다." };
  }
  revalidatePeople();
  redirect(`/admin/people/${createdId}/edit?saved=1`);
}

export async function updatePersonAction(id: string, _state: PersonActionState, formData: FormData): Promise<PersonActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const file = getProfileFile(formData);
  const imageError = validateImage(file);
  if (imageError) return { message: imageError, errors: { profileImage: [imageError] } };

  const prisma = getPrisma();
  const current = await prisma.person.findFirst({ where: { id, deletedAt: null }, include: { profileImage: true } });
  if (!current) return { message: "수정할 교역자를 찾지 못했습니다." };
  let objectPath = "";
  let replacedImage = false;
  try {
    if (file) objectPath = await uploadProfileImage(file);
    await prisma.$transaction(async (tx) => {
      let profileImageId = current.profileImageId;
      if (file && objectPath) {
        const media = await tx.media.create({ data: { bucket: PUBLIC_BUCKET, objectPath, originalName: file.name, mimeType: file.type, sizeBytes: file.size, altText: `${parsed.data.name} ${parsed.data.position}`, visibility: "PUBLIC" } });
        profileImageId = media.id;
        replacedImage = Boolean(current.profileImageId);
      } else if (parsed.data.removeProfileImage) {
        profileImageId = null;
        replacedImage = Boolean(current.profileImageId);
      }
      const person = await tx.person.update({
        where: { id },
        data: {
          name: parsed.data.name,
          position: parsed.data.position,
          ministry: parsed.data.ministry ?? null,
          introduction: parsed.data.introduction ?? null,
          career: careerData(parsed.data.careerText) ?? Prisma.JsonNull,
          profileImageId,
          quote: parsed.data.quote ?? null,
          isSeniorPastor: parsed.data.isSeniorPastor,
          isVisible: parsed.data.isVisible,
          sortOrder: parsed.data.sortOrder,
        },
      });
      if (replacedImage && current.profileImageId) await tx.media.update({ where: { id: current.profileImageId }, data: { deletedAt: new Date() } });
      await tx.activityLog.create({ data: { actorId: admin.id, action: "UPDATE", entityType: "Person", entityId: person.id, summary: `교역자 '${person.name}' 수정`, changes: { replacedImage } } });
    });
    if (replacedImage && current.profileImage) await removeProfileImage(current.profileImage.bucket, current.profileImage.objectPath);
  } catch (error) {
    console.error("Failed to update person", error);
    if (objectPath) await removeProfileImage(PUBLIC_BUCKET, objectPath);
    return { message: "교역자 정보를 수정하지 못했습니다." };
  }
  revalidatePeople();
  redirect(`/admin/people/${id}/edit?saved=1`);
}

export async function deletePersonAction(id: string) {
  const admin = await requireAdmin();
  await getPrisma().$transaction(async (tx) => {
    const person = await tx.person.update({ where: { id }, data: { deletedAt: new Date() } });
    await tx.activityLog.create({ data: { actorId: admin.id, action: "DELETE", entityType: "Person", entityId: person.id, summary: `교역자 '${person.name}' 삭제` } });
  });
  revalidatePeople();
  redirect("/admin/people");
}
