import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, colors, styles } from '../../components/ui';
import { useBulletinList } from '../../hooks/use-bulletins';
import { noticeDate } from '../../hooks/use-notices';

export default function BulletinList() {
  const [page, setPage] = useState(0);
  const [month, setMonth] = useState('');
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [filterError, setFilterError] = useState('');
  const { data, loading, error, reload } = useBulletinList(page, month);
  return <AppScreen title="주보 목록" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}>
    <View style={{ gap: 6 }}><Text style={styles.caption}>연도 / 월</Text><Pressable accessibilityRole="button" accessibilityLabel="주보 연월 선택" onPress={() => setOpen(!open)} style={styles.input}><Text style={styles.title}>{month ? `${month.slice(0, 4)}년 ${Number(month.slice(5))}월` : '전체 기간'}</Text></Pressable></View>
    {open && <View style={styles.card}><TextInput accessibilityLabel="주보 조회 연월" value={draft} onChangeText={setDraft} placeholder="YYYY-MM · 비우면 전체" maxLength={7} style={styles.input} />
      {!!filterError && <Text accessibilityRole="alert" style={styles.caption}>{filterError}</Text>}
      <Action title="적용" onPress={() => { if (draft && !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(draft)) { setFilterError('2026-10처럼 입력해 주세요.'); return; } setMonth(draft); setPage(0); setOpen(false); setFilterError(''); }} /></View>}
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="주보를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      {!data.data.length && <Card title="등록된 주보가 없습니다">기간을 변경하거나 나중에 다시 확인해 주세요.</Card>}
      {data.data.map(item => <MenuCard key={item.id} title={item.title} description={`${noticeDate(item.worshipDate)} · PDF`} onPress={() => router.push({ pathname: '/bulletins/[id]', params: { id: item.id } })} />)}
      {data.nextPage !== null && <Action title="다음 주보" onPress={() => setPage(data.nextPage!)} />}
    </>}
    {!loading && page > 0 && <Action title="이전 주보" onPress={() => setPage(value => value - 1)} />}
  </AppScreen>;
}
