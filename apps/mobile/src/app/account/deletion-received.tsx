import { router } from 'expo-router';
import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';

export default function DeletionReceived() {
  return <AppScreen title="탈퇴 요청 접수" onBack={() => router.replace('/')}>
    <IntroCard title="탈퇴 요청을 접수했습니다">로그아웃되었습니다. 개인 자료는 안내된 기준에 따라 삭제되며, 계정 삭제 처리가 이어집니다. 처리 중에는 개인 기록을 이용할 수 없습니다.</IntroCard>
    <MenuCard title="말씀과 교회 소식 계속 보기" description="공개 콘텐츠는 로그인 없이 이용할 수 있습니다." onPress={() => router.replace('/')} />
  </AppScreen>;
}
