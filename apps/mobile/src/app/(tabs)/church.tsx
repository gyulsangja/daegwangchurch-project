import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';
import { router } from 'expo-router';

export default function ChurchHub() {
  const routes = { '예배안내': '/church-info/schedules', '교회소개': '/church-info/about', '담임목사': '/church-info/pastor', '새가족안내': '/church-info/newcomer', '오시는 길 · 연락처': '/church-info/location' } as const;
  return <AppScreen title="교회">
    <IntroCard title="대광교회">교회를 알아보고, 필요한 도움을 요청하세요.</IntroCard>
    {[
      ['상담·심방 요청', '교역자와 이야기 나누고 싶을 때'], ['예배안내', '예배 시간과 장소'],
      ['교회소개', '대광교회를 소개합니다.'], ['담임목사'], ['새가족안내'], ['오시는 길 · 연락처'],
    ].map(([title, description]) => <MenuCard key={title} title={title} description={description} onPress={() => { const route = routes[title as keyof typeof routes]; if (route) router.push(route); else router.push('/care'); }} />)}
  </AppScreen>;
}
