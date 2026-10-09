import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { NoticeTable } from "../../../../components/admin/notice-table";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { getAdminNotices } from "@daegwang/server/features/notices/queries";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminNoticesPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const notices = await getAdminNotices(q);

  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-700">CONTENT MANAGEMENT</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">공지사항</h1>
          <p className="mt-2 text-text-secondary">홈페이지와 앱에 함께 보이는 공지와 첨부파일을 관리합니다.</p>
        </div>
        <Button asChild><Link href="/admin/notices/new"><Plus aria-hidden="true" className="size-4" /> 공지 등록</Link></Button>
      </div>
      <Paper component="form" variant="outlined" className="mt-8 flex flex-col gap-3 p-4 sm:flex-row">
        <TextField name="q" defaultValue={q} size="small" label="제목 또는 분류 검색" className="flex-1" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search aria-hidden="true" className="size-4" /></InputAdornment> } }} />
        <Button type="submit" variant="secondary">검색</Button>
      </Paper>
      <NoticeTable rows={notices} />
    </div>
  );
}

