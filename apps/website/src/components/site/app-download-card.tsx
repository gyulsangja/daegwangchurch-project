import Image from 'next/image';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';
export function AppDownloadCard() {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-4"><div><p className="flex items-center gap-2 font-bold"><Smartphone aria-hidden="true" className="size-5 text-primary-700" />대광교회 앱</p><p className="mt-1 text-sm text-text-secondary">말씀·묵상·주보를 휴대폰에서</p><Link href="/app" className="inline-flex min-h-11 items-center font-semibold text-primary-700 underline underline-offset-4">앱 다운로드 →</Link></div><Link href="/app" aria-label="QR코드 또는 링크로 앱 다운로드 안내 열기" className="shrink-0"><Image src="/images/app-download-qr.svg" width={100} height={100} alt="앱 다운로드 안내 QR코드" unoptimized /></Link></div>;
}
