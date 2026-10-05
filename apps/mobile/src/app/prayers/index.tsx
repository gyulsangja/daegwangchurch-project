import { useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { createNoticeClient } from '@daegwang/api-client/notices';
import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure } from '../../components/ui';
import { usePagedResource } from '../../hooks/use-paged-resource';
import { noticeDate } from '../../hooks/use-notices';
const client = createNoticeClient(process.env.EXPO_PUBLIC_API_BASE_URL, fetch, 'prayers');
export default function Prayers() {
  const { data, loading, error, reload, more } = usePagedResource(useCallback((page, signal) => client.list(page, signal), []));
  return <AppScreen title="교회 공동기도" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}>
    <IntroCard title="함께 드리는 기도">교회가 안내하는 공동기도입니다.</IntroCard>
    {loading && <ActivityIndicator accessibilityLabel="공동기도를 불러오는 중" />}
    {!!error && <Failure message={error} retry={data ? more : reload} />}
    {data && !data.data.length && <Card title="등록된 공동기도가 없습니다">공개된 공동기도를 이곳에서 확인할 수 있어요.</Card>}
    {data?.data.map(item => <MenuCard key={item.id} title={item.title} description={`교회 작성 · ${noticeDate(item.publishedAt)}`} onPress={() => router.push({ pathname: '/prayers/[id]', params: { id: item.id } })} />)}
    {data?.nextPage != null && <Action title="공동기도 더 보기" disabled={loading} onPress={more} />}
  </AppScreen>;
}
