import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Navigation } from '@/components/navigation';
import { enabled, workspace } from '@/lib/workspace';
import {operationalEnabled} from '@/lib/operational-config';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import {PrintLink} from '@/components/print-link';
import './globals.css';
import './print/print.css';
export const metadata: Metadata = { title: { default: '대광교회 목회시스템', template: '%s · 대광교회 목회시스템' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const requestHeaders=await headers();const operational=operationalEnabled();
  const publicPage=operational&&['/login','/access-denied'].includes(requestHeaders.get('x-ministry-path')??'');
  if(publicPage)return <html lang="ko"><body>{children}</body></html>;
  const active = operational||enabled(requestHeaders.get('host'));
  return <html lang="ko"><body>{active ? <><a href="#main" className="skip-link">본문 바로가기</a><div className="app"><Navigation operational={operational} name={(await workspace()).config.name} /><div className="workspace"><header className="topbar"><PrintLink/><span>목회 수첩</span><span className="review-badge">{operational?'목회 업무':'로컬 개발 검토'}</span>{operational&&<form action="/api/auth/logout" method="post"><button className="button">로그아웃</button></form>}</header>{!operational&&<div className="review-notice"><strong>가상 자료로 살펴보는 개발본입니다.</strong> 실제 개인정보는 입력하지 마세요. 변경 내용은 이 PC의 개발 DB에 저장됩니다.</div>}<main id="main">{children}</main></div></div></> : <main className="locked"><h1>대광교회 목회시스템</h1><p>운영 연결 전입니다. 현재는 승인된 로컬 개발 환경에서만 확인할 수 있습니다.</p></main>}</body></html>;
}
