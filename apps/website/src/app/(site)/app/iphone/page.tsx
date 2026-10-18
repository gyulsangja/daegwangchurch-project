import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@daegwang/web-ui/components/ui/button';
import { ContentShell } from '../../../../components/site/content-shell';

export const metadata: Metadata = { title: '아이폰 홈 화면 추가 안내', description: '아이폰 Safari에서 대광교회 홈페이지를 홈 화면에 추가하는 방법입니다.', alternates: { canonical: '/app/iphone' } };
export default function IphoneGuidePage() {
  return <ContentShell narrow>
    <Link href="/app" className="inline-flex min-h-11 items-center font-semibold text-primary-700 underline">← 휴대폰 이용 안내</Link>
    <p className="church-eyebrow mt-5">iPhone · 홈페이지 바로가기</p><h1 className="mt-3 text-3xl font-bold leading-snug">홈 화면에서<br />대광교회를 바로 여세요</h1>
    <p className="mt-4 leading-7 text-text-secondary">아이폰 설치 앱은 준비 중입니다. 지금은 홈페이지에서 말씀·주보·교회 소식을 이용할 수 있어요.</p>
    <ol className="mt-8 list-decimal space-y-6 pl-6 marker:font-bold marker:text-primary-700">
      <li className="pl-2"><h2 className="font-bold">Safari에서 홈페이지를 열어 주세요</h2><p className="mt-2 leading-7 text-text-secondary">아래 버튼으로 홈페이지 첫 화면을 여세요. 카카오톡 등 다른 앱 안에서 보고 있다면 Safari에서 daegwangchurch.kr을 열어 주세요.</p><Button asChild size="lg" className="mt-3"><Link href="/">대광교회 홈페이지 열기</Link></Button></li>
      <li className="pl-2"><h2 className="font-bold">공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요</h2><p className="mt-2 leading-7 text-text-secondary">Safari의 공유 버튼(네모에서 위로 향한 화살표)을 누르세요. 버전에 따라 더 보기 메뉴 안에 있을 수 있어요. ‘홈 화면에 추가’가 보이지 않으면 공유 메뉴 아래의 ‘동작 편집’에서 추가해 주세요.</p></li>
      <li className="pl-2"><h2 className="font-bold">이름을 확인하고 ‘추가’를 누르세요</h2><p className="mt-2 leading-7 text-text-secondary">이름을 ‘대광교회’로 정해 주세요. ‘웹 앱으로 열기’ 옵션이 보이면 선택할 수 있어요. 홈 화면에 생긴 아이콘으로 홈페이지를 열면 됩니다.</p></li>
    </ol>
    <aside className="mt-8 rounded-2xl bg-background-warm p-6"><h2 className="font-bold">이용 전에 확인해 주세요</h2><p className="mt-2 leading-7 text-text-secondary">이 기능은 홈페이지 바로가기이며 iOS 설치 파일 다운로드가 아닙니다. 인터넷 연결이 필요하고, Android 앱의 개인 묵상·기도 기록과 푸시 알림은 제공하지 않습니다. 이 안내 페이지 대신 홈페이지 첫 화면을 열어 홈 화면에 추가해 주세요.</p></aside>
  </ContentShell>;
}
