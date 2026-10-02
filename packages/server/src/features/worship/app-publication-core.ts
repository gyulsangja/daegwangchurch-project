import type { Prisma, PrismaClient, WorshipContent } from "@daegwang/database/generated/client";
import { appWorshipSnapshotSchema } from "@daegwang/contracts/features/worship/app-contract";
import type { WorshipActor } from "@daegwang/server/features/worship/service-core";

export class PublicationError extends Error {
  constructor(public code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT") { super(code); }
}

function snapshot(content: WorshipContent) {
  return appWorshipSnapshotSchema.parse({
    type: content.type, title: content.title, contentDate: content.contentDate.toISOString().slice(0, 10),
    youtube: { videoId: content.youtubeVideoId, url: content.youtubeUrl, thumbnailUrl: content.thumbnailUrl },
    preacher: content.preacher, sermonTitle: content.sermonTitle, scriptureReference: content.scripture,
    description: content.description, summary: content.summary,
  });
}

export function createAppPublicationService(database: Pick<PrismaClient, "$transaction">, now = () => new Date()) {
  async function authorizedContent(tx: Prisma.TransactionClient, actor: WorshipActor, id: string, expectedUpdatedAt: string) {
    const admin = await tx.adminProfile.findUnique({ where: { id: actor.adminId } });
    if (!admin?.isActive) throw new PublicationError("FORBIDDEN");
    // Serialize publish/unpublish and content updates for this content only.
    await tx.$queryRaw`SELECT id FROM worship_contents WHERE id = ${id} FOR UPDATE`;
    const content = await tx.worshipContent.findFirst({ where: { id, deletedAt: null } });
    if (!content) throw new PublicationError("NOT_FOUND");
    if (content.updatedAt.toISOString() !== expectedUpdatedAt) throw new PublicationError("CONFLICT");
    return content;
  }

  return {
    publish(actor: WorshipActor, id: string, expectedUpdatedAt: string) {
      return database.$transaction(async (tx) => {
        const content = await authorizedContent(tx, actor, id, expectedUpdatedAt);
        const current = await tx.worshipPublication.findUnique({ where: { worshipContentId_channel: { worshipContentId: id, channel: "APP" } } });
        // Repeated submits of the same saved revision are idempotent.
        if (current?.sourceUpdatedAt.getTime() === content.updatedAt.getTime()) return current;
        const latest = await tx.worshipRevision.findFirst({ where: { worshipContentId: id }, orderBy: { revisionNo: "desc" } });
        const revision = await tx.worshipRevision.create({ data: {
          worshipContentId: id, revisionNo: (latest?.revisionNo ?? 0) + 1,
          type: content.type, payload: snapshot(content),
        } });
        const publication = await tx.worshipPublication.upsert({
          where: { worshipContentId_channel: { worshipContentId: id, channel: "APP" } },
          create: { worshipContentId: id, channel: "APP", publishedRevisionId: revision.id, sourceUpdatedAt: content.updatedAt, startsAt: now() },
          update: { publishedRevisionId: revision.id, sourceUpdatedAt: content.updatedAt, startsAt: now(), endsAt: null },
        });
        await tx.activityLog.create({ data: { actorId: actor.adminId, action: "PUBLISH", entityType: "WorshipContent", entityId: id, summary: "말씀 앱 발행", changes: { channel: "APP", revisionNo: revision.revisionNo } } });
        return publication;
      });
    },
    unpublish(actor: WorshipActor, id: string, expectedUpdatedAt: string) {
      return database.$transaction(async (tx) => {
        await authorizedContent(tx, actor, id, expectedUpdatedAt);
        const result = await tx.worshipPublication.deleteMany({ where: { worshipContentId: id, channel: "APP" } });
        if (result.count) await tx.activityLog.create({ data: { actorId: actor.adminId, action: "UNPUBLISH", entityType: "WorshipContent", entityId: id, summary: "말씀 앱 발행 중단", changes: { channel: "APP" } } });
      });
    },
  };
}
