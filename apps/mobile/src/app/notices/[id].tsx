import {DataLoading} from '../../components/data-loading';
import { NoticeAttachment } from '../../components/notice-attachment';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Card, Failure, styles } from '../../components/ui';
import { noticeDate, useNotice } from '../../hooks/use-notices';

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useNotice(typeof id === 'string' ? id : '');
  return <AppScreen title="공지 상세" onBack={() => router.canGoBack() ? router.back() : router.replace('/notices')}>
    {loading && <DataLoading label="공지를 불러오는 중"/>}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      <Card title={data.title}>등록 {noticeDate(data.publishedAt)} · 수정 {noticeDate(data.updatedAt)}</Card>
      <View style={styles.card}><Text style={styles.title}>공지 내용</Text><Text selectable style={styles.caption}>{data.body || '등록된 본문이 없습니다.'}</Text></View>
      <View style={styles.card}>
        <Text style={styles.title}>첨부파일</Text>
        {!data.attachments.length && <Text style={styles.caption}>첨부파일이 없습니다.</Text>}
        {data.attachments.map(file => <NoticeAttachment key={file.id} file={file} />)}
      </View>
    </>}
    <MenuCard title="공지 목록" onPress={() => router.replace('/notices')} />
  </AppScreen>;
}
