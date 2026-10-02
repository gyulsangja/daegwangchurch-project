import { AppPublicationPanel } from "./app-publication-panel";
import { isAppPublicationEnabled } from "@daegwang/server/features/worship/app-server";
import { getPrisma } from "@daegwang/database/prisma";

export async function AppPublicationSection({ id, updatedAt }: { id: string; updatedAt: Date }) {
  if (!isAppPublicationEnabled()) return null;
  const publication = await getPrisma().worshipPublication.findUnique({
    where: { worshipContentId_channel: { worshipContentId: id, channel: "APP" } },
    select: { sourceUpdatedAt: true, publishedRevision: { select: { revisionNo: true } } },
  });
  return <AppPublicationPanel id={id} updatedAt={updatedAt.toISOString()}
    version={publication?.publishedRevision.revisionNo ?? null}
    hasChanges={!!publication && publication.sourceUpdatedAt.getTime() !== updatedAt.getTime()} />;
}
