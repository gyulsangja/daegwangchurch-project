import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { Linking, Pressable, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { worshipClient, type Worship } from '../../lib/api';
import { Action, Card, Failure, Loading, styles } from '../../components/ui';
import { Video } from '../../components/video';
import { BookmarkButton } from '../../components/bookmark-button';
import { FaithPractice } from '../../components/faith-practice';

export default function DevotionalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Worship | null>(null);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const [linkError, setLinkError] = useState('');
  const load = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller; setItem(null); setError(''); setLinkError('');
    void worshipClient.detail(id, controller.signal).then((result) => { if (!controller.signal.aborted) setItem(result); }).catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '말씀을 불러오지 못했습니다.'); });
  }, [id]);
  useFocusEffect(useCallback(() => { load(); return () => request.current?.abort(); }, [load]));
  const openVideo = async () => { try { await Linking.openURL(`https://www.youtube.com/watch?v=${item!.youtube.videoId}`); setLinkError(''); } catch { setLinkError('YouTube를 열지 못했습니다. 다시 시도해 주세요.'); } };
  return <SafeAreaView edges={['bottom']} style={styles.page}><ScrollView contentContainerStyle={styles.body}>
    {!item && !error && <Loading />}
    {!!error && <><Failure message={error} retry={load} /><Action title="목록으로" onPress={() => router.replace('/devotional')} /></>}
    {item && <><Video videoId={item.youtube.videoId} />
      <Card title={item.title}>첫시간 주님께 · {item.contentDate.replaceAll('-', '.')}</Card>
      <BookmarkButton worshipId={item.id} type={item.type} />
      <Pressable accessibilityRole="button" accessibilityLabel="YouTube에서 보기 ›" onPress={() => void openVideo()} style={styles.card}><Text style={styles.title}>YouTube에서 보기 ›</Text><Text style={styles.caption}>유튜브 앱 또는 웹으로 열기</Text></Pressable>
      {!!linkError && <Failure message={linkError} retry={() => void openVideo()} />}
      <Card title="본문 위치">{item.scriptureReference || '등록된 성경 위치가 없습니다.'}{'\n'}가지고 계신 성경으로 함께 읽어보세요.</Card>
      {!!(item.description || item.summary) && <Card title="오늘의 묵상 안내">{item.description || item.summary}</Card>}
      <Card title="기록하기 전에, 잠시 머물러요">말씀에서 마음에 남는 것을 떠올리고 기도로 이어가 보세요. 글을 쓰지 않아도 괜찮습니다.</Card>
      <FaithPractice key={item.id} worshipId={item.id} />
      <Action secondary title="묵상 기록하기" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'REFLECTION', worshipId: item.id } })} />
    </>}
  </ScrollView></SafeAreaView>;
}
