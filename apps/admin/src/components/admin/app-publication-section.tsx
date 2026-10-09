import Alert from '@mui/material/Alert';
import { getPrisma } from '@daegwang/database/prisma';

export async function AppPublicationSection({ id, updatedAt, status }: { id: string; updatedAt: Date; status: string }) {
  if (status !== 'PUBLISHED') return null;
  const publication = await getPrisma().worshipPublication.findUnique({
    where: { worshipContentId_channel: { worshipContentId: id, channel: 'APP' } },
    select: { sourceUpdatedAt: true },
  });
  const needsSync = !publication || publication.sourceUpdatedAt.getTime() !== updatedAt.getTime();
  if (!needsSync) return null;
  return <Alert severity="warning" className="mt-6!">이전 방식으로 저장된 말씀입니다. 아래에서 한 번 저장하면 홈페이지와 앱에 같은 내용이 반영됩니다.</Alert>;
}
