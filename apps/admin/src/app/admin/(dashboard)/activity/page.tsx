import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { getRecentActivityLogs } from "@daegwang/server/features/admins/queries";
import { requireSuperAdmin } from "../../../../lib/auth/permissions";
const date = (value: Date) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(value);
export default async function ActivityPage() { await requireSuperAdmin(); const logs = await getRecentActivityLogs(100); return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">ACTIVITY LOG</p><h1 className="mt-1 text-3xl font-extrabold">관리자 활동 기록</h1><p className="mt-2 text-text-secondary">최근 로그인과 콘텐츠 변경 내역 100건을 확인합니다.</p><div className="mt-8 grid gap-3">{logs.map((log) => <Paper key={log.id} variant="outlined" className="grid gap-3 p-5 sm:grid-cols-[7rem_10rem_1fr_auto] sm:items-center"><Chip size="small" label={log.action} className="w-fit" /><span className="font-bold">{log.actor?.displayName || "시스템"}</span><span>{log.summary || `${log.entityType} 작업`}</span><time className="text-sm text-text-secondary">{date(log.createdAt)}</time></Paper>)}</div></div>; }
