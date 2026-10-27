import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@daegwang/server/features/settings/queries';
import { hasOfferingAccount, readOfferingAccount } from '@daegwang/contracts/features/church/offering';
import { ContentShell } from '../../../components/site/content-shell';
import { PageHero } from '../../../components/site/page-hero';
import { OfferingAccountCard } from '../../../components/content/offering-account';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '헌금 안내', description: '대광교회가 공개한 헌금 은행·계좌번호·예금주와 문의 연락처를 확인하세요.', alternates: { canonical: '/offering' } };
export default async function OfferingPage() {
  const settings = await getSiteSettings(); const account = readOfferingAccount(settings);
  return <><PageHero eyebrow="교회소개" title="헌금 안내" description="감사와 기도로 드리는 헌금 계좌를 안내합니다. 은행·계좌번호·예금주를 확인해 주세요." /><ContentShell narrow><div className="mx-auto max-w-xl">
    {hasOfferingAccount(account) ? <OfferingAccountCard account={account} /> : <p className="rounded-xl bg-background-muted p-6">공개된 헌금 계좌가 없습니다. 교회에 문의해 주세요.</p>}
    <p className="mt-6 text-sm text-text-secondary">문의 {settings.phone || <Link href="/location" className="underline">교회 연락처 안내</Link>}</p>
  </div></ContentShell></>;
}
