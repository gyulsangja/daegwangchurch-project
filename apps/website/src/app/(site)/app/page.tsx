import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@daegwang/web-ui/components/ui/button';
import { ContentShell } from '../../../components/site/content-shell';
import { androidDownloadUrl } from '../../../lib/app-download';

export const metadata: Metadata = { title: '앱 다운로드·아이폰 이용 안내', description: '대광교회 Android 테스트용 APK 다운로드·업데이트와 아이폰 홈 화면 추가 방법을 안내합니다. 말씀·주보·교회 소식을 휴대폰에서 이용하세요.', alternates: { canonical: '/app' } };
export default function AppDownloadPage() {
  return <ContentShell narrow>
    <header><p className="church-eyebrow">대광교회와 함께하는 일상</p><h1 className="mt-3 text-3xl font-bold leading-snug">휴대폰에서 만나는<br />말씀과 교회 소식</h1><p className="mt-4 leading-7 text-text-secondary">Android는 테스트용 앱을 설치하고, 아이폰은 홈페이지를 홈 화면에 추가해 이용하실 수 있습니다.</p></header>
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <section className="flex flex-col rounded-2xl border border-border bg-white p-6" aria-labelledby="android-title">
        <p className="text-sm font-semibold text-primary-700">Android · 테스트용 설치 앱</p><h2 id="android-title" className="mt-2 text-2xl font-bold">안드로이드 앱</h2>
        <p className="mt-3 text-sm leading-7 text-text-secondary">말씀·주보와 교회 소식을 보고, 로그인하여 개인 묵상·기도를 기록할 수 있어요.</p>
        <figure className="mx-auto my-5 text-center"><Image src="/images/app-download-qr.svg" alt="Android 앱 다운로드 안내 페이지 QR코드" width={168} height={168} unoptimized /><figcaption className="text-sm text-text-secondary">휴대폰 카메라로 찍어 주세요.</figcaption></figure>
        <Button asChild size="lg" className="mt-auto"><a href={androidDownloadUrl}><Download aria-hidden="true" className="size-5" />Android 앱 다운로드</a></Button>
        <p className="mt-3 text-sm leading-6 text-text-secondary">APK 설치 파일입니다. 기존 앱이 있으면 업데이트로 설치해 주세요.</p>
      </section>
      <section className="flex flex-col rounded-2xl border border-border bg-background-warm p-6" aria-labelledby="iphone-title">
        <p className="text-sm font-semibold text-primary-700">iPhone · 홈페이지 바로가기</p><h2 id="iphone-title" className="mt-2 text-2xl font-bold">아이폰에서 이용하기</h2>
        <p className="mt-3 text-sm leading-7 text-text-secondary">홈페이지에서 말씀·주보와 교회 소식을 볼 수 있어요. 홈 화면에 추가하면 더 편하게 열 수 있어요.</p>
        <figure className="mx-auto my-5 text-center"><Image src="/images/iphone-guide-qr.svg" alt="아이폰 홈페이지 홈 화면 추가 안내 QR코드" width={168} height={168} unoptimized /><figcaption className="text-sm text-text-secondary">아이폰 카메라로 안내를 열어 주세요.</figcaption></figure>
        <Button asChild size="lg" variant="secondary" className="mt-auto"><Link href="/app/iphone"><Smartphone aria-hidden="true" className="size-5" />아이폰 이용 안내</Link></Button>
        <p className="mt-3 text-sm leading-6 text-text-secondary">설치 앱은 준비 중입니다. 홈페이지 바로가기에서는 앱의 개인 기록·푸시 알림을 제공하지 않습니다.</p>
      </section>
    </div>
    <details className="mt-6 rounded-xl border border-border p-5"><summary className="min-h-11 cursor-pointer font-semibold">Android 설치 방법</summary><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-text-secondary"><li>Android 휴대폰에서 앱 다운로드 버튼을 누르세요.</li><li>다운로드가 끝나면 받은 APK 파일을 열어 설치하세요.</li><li>설치 권한 안내가 나오면 파일을 연 앱에 대한 설치 허용을 확인해 주세요. Play Protect 경고나 검사가 나오면 안내에 따라 확인하세요.</li><li>기존 대광교회 앱이 있다면 업데이트로 설치하세요.</li></ol></details>
  </ContentShell>;
}
