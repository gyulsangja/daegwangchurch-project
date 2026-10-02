import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { PersonTable } from "../../../../components/admin/person-table";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { getAdminPeople } from "@daegwang/server/features/people/queries";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminPeoplePage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const people = await getAdminPeople(q);
  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary-700">PEOPLE MANAGEMENT</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">섬기는 사람들</h1><p className="mt-2 text-text-secondary">교역자 소개, 사진과 공개 순서를 관리합니다.</p></div>
        <Button asChild><Link href="/admin/people/new"><Plus aria-hidden="true" className="size-4" /> 교역자 등록</Link></Button>
      </div>
      <Paper component="form" variant="outlined" className="mt-8 flex flex-col gap-3 p-4 sm:flex-row">
        <TextField name="q" defaultValue={q} size="small" label="이름·직분·사역 검색" className="flex-1" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search aria-hidden="true" className="size-4" /></InputAdornment> } }} />
        <Button type="submit" variant="secondary">검색</Button>
      </Paper>
      <PersonTable rows={people} />
    </div>
  );
}

