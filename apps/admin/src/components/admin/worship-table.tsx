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

import { contentStatusLabels, worshipTypeLabels } from "@daegwang/contracts/features/worship/schema";

type WorshipRow = {
  id: string;
  type: keyof typeof worshipTypeLabels;
  title: string;
  contentDate: Date;
  preacher: string | null;
  status: keyof typeof contentStatusLabels;
  isPinned: boolean;
};

export function WorshipTable({ rows }: { rows: WorshipRow[] }) {
  if (rows.length === 0) {
    return (
      <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">
        등록된 예배 콘텐츠가 없습니다. 첫 콘텐츠를 등록해 주세요.
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" className="mt-5">
      <Table sx={{ minWidth: 840 }} aria-label="예배 콘텐츠 목록">
        <TableHead>
          <TableRow>
            <TableCell>유형</TableCell>
            <TableCell>제목</TableCell>
            <TableCell>날짜</TableCell>
            <TableCell>설교자</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>고정</TableCell>
            <TableCell align="right">관리</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{worshipTypeLabels[row.type]}</TableCell>
              <TableCell><Link href={`/admin/worship/${row.id}/edit`} className="font-bold hover:text-primary-700">{row.title}</Link></TableCell>
              <TableCell>{row.contentDate.toISOString().slice(0, 10)}</TableCell>
              <TableCell>{row.preacher || "—"}</TableCell>
              <TableCell><Chip size="small" label={contentStatusLabels[row.status]} color={row.status === "PUBLISHED" ? "primary" : "default"} /></TableCell>
              <TableCell>{row.isPinned ? "예" : "아니오"}</TableCell>
              <TableCell align="right"><IconButton component="a" href={`/admin/worship/${row.id}/edit`} aria-label={`${row.title} 수정`}><Pencil aria-hidden="true" className="size-4" /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
