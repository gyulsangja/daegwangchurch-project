import { useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Image, Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { directionsUrl, emailUrl, telephoneUrl } from '@daegwang/contracts/features/church/links';
import { AppScreen, MenuCard, useFeatureNotice } from './app-screen';
import { Action, Card, Failure, colors, styles } from './ui';
import { useChurchContact, useChurchNewcomer, useChurchPastor } from '../hooks/use-church';

function ReadScreen({ title, loading, error, reload, children }: PropsWithChildren<{ title: string; loading: boolean; error: string; reload: () => void }>) {
  return <AppScreen title={title} onBack={() => router.canGoBack() ? router.back() : router.replace('/church')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="교회 안내를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}{children}
  </AppScreen>;
}
function useOpenChurchLink() {
  const notice = useFeatureNotice();
  return (url: string | null) => { if (url) void Linking.openURL(url).catch(() => notice('연결하지 못했습니다', '연결할 앱과 인터넷 상태를 확인해 주세요.')); };
}
const mediaStyle = { backgroundColor: colors.soft, minHeight: 230, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 10 };

export function PastorScreen() {
  const state = useChurchPastor(); const { data } = state;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return <ReadScreen title="담임목사" {...state}>{data && <>
    <View style={[styles.card, mediaStyle]}>{data.imageUrl && failedImage !== data.imageUrl
      ? <Image source={{ uri: data.imageUrl }} accessibilityLabel={`${data.name} 목회자 사진`} resizeMode="contain" style={{ width: '100%', height: 230 }} onError={() => setFailedImage(data.imageUrl)} />
      : <><Text style={styles.title}>목회자 사진</Text><Text style={styles.caption}>{data.imageUrl ? '사진을 불러오지 못했습니다.' : '등록된 공개 사진이 없습니다.'}</Text></>}</View>
    <Card title={`${data.name} · ${data.position}`}>{[data.introduction, data.quote, ...data.career].filter(Boolean).join('\n\n') || '소개 자료를 준비하고 있습니다.'}</Card>
  </>}</ReadScreen>;
}
export function NewcomerScreen() {
  const state = useChurchNewcomer(); const content = state.data?.content;
  return <ReadScreen title="새가족안내" {...state}>{content && <>
    <Card title={content.heroTitle || state.data!.title}>{content.heroDescription || '등록된 환영 안내가 없습니다.'}</Card>
    <MenuCard title="1. 예배 참석" description="예배 시간과 장소 확인" onPress={() => router.push('/church-info/schedules')} />
    <Card title="2. 안내받기">{[content.processTitle, content.duration, content.location, content.leader, content.applicationInfo, ...content.steps.map(step => `${step.title}\n${step.description}`)].filter(Boolean).join('\n\n') || '등록된 안내 절차가 없습니다.'}</Card>
    <MenuCard title="3. 문의하기" description="교회 대표 연락처 확인" onPress={() => router.push('/church-info/contact')} />
  </>}</ReadScreen>;
}
export function LocationScreen() {
  const state = useChurchContact(); const { data } = state; const open = useOpenChurchLink();
  const url = data ? directionsUrl(data) : null;
  return <ReadScreen title="오시는 길" {...state}>{data && <>
    <View style={[styles.card, mediaStyle]}><Text style={styles.title}>교회 위치</Text><Text style={[styles.caption, { textAlign: 'center' }]}>{url ? '아래 길찾기 버튼으로\n지도 앱 또는 브라우저에서 확인하세요.' : '등록된 위치 정보가 없습니다.'}</Text></View>
    <View style={styles.card}><Text style={styles.title}>교회 주소</Text><Text selectable style={styles.caption}>{[data.address, data.addressDetail].filter(Boolean).join('\n') || '등록된 주소가 없습니다.'}</Text>{!!data.address && <Text style={styles.caption}>주소를 길게 누르거나 선택해 복사할 수 있어요.</Text>}</View>
    <Action title="지도 앱에서 길찾기" disabled={!url} onPress={() => open(url)} />
    <Card title="교통 / 주차 안내">{[data.transitInfo, data.parkingInfo].filter(Boolean).join('\n\n') || '등록된 교통·주차 안내가 없습니다.'}</Card>
    <MenuCard title="연락처" onPress={() => router.push('/church-info/contact')} />
  </>}</ReadScreen>;
}
export function ContactScreen() {
  const state = useChurchContact(); const { data } = state; const open = useOpenChurchLink();
  const phone = data ? telephoneUrl(data.phone) : null; const email = data ? emailUrl(data.email) : null;
  return <ReadScreen title="연락처" {...state}>{data && <>
    <Card title="교회 대표 연락처">{data.phone || '등록된 전화번호가 없습니다.'}</Card>
    <Action title="전화하기" disabled={!phone} onPress={() => open(phone)} />
    {email ? <MenuCard title="이메일" description={data.email} onPress={() => open(email)} /> : <Card title="이메일">{data.email || '등록된 이메일이 없습니다.'}</Card>}
    {data.websiteUrl ? <MenuCard title="교회 홈페이지" description={data.websiteUrl} onPress={() => open(data.websiteUrl)} /> : <Card title="교회 홈페이지">등록된 홈페이지 주소가 없습니다.</Card>}
  </>}</ReadScreen>;
}
