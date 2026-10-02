import type { Prisma, PrismaClient } from "@daegwang/database/generated/client";
import { worshipFormSchema } from "@daegwang/contracts/features/worship/schema";
import { parseYouTubeUrl } from "@daegwang/contracts/lib/youtube/parser";

// The caller must obtain this ID from verified server-side authentication.
export type WorshipActor = { adminId: string };

export function createWorshipService(
  database: Pick<PrismaClient, "$transaction">,
  now: () => Date = () => new Date(),
) {
  async function requireActiveAdmin(tx: Prisma.TransactionClient, actor: WorshipActor) {
    const admin = await tx.adminProfile.findUnique({ where: { id: actor.adminId } });
    if (!admin?.isActive) throw new Error("FORBIDDEN");
    return admin;
  }

  function contentData(input: unknown) {
    const data = worshipFormSchema.parse(input);
    const youtube = parseYouTubeUrl(data.youtubeUrl);
    if (!youtube) throw new Error("INVALID_YOUTUBE_URL");
    return {
      ...data,
      preacher: data.preacher ?? null,
      sermonTitle: data.sermonTitle ?? null,
      scripture: data.scripture ?? null,
      description: data.description ?? null,
      summary: data.summary ?? null,
      slug: `${data.type.toLowerCase().replaceAll("_", "-")}-${data.contentDate}-${youtube.videoId}`,
      contentDate: new Date(`${data.contentDate}T00:00:00.000Z`),
      youtubeUrl: youtube.canonicalUrl,
      youtubeVideoId: youtube.videoId,
      thumbnailUrl: youtube.thumbnailUrl,
    };
  }

  return {
    async create(actor: WorshipActor, input: unknown) {
      const data = contentData(input);
      return database.$transaction(async (tx) => {
        const admin = await requireActiveAdmin(tx, actor);
        const content = await tx.worshipContent.create({
          data: { ...data, publishedAt: data.status === "PUBLISHED" ? now() : null },
        });
        await tx.activityLog.create({ data: {
          actorId: admin.id, action: "CREATE", entityType: "WorshipContent",
          entityId: content.id, summary: `예배 콘텐츠 '${content.title}' 등록`,
        } });
        return content;
      });
    },
    async update(actor: WorshipActor, id: string, input: unknown) {
      const data = contentData(input);
      return database.$transaction(async (tx) => {
        const admin = await requireActiveAdmin(tx, actor);
        const current = await tx.worshipContent.findFirst({ where: { id, deletedAt: null } });
        if (!current) throw new Error("NOT_FOUND");
        const content = await tx.worshipContent.update({
          where: { id },
          data: {
            ...data,
            publishedAt: data.status === "PUBLISHED" ? current.publishedAt ?? now() : null,
          },
        });
        await tx.activityLog.create({ data: {
          actorId: admin.id, action: "UPDATE", entityType: "WorshipContent",
          entityId: content.id, summary: `예배 콘텐츠 '${content.title}' 수정`,
          changes: { previousStatus: current.status, nextStatus: content.status },
        } });
        return content;
      });
    },
    async delete(actor: WorshipActor, id: string) {
      return database.$transaction(async (tx) => {
        const admin = await requireActiveAdmin(tx, actor);
        const content = await tx.worshipContent.update({
          where: { id }, data: { deletedAt: now() },
        });
        await tx.activityLog.create({ data: {
          actorId: admin.id, action: "DELETE", entityType: "WorshipContent",
          entityId: content.id, summary: `예배 콘텐츠 '${content.title}' 삭제`,
        } });
        return content;
      });
    },
  };
}
