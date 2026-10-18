import Image from 'next/image';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';
export function AppDownloadCard() {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-4"><div><p className="flex items-center gap-2 font-bold"><Smartphone aria-hidden="true" className="size-5 text-primary-700" />휴대폰에서 만나는 대광교회</p><p className="mt-1 text-sm text-text-secondary">Android 앱 · 아이폰 홈페이지 바로가기</p><Link href="/app" className="inline-flex min-h-11 items-center font-semibold text-primary-700 underline underline-offset-4">다운로드·이용 안내 →</Link></div><Link href="/app" aria-label="휴대폰 다운로드·이용 안내 열기" className="shrink-0"><Image src="/images/app-download-qr.svg" width={100} height={100} alt="휴대폰 이용 안내 QR코드" unoptimized /></Link></div>;
}
