"use server";

import { revalidatePath } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { getUnreferencedMediaWhere } from "@daegwang/server/features/media/queries";
import { requireSuperAdmin } from "../../lib/auth/permissions";
import { getPrisma } from "@daegwang/database/prisma";
import { createClient } from "../../lib/supabase/server";

export async function cleanupUnreferencedMediaAction() {
  const admin = await requireSuperAdmin();
  const prisma = getPrisma();
  const where = getUnreferencedMediaWhere();

  const candidates = await prisma.media.findMany({
    where,
    select: { id: true, bucket: true, objectPath: true, sizeBytes: true },
  });

  if (!candidates.length) redirect("/admin/media?cleaned=0");

  const supabase = await createClient();
  const buckets = new Map<string, typeof candidates>();
  for (const item of candidates) {
    const items = buckets.get(item.bucket) ?? [];
    items.push(item);
    buckets.set(item.bucket, items);
  }

  let storageFailures = 0;
  const removableIds: string[] = [];
  for (const [bucket, items] of buckets) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(items.map((item) => item.objectPath));
    if (error) {
      storageFailures += items.length;
      console.error(`Failed to remove media from ${bucket}`, error);
    } else {
      removableIds.push(...items.map((item) => item.id));
    }
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const result = await tx.media.deleteMany({
      where: { AND: [where, { id: { in: removableIds } }] },
    });
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "DELETE",
        entityType: "Media",
        summary: `미사용 미디어 레코드 정리: ${result.count}건`,
        changes: {
          count: result.count,
          sizeBytes: candidates
            .filter((item) => removableIds.includes(item.id))
            .reduce((sum, item) => sum + item.sizeBytes, 0),
          storageFailures,
        },
      },
    });
    return result;
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/media?cleaned=${deleted.count}&storageFailures=${storageFailures}`);
}
