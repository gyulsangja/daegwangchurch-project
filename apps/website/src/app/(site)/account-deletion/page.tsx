import type { Metadata } from 'next';
import Alert from '@mui/material/Alert';
import Link from 'next/link';
import { InquiryForm } from '../../../components/content/inquiry-form';
import { PageHero } from '../../../components/site/page-hero';
import { ContentShell } from '../../../components/site/content-shell';

export const metadata: Metadata = { title: '앱 계정 및 데이터 삭제 요청', description: '대광교회 앱을 설치하거나 로그인하지 않고 계정 및 개인 데이터 삭제를 요청할 수 있습니다.', alternates: { canonical: '/account-deletion' }, robots: { index: false, follow: true } };

export default async function AccountDeletionPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { submitted } = await searchParams;
  return <><PageHero eyebrow="개인정보와 계정" title="앱 계정 및 데이터 삭제 요청" description="대광교회 앱을 삭제했거나 로그인할 수 없어도 요청할 수 있습니다." /><ContentShell narrow>
    {submitted === '1' && <Alert severity="success" className="mb-6!">삭제 요청이 접수되었습니다. 아직 계정 삭제가 완료된 것은 아닙니다. 담당자가 본인 확인과 처리 결과를 입력하신 연락처로 안내합니다.</Alert>}
    <section className="mb-8 space-y-4 leading-7 text-text-secondary">
      <h2 className="text-xl font-bold text-text-primary">삭제 방법과 범위</h2>
      <p>앱에서는 MY → 계정관리 → 회원탈퇴에서 직접 요청할 수 있습니다. 앱 밖에서는 아래 양식으로 요청해 주세요. 타인의 계정이 삭제되지 않도록 담당자가 계정 소유 여부를 확인한 후 처리합니다.</p>
      <p>계정 삭제 대상은 로그인 계정과 연결된 프로필, 교인 확인·소속, 묵상·기도 기록, 저장한 말씀, 개인 일정, 상담·심방 요청, 알림 설정과 푸시 기기 정보입니다. 삭제한 개인 기록은 앱에서 복구할 수 없습니다.</p>
      <p>교회가 발행한 설교·주보 등 공용 자료는 삭제되지 않습니다. 별도로 남긴 홈페이지 문의와 이 삭제 요청의 접수 기록은 회원 기록과 구분하여 처리합니다. 해당 문의도 삭제하려면 요청 내용에 함께 적어 주세요. 보관이 필요한 정보와 기간은 본인 확인 시 안내합니다.</p>
      <p>비밀번호나 인증번호를 요구하지 않습니다. 가입 이메일을 잊었거나 사용할 수 없으면 연락 가능한 전화번호를 입력해 주세요. <Link className="underline focus-ring" href="/privacy">개인정보 처리 안내</Link>를 확인할 수 있습니다.</p>
    </section>
    <InquiryForm returnPath="/account-deletion" />
  </ContentShell></>;
}
