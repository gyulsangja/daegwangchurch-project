import { publicEnv } from '@daegwang/config/env';
import { CircleUserRound, ExternalLink, LogOut } from 'lucide-react';
import { logout } from '../../app/admin/actions';
import { ChurchLogo } from '@daegwang/web-ui/components/site/church-logo';
import { Button } from '@daegwang/web-ui/components/ui/button';
import { UnsavedChangesGuard } from './unsaved-changes-guard';
import { AdminFeedback } from './admin-feedback';
import { AdminNavigation } from './admin-navigation';
import { AdminMobileMenu } from './admin-mobile-menu';

type AdminShellProps = {
  children: React.ReactNode;
  admin: { displayName: string; email: string; role: 'ADMIN' | 'SUPER_ADMIN' };
};

export function AdminShell({ children, admin }: AdminShellProps) {
  return <div className="min-h-screen bg-background-muted">
    <UnsavedChangesGuard /><AdminFeedback />
    <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-border bg-white p-5 lg:block">
      <ChurchLogo href={publicEnv.NEXT_PUBLIC_SITE_URL} className="origin-left scale-90" />
      <p className="mt-6 px-3 text-xs font-semibold text-text-secondary">홈페이지·앱 통합 관리</p>
      <nav aria-label="관리자 메뉴" className="mt-3"><AdminNavigation /></nav>
    </aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-40 flex min-h-18 items-center justify-between gap-3 border-b border-border bg-white px-4 sm:px-7">
        <AdminMobileMenu />
        <a href={publicEnv.NEXT_PUBLIC_SITE_URL} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700">홈페이지 보기<ExternalLink aria-hidden="true" className="size-4" /></a>
        <div className="flex items-center gap-3">
          <CircleUserRound aria-hidden="true" className="hidden size-8 text-primary-600 sm:block" />
          <div className="hidden leading-tight sm:block"><p className="text-sm font-bold">{admin.displayName}</p><p className="text-xs text-text-secondary">{admin.role === 'SUPER_ADMIN' ? '최고 관리자' : '관리자'}</p></div>
          <form action={logout}><Button type="submit" variant="ghost" size="icon" aria-label="로그아웃"><LogOut aria-hidden="true" className="size-5" /></Button></form>
        </div>
      </header>
      <main className="p-4 sm:p-7 lg:p-10">{children}</main>
    </div>
  </div>;
}
