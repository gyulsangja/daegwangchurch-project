import { useCallback } from 'react';
import { ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { worshipTypeLabels } from '@daegwang/contracts/features/worship/app-contract';
import { worshipClient } from '../../lib/api';
import { useNoticeResource } from '../../hooks/use-notices';
import { AppScreen, MenuCard, useFeatureNotice } from '../../components/app-screen';
import { Card, Failure, colors } from '../../components/ui';
import { Video } from '../../components/video';
import { BookmarkButton } from '../../components/bookmark-button';
export default function SermonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useNoticeResource(useCallback(signal => worshipClient.detail(typeof id === 'string' ? id : '', signal), [id]));
  const notice = useFeatureNotice();
  return <AppScreen title="설교 상세" onBack={() => router.canGoBack() ? router.back() : router.replace('/sermons')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="말씀을 불러오는 중" />}{!!error && <Failure message={error} retry={reload} />}
    {data && <><Video videoId={data.youtube.videoId} /><Card title={data.title}>{[worshipTypeLabels[data.type], data.preacher, data.contentDate].filter(Boolean).join(' · ')}</Card>
      <MenuCard title="YouTube에서 보기" description="유튜브 앱 또는 웹으로 열기" onPress={() => { void Linking.openURL(`https://www.youtube.com/watch?v=${data.youtube.videoId}`).catch(() => notice('영상을 열지 못했습니다', '연결 상태를 확인하고 다시 시도해 주세요.')); }} />
      <BookmarkButton worshipId={data.id} type={data.type} />
      <Card title="본문 위치">{data.scriptureReference || '등록된 성경 위치가 없습니다.'}</Card><Card title="설교 소개">{[data.description, data.summary].filter(Boolean).join('\n\n') || '등록된 설교 안내가 없습니다.'}</Card>
    </>}<MenuCard title="다른 말씀 보기" onPress={() => router.replace('/sermons')} />
  </AppScreen>;
}
