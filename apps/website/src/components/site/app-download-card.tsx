import Image from 'next/image';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export function AppDownloadCard() {
  return <div className="rounded-xl border border-border bg-white p-4">
    <p className="flex items-center gap-2 font-bold"><Smartphone aria-hidden="true" className="size-5 text-primary-700" />휴대폰에서 만나는 대광교회</p>
    <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-primary-700">
      <Link href="/app" className="flex flex-col items-center gap-1 underline underline-offset-4"><Image src="/images/app-download-qr.svg" width={84} height={84} alt="" unoptimized />Android 다운로드</Link>
      <a href="/mobile" className="flex flex-col items-center gap-1 underline underline-offset-4"><Image src="/images/iphone-guide-qr.svg" width={84} height={84} alt="" unoptimized />아이폰 웹앱 열기</a>
    </div>
  </div>;
}
