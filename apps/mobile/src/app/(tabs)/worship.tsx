import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Failure } from '../../components/ui';
import { koreaDate, useLatestDevotional } from '../../hooks/use-latest-devotional';

export default function WorshipHub() {
  const { item, loading, error, reload } = useLatestDevotional();
  return <AppScreen title="말씀">
    <MenuCard title="첫시간 주님께" description="말씀 듣기 → 마음에 남기기 → 기도하기. 기록은 선택이에요." onPress={() => router.push('/devotional')} />
    <Action title={loading ? '말씀을 불러오는 중' : item ? `${item.contentDate === koreaDate() ? '오늘의' : '최근'} 묵상 시작하기` : '묵상 목록 보기'} disabled={loading}
      onPress={() => item ? router.push({ pathname: '/devotional/[id]', params: { id: item.id } }) : router.push('/devotional')} />
    {!!error && <Failure message={error} retry={() => void reload()} />}
    <MenuCard title="영상 없이 잠시 기도하기" description="로그인 없이, 편한 속도로 마음을 모아요." onPress={() => router.push('/quiet-prayer')} />
    <MenuCard title="주일설교 · 특별말씀" description="YouTube로 말씀 다시 듣기" onPress={() => router.push('/sermons')} />
    <MenuCard title="말씀 검색" description="제목 · 성경 위치 · 설교자" onPress={() => router.push('/worship-search')} />
    <MenuCard title="나의 묵상 기록" description="내가 쓴 기록은 나의 기록에 모여 있어요." onPress={() => router.push({ pathname: '/records', params: { kind: 'REFLECTION' } })} />
    <MenuCard title="저장한 말씀" description="나의 기록에서 다시 만나보세요." onPress={() => router.push('/saved-worship')} />
  </AppScreen>;
}
