import { useCallback } from 'react';
import { ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createNoticeClient } from '@daegwang/api-client/notices';
import { AppScreen, MenuCard, useFeatureNotice } from '../../components/app-screen';
import { Card, Failure } from '../../components/ui';
import { useNoticeResource, noticeDate } from '../../hooks/use-notices';
const client = createNoticeClient(process.env.EXPO_PUBLIC_API_BASE_URL, fetch, 'prayers');
export default function PrayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useNoticeResource(useCallback(signal => client.detail(id, signal), [id]));
  const notice = useFeatureNotice();
  return <AppScreen title="공동기도 상세" onBack={() => router.canGoBack() ? router.back() : router.replace('/prayers')}>
    {loading && <ActivityIndicator accessibilityLabel="공동기도를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      <Card title={data.title}>교회 작성 · {noticeDate(data.publishedAt)}</Card>
      <Card title="함께 드리는 기도">{data.body || '등록된 본문이 없습니다.'}</Card>
      {data.attachments.map(file => <MenuCard key={file.id} title={file.name} description="첨부파일 외부에서 열기" onPress={() => { void Linking.openURL(file.url).catch(() => notice('첨부파일을 열지 못했습니다')); }} />)}
      <MenuCard title="나의 기도로 기록하기" description="내 기록은 비공개로 작성돼요." onPress={() => router.push({ pathname: '/records/new', params: { kind: 'PRAYER' } })} />
    </>}
    <MenuCard title="다른 공동기도" onPress={() => router.replace('/prayers')} />
  </AppScreen>;
}
