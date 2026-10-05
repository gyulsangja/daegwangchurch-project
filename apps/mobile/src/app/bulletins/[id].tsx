import { ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen, IntroCard, MenuCard, useFeatureNotice } from '../../components/app-screen';
import { Card, Failure, colors } from '../../components/ui';
import { BulletinDocument } from '../../components/bulletin-document';
import { useBulletin } from '../../hooks/use-bulletins';
import { noticeDate } from '../../hooks/use-notices';
export default function BulletinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useBulletin(typeof id === 'string' ? id : '');
  const notice = useFeatureNotice();
  return <AppScreen title="주보 상세" onBack={() => router.canGoBack() ? router.back() : router.replace('/bulletins')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="주보를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      <Card title={data.title}>{noticeDate(data.worshipDate)}{data.summary ? `\n${data.summary}` : ''}</Card>
      <BulletinDocument url={data.pdf.url} />
      <MenuCard title="원본 열기" description={`${data.pdf.name} · ${Math.max(1, Math.ceil(data.pdf.sizeBytes / 1024))} KB · 문서 뷰어에서 열기`} onPress={() => { void Linking.openURL(data.pdf.url).catch(() => notice('문서를 열지 못했습니다', '연결 상태를 확인하고 다시 시도해 주세요.')); }} />
      <IntroCard title="작은 글씨는 확대해 보세요">문서가 보이지 않으면 원본 열기를 이용하세요. 원문 형식과 기기에 따라 보기 방식이 달라집니다.</IntroCard>
    </>}
    <MenuCard title="주보 목록" onPress={() => router.replace('/bulletins')} />
  </AppScreen>;
}
