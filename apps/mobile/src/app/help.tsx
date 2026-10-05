import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../components/app-screen';
import { Card } from '../components/ui';
export default function Help() {
  return <AppScreen title="앱 이용 안내" onBack={() => router.canGoBack() ? router.back() : router.replace('/my')}>
    <Card title="처음 오셨나요?">말씀과 교회 소식은 로그인 없이 볼 수 있어요. 나의 기록을 남기거나 요청할 때 로그인해 주세요.</Card>
    <MenuCard title="잠시 기도하기부터 시작" description="글을 쓰거나 가입하지 않아도 됩니다. 안내를 따라 마음으로 기도해 보세요." onPress={() => router.push('/quiet-prayer')} />
    <Card title="매일 꼭 하지 않아도 괜찮아요">놓친 날을 채울 필요 없이 오늘 마음이 갈 때 시작해 주세요. 짧게 말씀을 듣거나 한 문장만 남겨도 좋습니다.</Card>
    <MenuCard title="첫시간 주님께 보기" description="말씀을 보고 마음에 남은 내용을 묵상으로 남겨요." onPress={() => router.push('/devotional')} />
    <Card title="나의 묵상과 기도">개인 기록은 관리자 화면에 공유되지 않아요. 묵상 달력에서 지난 기록을 찾아보고, 마음에 남은 묵상을 기도로 이어가세요.</Card>
    <MenuCard title="나의 묵상 찾기" onPress={() => router.push({ pathname: '/records', params: { kind: 'REFLECTION' } })} />
    <Card title="말씀 저장과 시청 기록">다시 보고 싶은 말씀은 상세 화면에서 저장하세요. 영상 재생 여부가 자동으로 시청 완료나 묵상 작성으로 표시되지는 않아요.</Card>
    <MenuCard title="교회 일정 보기" description="교회 행사를 확인하고 내 일정에 모아 보세요. 일정 저장은 행사 참가 신청이 아니에요." onPress={() => router.push('/church-calendar')} />
    <Card title="상담·심방 요청">상담·심방은 개인 기도와 별개의 요청이에요. 전달 안내를 확인하고 필요한 정보만 적어 주세요. 요청 접수는 예약 확정이 아니에요.</Card>
    <MenuCard title="교회에 연락하기" description="앱 이용이 어렵거나 전화로 문의하고 싶을 때" onPress={() => router.push('/church-info/contact')} />
    <Card title="작성 중 잠시 로그인이 풀렸다면">다시 로그인하고 이어쓰기를 선택하세요. 같은 계정의 묵상·기도·일정·상담 초안은 앱이 열린 동안 최대 30분간 보관해요. 앱 종료·새로고침·로그아웃 시 초안은 사라져요.</Card>
    <Card title="글씨를 크게 보고 싶다면">휴대폰의 글자 크기 설정을 사용해 주세요. 내용이 길면 화면을 아래로 내려 끝까지 확인할 수 있어요.</Card>
  </AppScreen>;
}
