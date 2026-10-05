import { publicEnv } from '@daegwang/config/env';
import {
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  FileText,
  Images,
  History,
  Inbox,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  School,
  ShieldCheck,
  UsersRound,
  Video,
} from "lucide-react";
import Link from "next/link";

import { logout } from "../../app/admin/actions";
import { ChurchLogo } from "@daegwang/web-ui/components/site/church-logo";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { UnsavedChangesGuard } from "./unsaved-changes-guard";
import { AdminFeedback } from "./admin-feedback";

const adminNavigation = [
  { label: "대시보드", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "앱 운영 현황", href: "/admin/app-operations", icon: ClipboardList },
  { label: "모임·소속 소식", href: "/admin/groups", icon: UsersRound },
  { label: "상담·심방 접수", href: "/admin/care", icon: Inbox },
  { label: "예배 콘텐츠", href: "/admin/worship", icon: Video },
  { label: "공지사항", href: "/admin/notices", icon: Megaphone },
  { label: "주보", href: "/admin/bulletins", icon: FileText },
  { label: "일정", href: "/admin/events", icon: CalendarDays },
  { label: "앨범", href: "/admin/albums", icon: Images },
  { label: "미디어 관리", href: "/admin/media", icon: LibraryBig, superOnly: true },
  { label: "페이지", href: "/admin/pages", icon: ClipboardList },
  { label: "섬기는 사람들", href: "/admin/people", icon: UsersRound },
  { label: "교회학교·사역", href: "/admin/ministries", icon: School },
  { label: "문의", href: "/admin/inquiries", icon: Inbox, superOnly: true },
  { label: "관리자", href: "/admin/admins", icon: ShieldCheck, superOnly: true },
  { label: "활동 기록", href: "/admin/activity", icon: History, superOnly: true },
  { label: "사이트 설정", href: "/admin/settings", icon: Settings },
];

type AdminShellProps = {
  children: React.ReactNode;
  admin: { displayName: string; email: string; role: "ADMIN" | "SUPER_ADMIN" };
};

function NavigationItems({ role }: { role: AdminShellProps["admin"]["role"] }) {
  return (
    <ul className="space-y-1">
      {adminNavigation.filter((item) => !("superOnly" in item) || role === "SUPER_ADMIN").map(({ label, href, icon: Icon }) => (
        <li key={href}>
          <Link href={href} className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-text-secondary hover:bg-primary-50 hover:text-primary-700">
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AdminShell({ children, admin }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background-muted">
      <UnsavedChangesGuard />
      <AdminFeedback />
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white p-5 lg:block">
        <ChurchLogo href={publicEnv.NEXT_PUBLIC_SITE_URL} className="scale-90 origin-left" />
        <nav aria-label="관리자 메뉴" className="mt-9">
          <NavigationItems role={admin.role} />
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex min-h-18 items-center justify-between border-b border-border bg-white px-4 sm:px-7">
          <details className="group relative lg:hidden">
            <summary className="focus-ring flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-border [&::-webkit-details-marker]:hidden">
              <Menu aria-hidden="true" className="size-5" />
              <span className="sr-only">관리자 메뉴 열기</span>
            </summary>
            <nav aria-label="모바일 관리자 메뉴" className="absolute left-0 top-14 w-64 rounded-2xl border border-border bg-white p-3 shadow-xl">
              <NavigationItems role={admin.role} />
            </nav>
          </details>
          <div className="hidden items-center gap-2 text-sm text-text-secondary lg:flex">
            관리자 <ChevronRight aria-hidden="true" className="size-4" /> 대시보드
          </div>
          <div className="flex items-center gap-3">
            <CircleUserRound aria-hidden="true" className="size-8 text-primary-600" />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-bold">{admin.displayName}</p>
              <p className="text-xs text-text-secondary">{admin.role === "SUPER_ADMIN" ? "최고 관리자" : "관리자"}</p>
            </div>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" aria-label="로그아웃">
                <LogOut aria-hidden="true" className="size-5" />
              </Button>
            </form>
          </div>
        </header>
        <main className="p-4 sm:p-7 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
