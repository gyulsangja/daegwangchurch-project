import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { WorshipTable } from "@/components/admin/worship-table";
import { Button } from "@/components/ui/button";
import { getAdminWorshipContents } from "@/features/worship/queries";

export default async function AdminWorshipPage() {
  const contents = await getAdminWorshipContents();

  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-700">CONTENT MANAGEMENT</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">예배 콘텐츠</h1>
          <p className="mt-2 text-text-secondary">YouTube 영상과 말씀 정보를 등록하고 공개 상태를 관리합니다.</p>
        </div>
        <Button asChild><Link href="/admin/worship/new"><Plus aria-hidden="true" className="size-4" /> 예배 콘텐츠 등록</Link></Button>
      </div>
      <Paper variant="outlined" className="mt-8 flex flex-col gap-3 p-4 sm:flex-row">
        <TextField size="small" label="제목 검색" className="flex-1" />
        <Button variant="secondary"><Search aria-hidden="true" className="size-4" /> 검색</Button>
      </Paper>
      <WorshipTable rows={contents} />
    </div>
  );
}
