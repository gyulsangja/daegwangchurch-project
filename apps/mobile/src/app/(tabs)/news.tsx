import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';
import { router } from 'expo-router';

export default function NewsHub() {
  return <AppScreen title="소식">
    <IntroCard title="함께하는 교회생활">교회의 소식과 함께 기도할 내용을 만나보세요.</IntroCard>
    <MenuCard title="우리 모임 소식" description="전도회·소속 소식과 관심 모임 알림" onPress={() => router.push('/groups')} />
    {[
      ['공지사항', '주요 공지와 교회 안내'], ['주보', '이번 주 주보와 지난 주보'],
      ['교회 행사', '다가오는 만남과 행사'], ['교회 일정', '공식 일정을 확인하세요.'],
      ['교회 공동기도', '교회와 이웃을 위해 함께 기도해요.'],
    ].map(([title, description]) => <MenuCard key={title} title={title} description={description} onPress={() => title === '공지사항' ? router.push('/notices') : title === '주보' ? router.push('/bulletins') : title === '교회 행사' ? router.push('/events') : title === '교회 일정' ? router.push('/church-calendar') : router.push('/prayers')} />)}
  </AppScreen>;
}
