import Alert from '@mui/material/Alert';
import { getPrisma } from '@daegwang/database/prisma';
import { isAppPublicationEnabled } from '@daegwang/server/features/worship/app-server';

export async function AppPublicationSection({ id, updatedAt }: { id: string; updatedAt: Date }) {
  const publication = await getPrisma().worshipPublication.findUnique({
    where: { worshipContentId_channel: { worshipContentId: id, channel: 'APP' } },
    select: { sourceUpdatedAt: true },
  });
  const content = await getPrisma().worshipContent.findUnique({ where: { id }, select: { status: true } });
  const needsSync = content?.status === 'PUBLISHED' && (!publication || publication.sourceUpdatedAt.getTime() !== updatedAt.getTime());
  return <Alert severity={needsSync ? 'warning' : 'info'} className="mt-6!">
    {needsSync ? '이전 방식으로 저장된 콘텐츠입니다. 위에서 한 번 저장하면 홈페이지와 앱에 같은 내용이 반영됩니다.' : '홈페이지와 앱은 위의 저장 버튼으로 함께 관리합니다. 앱용으로 다시 등록할 필요가 없습니다.'}
    {!isAppPublicationEnabled() && ' 현재 앱 콘텐츠 API는 비활성 상태입니다.'}
  </Alert>;
}
