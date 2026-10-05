import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen, MenuCard, useFeatureNotice } from '../../components/app-screen';
import { Card, Failure, colors, styles } from '../../components/ui';
import { noticeDate, useNotice } from '../../hooks/use-notices';

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useNotice(typeof id === 'string' ? id : '');
  const notice = useFeatureNotice();
  return <AppScreen title="공지 상세" onBack={() => router.canGoBack() ? router.back() : router.replace('/notices')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="공지를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      <Card title={data.title}>등록 {noticeDate(data.publishedAt)} · 수정 {noticeDate(data.updatedAt)}</Card>
      <View style={styles.card}><Text style={styles.title}>공지 내용</Text><Text selectable style={styles.caption}>{data.body || '등록된 본문이 없습니다.'}</Text></View>
      <View style={styles.card}>
        <Text style={styles.title}>첨부파일</Text>
        {!data.attachments.length && <Text style={styles.caption}>첨부파일이 없습니다.</Text>}
        {data.attachments.map(file => <Pressable key={file.id} accessibilityRole="button" accessibilityLabel={file.name} style={{ minHeight: 48, justifyContent: 'center' }}
          onPress={() => { void Linking.openURL(file.url).catch(() => notice('첨부파일을 열지 못했습니다', '연결 상태를 확인하고 다시 시도해 주세요.')); }}>
          <Text style={styles.caption}>{file.name} · {file.mimeType} · {Math.max(1, Math.ceil(file.sizeBytes / 1024))} KB · 외부에서 열기 ›</Text>
        </Pressable>)}
      </View>
    </>}
    <MenuCard title="공지 목록" onPress={() => router.replace('/notices')} />
  </AppScreen>;
}
