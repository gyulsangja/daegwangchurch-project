import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Download, BookOpenText, Heart } from 'lucide-react';
import { Button } from '@daegwang/web-ui/components/ui/button';
import { ContentShell } from '../../../components/site/content-shell';
import { androidDownloadUrl } from '../../../lib/app-download';

export const metadata: Metadata = { title: '교회 앱 다운로드', description: '대광교회 말씀과 묵상, 주보를 휴대폰에서 만나세요.', alternates: { canonical: '/app' } };
export default function AppDownloadPage() {
  return <ContentShell narrow><div className="grid items-center gap-8 md:grid-cols-[1fr_220px]">
    <div><p className="church-eyebrow">대광교회 앱</p><h1 className="mt-3 text-3xl font-bold leading-snug">말씀과 기도를<br />일상 가까이에</h1><p className="mt-4 leading-7 text-text-secondary">첫시간 묵상과 설교, 주보와 교회 소식을 휴대폰에서 편하게 확인하세요.</p>
      <Button asChild size="lg" className="mt-6"><a href={androidDownloadUrl}><Download aria-hidden="true" className="size-5" />Android 앱 다운로드</a></Button>
      <p className="mt-3 text-sm leading-6 text-text-secondary">현재 Android 휴대폰용 설치 파일(APK)을 제공합니다.<br />아이폰 앱은 준비 중입니다. 아이폰에서는 <Link href="/" className="font-semibold underline">홈페이지</Link>를 이용해 주세요.</p>
    </div>
    <figure className="mx-auto rounded-2xl border border-border bg-white p-4 text-center"><Image src="/images/app-download-qr.svg" alt="대광교회 앱 다운로드 안내 페이지 QR코드" width={184} height={184} unoptimized /><figcaption className="mt-2 text-sm text-text-secondary">휴대폰 카메라로 QR코드를 찍으세요.</figcaption></figure>
  </div>
  <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-background-muted p-5"><BookOpenText aria-hidden="true" className="size-6 text-primary-700" /><h2 className="mt-2 font-bold">말씀과 주보를 한곳에서</h2><p className="mt-2 text-sm leading-6 text-text-secondary">설교와 첫시간 묵상을 보고, 주보를 크게 펼쳐 읽을 수 있어요.</p></div><div className="rounded-xl bg-background-muted p-5"><Heart aria-hidden="true" className="size-6 text-primary-700" /><h2 className="mt-2 font-bold">나만의 묵상과 기도</h2><p className="mt-2 text-sm leading-6 text-text-secondary">로그인하면 개인 기록을 남기고 교인 확인을 신청할 수 있어요.</p></div></div>
  <details className="mt-6 rounded-xl border border-border p-5"><summary className="min-h-11 cursor-pointer font-semibold">설치 방법이 궁금하신가요?</summary><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-text-secondary"><li>Android 휴대폰에서 위 다운로드 버튼을 누르세요.</li><li>다운로드가 끝나면 받은 APK 파일을 열어 설치하세요.</li><li>설치 권한 안내가 나오면 파일을 연 앱에 대한 설치 허용을 확인해 주세요. Play Protect 경고나 검사가 나오면 안내에 따라 확인하세요.</li><li>기존 대광교회 앱이 있다면 업데이트로 설치하세요.</li></ol></details>
  </ContentShell>;
}
