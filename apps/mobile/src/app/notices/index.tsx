import { useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, colors, styles } from '../../components/ui';
import { noticeDate, useNoticeList } from '../../hooks/use-notices';

export default function NoticeList() {
  const [page, setPage] = useState(0);
  const { data, loading, error, reload } = useNoticeList(page);
  return <AppScreen title="공지사항" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="공지를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      {!data.data.length && <Card title="등록된 공지가 없습니다">공개된 공지가 등록되면 여기에서 확인할 수 있어요.</Card>}
      {data.data.map(item => <MenuCard key={item.id} title={item.title}
        description={[item.isPinned ? '고정 공지' : '', item.isImportant ? '중요' : '', item.category, noticeDate(item.publishedAt), item.attachmentCount ? `첨부 ${item.attachmentCount}` : ''].filter(Boolean).join(' · ')}
        onPress={() => router.push({ pathname: '/notices/[id]', params: { id: item.id } })} />)}
      {(page > 0 || data.nextPage !== null) && <Text style={styles.caption}>{page + 1}페이지</Text>}
      {data.nextPage !== null && <Action title="다음 공지" onPress={() => setPage(data.nextPage!)} />}
    </>}
    {!loading && page > 0 && <Action title="이전 공지" onPress={() => setPage(value => value - 1)} />}
  </AppScreen>;
}
