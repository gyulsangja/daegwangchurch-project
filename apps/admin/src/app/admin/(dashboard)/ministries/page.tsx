import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { MinistryTable } from "../../../../components/admin/ministry-table";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { getAdminMinistries } from "@daegwang/server/features/ministries/queries";
export default async function AdminMinistriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) { const { q = "" } = await searchParams; const rows = await getAdminMinistries(q); return <div className="mx-auto max-w-[90rem]"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-primary-700">MINISTRY MANAGEMENT</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">교회학교·사역</h1><p className="mt-2 text-text-secondary">부서 소개와 모임 정보, 대표 이미지를 관리합니다.</p></div><Button asChild><Link href="/admin/ministries/new"><Plus className="size-4" /> 사역 등록</Link></Button></div><Paper component="form" variant="outlined" className="mt-8 flex flex-col gap-3 p-4 sm:flex-row"><TextField name="q" defaultValue={q} size="small" label="사역명·소개 검색" className="flex-1" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search className="size-4" /></InputAdornment> } }} /><Button type="submit" variant="secondary">검색</Button></Paper><MinistryTable rows={rows} /></div>; }
