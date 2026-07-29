import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { AlbumTable } from "@/components/admin/album-table";
import { Button } from "@/components/ui/button";
import { getAdminAlbums } from "@/features/albums/queries";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminAlbumsPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const albums = await getAdminAlbums(q);
  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary-700">CONTENT MANAGEMENT</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">행사앨범</h1><p className="mt-2 text-text-secondary">교회 행사 사진과 대표 이미지를 관리합니다.</p></div>
        <Button asChild><Link href="/admin/albums/new"><Plus aria-hidden="true" className="size-4" /> 앨범 등록</Link></Button>
      </div>
      <Paper component="form" variant="outlined" className="mt-8 flex flex-col gap-3 p-4 sm:flex-row">
        <TextField name="q" defaultValue={q} size="small" label="제목 또는 분류 검색" className="flex-1" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search aria-hidden="true" className="size-4" /></InputAdornment> } }} />
        <Button type="submit" variant="secondary">검색</Button>
      </Paper>
      <AlbumTable rows={albums} />
    </div>
  );
}

