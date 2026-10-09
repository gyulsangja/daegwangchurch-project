import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { WorshipTable } from "../../../../components/admin/worship-table";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { getAdminWorshipContents } from "@daegwang/server/features/worship/queries";

export default async function AdminWorshipPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const contents = await getAdminWorshipContents(q);

  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-700">CONTENT MANAGEMENT</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">설교·첫시간</h1>
          <p className="mt-2 text-text-secondary">영상을 한 번 등록하면 홈페이지와 앱에 함께 반영됩니다.</p>
        </div>
        <Button asChild><Link href="/admin/worship/new"><Plus aria-hidden="true" className="size-4" /> 예배 콘텐츠 등록</Link></Button>
      </div>
      <Paper component="form" variant="outlined" className="mt-8 flex flex-col gap-3 p-4 sm:flex-row">
        <TextField name="q" defaultValue={q} size="small" label="제목·설교자 검색" className="flex-1" />
        <Button type="submit" variant="secondary"><Search aria-hidden="true" className="size-4" /> 검색</Button>
      </Paper>
      <WorshipTable rows={contents} />
    </div>
  );
}
