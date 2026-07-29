import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";

import { bulletinStatusLabels } from "@/features/bulletins/schema";
import { getPublicStorageUrl } from "@/lib/storage/public-url";

type BulletinRow = {
  id: string;
  title: string;
  worshipDate: Date;
  status: keyof typeof bulletinStatusLabels;
  pdfMedia: { bucket: string; objectPath: string; originalName: string };
};

export function BulletinTable({ rows }: { rows: BulletinRow[] }) {
  if (rows.length === 0) return <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">등록된 주보가 없습니다.</Paper>;
  return (
    <TableContainer component={Paper} variant="outlined" className="mt-5">
      <Table sx={{ minWidth: 800 }} aria-label="주보 목록">
        <TableHead><TableRow><TableCell>제목</TableCell><TableCell>예배일</TableCell><TableCell>PDF</TableCell><TableCell>상태</TableCell><TableCell align="right">관리</TableCell></TableRow></TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell><Link href={`/admin/bulletins/${row.id}/edit`} className="font-bold hover:text-primary-700">{row.title}</Link></TableCell>
              <TableCell>{row.worshipDate.toLocaleDateString("ko-KR")}</TableCell>
              <TableCell><a href={getPublicStorageUrl(row.pdfMedia.bucket, row.pdfMedia.objectPath)} target="_blank" rel="noreferrer" className="inline-flex max-w-56 items-center gap-1 text-primary-700 hover:underline"><span className="truncate">{row.pdfMedia.originalName}</span><ExternalLink aria-hidden="true" className="size-3 shrink-0" /></a></TableCell>
              <TableCell><Chip size="small" label={bulletinStatusLabels[row.status]} color={row.status === "PUBLISHED" ? "primary" : "default"} /></TableCell>
              <TableCell align="right"><IconButton component="a" href={`/admin/bulletins/${row.id}/edit`} aria-label={`${row.title} 수정`}><Pencil aria-hidden="true" className="size-4" /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

