"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseBulletinFormData } from "@/features/bulletins/schema";
import { requireAdmin } from "@/lib/auth/permissions";
import { getPrisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export type BulletinActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

const PUBLIC_BUCKET = "public-assets";
const MAX_PDF_SIZE = 10 * 1024 * 1024;

function buildSlug(worshipDate: string) {
  return `bulletin-${worshipDate}-${Date.now().toString(36)}`;
}

function getPdfFile(formData: FormData) {
  const value = formData.get("pdfFile");
  return value instanceof File && value.size > 0 ? value : null;
}

function validatePdf(file: File | null, required: boolean): string | null {
  if (!file) return required ? "PDF 파일을 선택해 주세요." : null;
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return "PDF 파일만 업로드할 수 있습니다.";
  if (file.size > MAX_PDF_SIZE) return "PDF 파일은 10MB 이하만 업로드할 수 있습니다.";
  return null;
}

function parseInput(formData: FormData):
  | { success: true; data: ReturnType<typeof parseBulletinFormData>["data"] & object }
  | { success: false; state: BulletinActionState } {
  const result = parseBulletinFormData(formData);
  if (!result.success) return { success: false, state: { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors } };
  return { success: true, data: result.data };
}

async function uploadPdf(file: File, worshipDate: string) {
  const supabase = await createClient();
  const year = worshipDate.slice(0, 4);
  const objectPath = `bulletins/${year}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(objectPath, file, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`STORAGE_UPLOAD: ${error.message}`);
  return { objectPath, supabase };
}

function revalidateBulletinPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/bulletins");
  revalidatePath("/news/bulletins");
  if (slug) revalidatePath(`/news/bulletins/${slug}`);
}

export async function createBulletinAction(
  _previousState: BulletinActionState,
  formData: FormData,
): Promise<BulletinActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const file = getPdfFile(formData);
  const fileError = validatePdf(file, true);
  if (fileError || !file) return { message: fileError ?? "PDF 파일을 확인해 주세요.", errors: { pdfFile: [fileError ?? "PDF 파일을 확인해 주세요."] } };

  let uploadedPath = "";
  let createdId = "";
  try {
    const upload = await uploadPdf(file, parsed.data.worshipDate);
    uploadedPath = upload.objectPath;
    const prisma = getPrisma();
    await prisma.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: {
          bucket: PUBLIC_BUCKET,
          objectPath: uploadedPath,
          originalName: file.name,
          mimeType: "application/pdf",
          sizeBytes: file.size,
          visibility: "PUBLIC",
        },
      });
      const bulletin = await tx.bulletin.create({
        data: {
          title: parsed.data.title,
          slug: buildSlug(parsed.data.worshipDate),
          worshipDate: new Date(`${parsed.data.worshipDate}T00:00:00.000Z`),
          summary: parsed.data.summary,
          pdfMediaId: media.id,
          status: parsed.data.status,
          publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
        },
      });
      createdId = bulletin.id;
      await tx.activityLog.create({
        data: { actorId: admin.id, action: "CREATE", entityType: "Bulletin", entityId: bulletin.id, summary: `주보 '${bulletin.title}' 등록` },
      });
    });
  } catch (error) {
    console.error("Failed to create bulletin", error);
    if (uploadedPath) {
      const supabase = await createClient();
      await supabase.storage.from(PUBLIC_BUCKET).remove([uploadedPath]);
    }
    return { message: "주보를 저장하지 못했습니다. Storage 버킷과 관리자 업로드 정책을 확인해 주세요." };
  }

  revalidateBulletinPaths();
  redirect(`/admin/bulletins/${createdId}/edit?saved=1`);
}

export async function updateBulletinAction(
  id: string,
  _previousState: BulletinActionState,
  formData: FormData,
): Promise<BulletinActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  const file = getPdfFile(formData);
  const fileError = validatePdf(file, false);
  if (fileError) return { message: fileError, errors: { pdfFile: [fileError] } };

  const prisma = getPrisma();
  const current = await prisma.bulletin.findFirst({ where: { id, deletedAt: null }, include: { pdfMedia: true } });
  if (!current) return { message: "수정할 주보를 찾지 못했습니다." };

  let uploadedPath = "";
  let newMediaId: string | undefined;
  try {
    if (file) {
      const upload = await uploadPdf(file, parsed.data.worshipDate);
      uploadedPath = upload.objectPath;
    }

    await prisma.$transaction(async (tx) => {
      if (file && uploadedPath) {
        const media = await tx.media.create({
          data: { bucket: PUBLIC_BUCKET, objectPath: uploadedPath, originalName: file.name, mimeType: "application/pdf", sizeBytes: file.size, visibility: "PUBLIC" },
        });
        newMediaId = media.id;
      }
      const bulletin = await tx.bulletin.update({
        where: { id },
        data: {
          title: parsed.data.title,
          worshipDate: new Date(`${parsed.data.worshipDate}T00:00:00.000Z`),
          summary: parsed.data.summary,
          ...(newMediaId ? { pdfMediaId: newMediaId } : {}),
          status: parsed.data.status,
          publishedAt: parsed.data.status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
        },
      });
      if (newMediaId) await tx.media.update({ where: { id: current.pdfMediaId }, data: { deletedAt: new Date() } });
      await tx.activityLog.create({
        data: { actorId: admin.id, action: "UPDATE", entityType: "Bulletin", entityId: bulletin.id, summary: `주보 '${bulletin.title}' 수정`, changes: { previousStatus: current.status, nextStatus: bulletin.status, replacedPdf: Boolean(newMediaId) } },
      });
    });

    if (newMediaId) {
      const supabase = await createClient();
      const { error } = await supabase.storage.from(current.pdfMedia.bucket).remove([current.pdfMedia.objectPath]);
      if (error) console.error("Failed to remove replaced bulletin PDF", error);
    }
  } catch (error) {
    console.error("Failed to update bulletin", error);
    if (uploadedPath) {
      const supabase = await createClient();
      await supabase.storage.from(PUBLIC_BUCKET).remove([uploadedPath]);
    }
    return { message: "주보를 수정하지 못했습니다." };
  }

  revalidateBulletinPaths(current.slug);
  redirect(`/admin/bulletins/${id}/edit?saved=1`);
}

export async function deleteBulletinAction(id: string) {
  const admin = await requireAdmin();
  const prisma = getPrisma();
  let slug = "";
  await prisma.$transaction(async (tx) => {
    const bulletin = await tx.bulletin.update({ where: { id }, data: { deletedAt: new Date() } });
    slug = bulletin.slug;
    await tx.activityLog.create({
      data: { actorId: admin.id, action: "DELETE", entityType: "Bulletin", entityId: bulletin.id, summary: `주보 '${bulletin.title}' 삭제` },
    });
  });
  revalidateBulletinPaths(slug);
  redirect("/admin/bulletins");
}
