import {Suspense} from 'react';
import { SiteFooter } from "../../components/site/site-footer";
import { SiteHeader } from "../../components/site/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="church-site min-h-screen">
      <a href="#main-content" className="church-skip">본문으로 바로가기</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Suspense fallback={<footer className="min-h-40 border-t border-border" aria-label="교회 정보 불러오는 중"/>}><SiteFooter /></Suspense>
    </div>
  );
}
