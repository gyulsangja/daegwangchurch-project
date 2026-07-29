import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminProfiles } from "@/features/admins/queries";
import { adminRoleLabels } from "@/features/admins/schema";
import { requireSuperAdmin } from "@/lib/auth/permissions";
const date = (value: Date | null) => value ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(value) : "로그인 기록 없음";
export default async function AdminsPage() { await requireSuperAdmin(); const rows = await getAdminProfiles(); return <div className="mx-auto max-w-[90rem]"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-primary-700">ADMIN MANAGEMENT</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">관리자 계정</h1><p className="mt-2 text-text-secondary">Supabase Auth 사용자와 관리자 권한을 연결합니다.</p></div><Button asChild><Link href="/admin/admins/new"><Plus className="size-4" /> 관리자 연결</Link></Button></div><TableContainer component={Paper} variant="outlined" className="mt-8"><Table sx={{ minWidth: 850 }}><TableHead><TableRow><TableCell>관리자</TableCell><TableCell>역할</TableCell><TableCell>상태</TableCell><TableCell>최근 로그인</TableCell><TableCell>활동 수</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id} hover><TableCell><Link href={`/admin/admins/${row.id}/edit`} className="font-extrabold hover:text-primary-700">{row.displayName}</Link><p className="mt-1 text-sm text-text-secondary">{row.email}</p></TableCell><TableCell>{adminRoleLabels[row.role]}</TableCell><TableCell><Chip size="small" label={row.isActive ? "활성" : "비활성"} color={row.isActive ? "success" : "default"} /></TableCell><TableCell>{date(row.lastLoginAt)}</TableCell><TableCell>{row._count.activityLogs}</TableCell></TableRow>)}</TableBody></Table></TableContainer></div>; }
