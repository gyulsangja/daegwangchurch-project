import { CalendarPlus, CheckCircle2, FilePlus2, FileWarning, Images, MessageSquareText, Plus, Video } from "lucide-react";
import Link from "next/link";

import { Button } from "@daegwang/web-ui/components/ui/button";
import { getOpenInquiryCount } from "@daegwang/server/features/inquiries/queries";
import { getDashboardSummary } from "@daegwang/server/features/dashboard/queries";
import { getRecentActivityLogs } from "@daegwang/server/features/admins/queries";
import { requireAdmin } from "../../../../lib/auth/permissions";

const quickActions = [
  { label: "주일 오전예배", href: "/admin/worship/new?type=SUNDAY_MORNING", icon: Video },
  { label: "첫 시간 주님께", href: "/admin/worship/new?type=FIRST_HOUR", icon: Video },
  { label: "주보 등록", href: "/admin/bulletins/new", icon: FilePlus2 },
  { label: "일정 등록", href: "/admin/events/new", icon: CalendarPlus },
];

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [summary, openInquiries, recentLogs] = await Promise.all([getDashboardSummary(), admin.role === "SUPER_ADMIN" ? getOpenInquiryCount() : Promise.resolve(null), admin.role === "SUPER_ADMIN" ? getRecentActivityLogs(6) : Promise.resolve([])]);
  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-700">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">대시보드</h1>
          <p className="mt-2 text-text-secondary">교회 홈페이지의 주요 콘텐츠 현황을 확인합니다.</p>
        </div>
        <Button asChild>
          <Link href="/admin/worship/new"><Plus aria-hidden="true" className="size-4" /> 콘텐츠 등록</Link>
        </Button>
      </div>
      <section aria-labelledby="quick-title" className="mt-9">
        <h2 id="quick-title" className="text-lg font-extrabold">빠른 등록</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="focus-ring flex min-h-28 items-center gap-4 rounded-2xl border border-border bg-white p-5 font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-700"><Icon aria-hidden="true" className="size-5" /></span>
              {label}
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric icon={CheckCircle2} label="공개 콘텐츠" value={summary.published} />
        <Metric icon={FileWarning} label="임시저장" value={summary.drafts} />
        <Metric icon={Images} label="등록 미디어" value={summary.totalMedia} />
      </section>
      <section className="mt-8 grid gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-border bg-white p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">운영 현황</h2>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">LIVE DATA</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatusItem label="최신 주일 오전예배" value={summary.latestSunday} />
            <StatusItem label="최신 첫 시간 주님께" value={summary.latestFirstHour} />
            <StatusItem label="최근 주보" value={summary.latestBulletin} />
            <StatusItem label="다음 일정" value={summary.nextEvent} />
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-white p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-700"><MessageSquareText aria-hidden="true" className="size-5" /></span>
          <h2 className="mt-5 text-lg font-extrabold">미처리 문의</h2>
          <p className="mt-2 text-sm text-text-secondary">{openInquiries === null ? "최고 관리자만 확인할 수 있습니다." : "확인 또는 처리 중인 문의입니다."}</p>
          <p className="mt-6 text-4xl font-extrabold tracking-[-0.04em]">{openInquiries ?? "—"}</p>
          {openInquiries !== null ? <Link href="/admin/inquiries" className="mt-5 inline-flex font-bold text-primary-700">문의 확인하기</Link> : null}
        </article>
      </section>
      {recentLogs.length ? <section className="mt-8"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">최근 관리자 활동</h2><Link href="/admin/activity" className="text-sm font-bold text-primary-700">전체 보기</Link></div><div className="mt-4 grid gap-3">{recentLogs.map((log) => <div key={log.id} className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center"><span className="w-28 shrink-0 text-sm font-bold text-primary-700">{log.actor?.displayName || "시스템"}</span><span className="flex-1 text-sm">{log.summary || `${log.entityType} 작업`}</span><time className="text-xs text-text-secondary">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(log.createdAt)}</time></div>)}</div></section> : null}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: number }) { return <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5"><span className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-700"><Icon className="size-5" /></span><div><p className="text-sm font-bold text-text-secondary">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div></div>; }

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background-muted p-4">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-sm text-text-secondary">{value}</p>
    </div>
  );
}
