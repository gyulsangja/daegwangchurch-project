import { MonthPicker } from '../../components/date-picker';
import { WorshipSkeleton } from '../../components/worship-skeleton';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { worshipClient, cachedWorshipPage, type WorshipPage } from '../../lib/api';
import { VideoThumbnail } from '../../components/video-thumbnail';
import { Action, Card, Failure, styles } from '../../components/ui';

export default function DevotionalList() {
  const [page, setPage] = useState<WorshipPage>(() => cachedWorshipPage() ?? { data: [], nextCursor: null });
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false); const loadedMonth = useRef(month);
  const load = useCallback(async (cursor?: string, force = false) => {
    if (cursor && busy.current) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const token = ++generation.current; busy.current = true;
    setLoading(true); setError('');
    if (loadedMonth.current !== month) { setPage(cachedWorshipPage({ month }) ?? { data: [], nextCursor: null }); loadedMonth.current = month; }
    try {
      const result = await worshipClient.list({ month, cursor, signal: controller.signal }, force);
      if (token !== generation.current || controller.signal.aborted) return;
      setPage((previous) => ({ data: cursor ? [...previous.data, ...result.data.filter((row) => !previous.data.some((old) => old.id === row.id))] : result.data, nextCursor: result.nextCursor }));
    } catch (cause) { if (!controller.signal.aborted && token === generation.current) setError(cause instanceof Error ? cause.message : '말씀을 불러오지 못했습니다.'); }
    finally { if (token === generation.current) { busy.current = false; setLoading(false); } }
  }, [month]);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current?.abort(); generation.current++; busy.current = false; }; }, [load]));
  return <SafeAreaView edges={['bottom']} style={styles.page}><FlatList data={page.data} keyExtractor={(item) => item.id}
    contentContainerStyle={styles.body} refreshing={loading && page.data.length === 0} onRefresh={() => void load(undefined, true)}
    ListHeaderComponent={<MonthPicker label="묵상 조회 연월" value={month} onChange={setMonth} />}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.contentDate} ${item.title} 상세 보기`} onPress={() => router.push({ pathname: '/devotional/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}><VideoThumbnail videoId={item.youtube.videoId} /><Text style={styles.title}>{Number(item.contentDate.slice(5, 7))}월 {Number(item.contentDate.slice(8))}일 · {item.title} ›</Text>{item.scriptureReference && <Text style={styles.caption}>{item.scriptureReference}</Text>}</Pressable>}
    ListEmptyComponent={!loading && !error ? <Card title="등록된 묵상이 없습니다">새로운 말씀이 공개되면 이곳에서 확인할 수 있습니다.</Card> : null}
    ListFooterComponent={<View style={{ gap: 14 }}>{loading && page.data.length === 0 && <WorshipSkeleton card />}{!!error && <Failure message={error} retry={() => void load(page.nextCursor ?? undefined)} />}{!loading && !error && page.nextCursor && <Action title="더 보기" onPress={() => void load(page.nextCursor!)} />}</View>} /></SafeAreaView>;
}
