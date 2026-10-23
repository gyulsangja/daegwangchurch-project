import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Navigation } from '@/components/navigation';
import { enabled, workspace } from '@/lib/workspace';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';
export const metadata: Metadata = { title: { default: '대광교회 목회시스템', template: '%s · 대광교회 목회시스템' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const active = enabled((await headers()).get('host'));
  return <html lang="ko"><body>{active ? <><a href="#main" className="skip-link">본문 바로가기</a><div className="app"><Navigation name={(await workspace()).config.name} /><div className="workspace"><header className="topbar"><span>목회 수첩</span><span className="review-badge">로컬 개발 검토</span></header><div className="review-notice"><strong>가상 자료로 살펴보는 개발본입니다.</strong> 실제 개인정보는 입력하지 마세요. 변경 내용은 이 PC의 개발 DB에 저장됩니다.</div><main id="main">{children}</main></div></div></> : <main className="locked"><h1>대광교회 목회시스템</h1><p>운영 연결 전입니다. 현재는 승인된 로컬 개발 환경에서만 확인할 수 있습니다.</p></main>}</body></html>;
}
