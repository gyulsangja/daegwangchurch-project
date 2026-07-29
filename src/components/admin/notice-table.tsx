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
import Link from "next/link";

import { noticeStatusLabels } from "@/features/notices/schema";

type NoticeRow = {
  id: string;
  title: string;
  category: string;
  status: keyof typeof noticeStatusLabels;
  isImportant: boolean;
  isPinned: boolean;
  createdAt: Date;
};

export function NoticeTable({ rows }: { rows: NoticeRow[] }) {
  if (rows.length === 0) {
    return <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">등록된 공지사항이 없습니다.</Paper>;
  }

  return (
    <TableContainer component={Paper} variant="outlined" className="mt-5">
      <Table sx={{ minWidth: 820 }} aria-label="공지사항 목록">
        <TableHead>
          <TableRow><TableCell>제목</TableCell><TableCell>분류</TableCell><TableCell>등록일</TableCell><TableCell>상태</TableCell><TableCell>표시</TableCell><TableCell align="right">관리</TableCell></TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell><Link href={`/admin/notices/${row.id}/edit`} className="font-bold hover:text-primary-700">{row.title}</Link></TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell>{row.createdAt.toLocaleDateString("ko-KR")}</TableCell>
              <TableCell><Chip size="small" label={noticeStatusLabels[row.status]} color={row.status === "PUBLISHED" ? "primary" : "default"} /></TableCell>
              <TableCell>{[row.isImportant ? "중요" : "", row.isPinned ? "고정" : ""].filter(Boolean).join(" · ") || "-"}</TableCell>
              <TableCell align="right"><IconButton component="a" href={`/admin/notices/${row.id}/edit`} aria-label={`${row.title} 수정`}><Pencil aria-hidden="true" className="size-4" /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

