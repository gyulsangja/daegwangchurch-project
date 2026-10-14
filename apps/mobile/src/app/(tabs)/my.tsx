import { router } from 'expo-router';
import { AppScreen, IntroCard, MenuCard, useFeatureNotice } from '../../components/app-screen';
import { Action } from '../../components/ui';
import { useMemberSession } from '../../components/member-session';
import { useMemberOptions } from '../../hooks/use-member-options';

export default function MyGuest() {
  const options = useMemberOptions();
  const notice = useFeatureNotice();
  const { session, signOut } = useMemberSession();
  if (session) return <AppScreen title="나의 기록">
    <IntroCard title="나의 신앙생활">묵상과 개인 기도는 나만 볼 수 있어요.</IntroCard>
    <MenuCard title="말씀 · 묵상 · 기도 캘린더" description="하루의 말씀과 나의 기록을 한곳에서" onPress={() => router.push('/records')} />
    <MenuCard title="이어가는 기도제목" description="제목별로 모아 보는 기도 · 응답과 감사" onPress={() => router.push({ pathname: '/records', params: { kind: 'SPECIAL_PRAYER' } })} />
    <MenuCard title="저장한 말씀" onPress={() => router.push('/saved-worship')} />
    <MenuCard title="나의 일정" onPress={() => router.push('/schedules')} />
    <MenuCard title="내 상담·심방 요청" onPress={() => router.push('/care/requests')} />
    <MenuCard title="알림 설정" onPress={() => router.push('/notifications/settings')} />
    <MenuCard title="우리 모임 소식" description="관심 모임 선택 · 확인된 소속 안내" onPress={() => router.push('/groups')} />
    {options.data?.churchMembership && <MenuCard title="교인 확인 및 소속" description="교인 확인 요청 · 승인 상태와 소속 보기" onPress={() => router.push('/account/church')} />}
    <MenuCard title="계정관리" onPress={() => router.push('/account')} />
    <MenuCard title="앱 이용 안내" description="처음 이용하는 분을 위한 도움말" onPress={() => router.push('/help')} />
    <Action title="로그아웃" onPress={() => { void signOut().catch(cause => notice('로그아웃 안내', cause.message)); }} />
  </AppScreen>;
  return <AppScreen title="나의 기록">
    <IntroCard title="나의 신앙생활 기록">로그인하면 묵상과 기도를 나만의 기록으로 남길 수 있어요.</IntroCard>
    <Action title="로그인" onPress={() => router.push('/login')} />
    <MenuCard title="회원가입" onPress={() => router.push('/signup')} />
    <MenuCard title="첫시간 주님께 먼저 보기" description="로그인 없이 볼 수 있어요." onPress={() => router.push('/devotional')} />
    <MenuCard title="앱 이용 안내" onPress={() => router.push('/help')} />
  </AppScreen>;
}
