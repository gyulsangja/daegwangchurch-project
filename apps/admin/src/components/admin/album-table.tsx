import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { albumStatusLabels } from "@daegwang/contracts/features/albums/schema";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

type AlbumRow = {
  id: string;
  title: string;
  category: string;
  eventDate: Date;
  status: keyof typeof albumStatusLabels;
  showOnMain: boolean;
  coverImage: { bucket: string; objectPath: string; altText: string | null } | null;
  images: Array<{ id: string }>;
};

export function AlbumTable({ rows }: { rows: AlbumRow[] }) {
  if (rows.length === 0) return <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">등록된 행사앨범이 없습니다.</Paper>;
  return (
    <TableContainer component={Paper} variant="outlined" className="mt-5">
      <Table sx={{ minWidth: 900 }} aria-label="행사앨범 목록">
        <TableHead><TableRow><TableCell>대표</TableCell><TableCell>제목</TableCell><TableCell>분류</TableCell><TableCell>행사일</TableCell><TableCell>사진</TableCell><TableCell>상태</TableCell><TableCell align="right">관리</TableCell></TableRow></TableHead>
        <TableBody>{rows.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>{row.coverImage ? <Image src={getPublicStorageUrl(row.coverImage.bucket, row.coverImage.objectPath)} alt={row.coverImage.altText ?? ""} width={72} height={54} className="aspect-[4/3] rounded-lg object-cover" /> : <div className="h-[54px] w-[72px] rounded-lg bg-background-muted" />}</TableCell>
            <TableCell><Link href={`/admin/albums/${row.id}/edit`} className="font-bold hover:text-primary-700">{row.title}</Link>{row.showOnMain ? <span className="ml-2 text-xs font-bold text-primary-700">메인</span> : null}</TableCell>
            <TableCell>{row.category}</TableCell>
            <TableCell>{row.eventDate.toLocaleDateString("ko-KR")}</TableCell>
            <TableCell>{row.images.length}장</TableCell>
            <TableCell><Chip size="small" label={albumStatusLabels[row.status]} color={row.status === "PUBLISHED" ? "primary" : "default"} /></TableCell>
            <TableCell align="right"><IconButton component="a" href={`/admin/albums/${row.id}/edit`} aria-label={`${row.title} 수정`}><Pencil aria-hidden="true" className="size-4" /></IconButton></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </TableContainer>
  );
}

