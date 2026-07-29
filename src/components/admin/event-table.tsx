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

import { eventStatusLabels } from "@/features/events/schema";

type EventRow = {
  id: string;
  title: string;
  category: string;
  startsAt: Date;
  isAllDay: boolean;
  location: string | null;
  status: keyof typeof eventStatusLabels;
};

export function EventTable({ rows }: { rows: EventRow[] }) {
  if (rows.length === 0) return <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">등록된 교회 일정이 없습니다.</Paper>;
  return (
    <TableContainer component={Paper} variant="outlined" className="mt-5">
      <Table sx={{ minWidth: 860 }} aria-label="교회 일정 목록">
        <TableHead><TableRow><TableCell>제목</TableCell><TableCell>분류</TableCell><TableCell>시작</TableCell><TableCell>장소</TableCell><TableCell>상태</TableCell><TableCell align="right">관리</TableCell></TableRow></TableHead>
        <TableBody>{rows.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell><Link href={`/admin/events/${row.id}/edit`} className="font-bold hover:text-primary-700">{row.title}</Link></TableCell>
            <TableCell>{row.category}</TableCell>
            <TableCell>{row.startsAt.toLocaleString("ko-KR", row.isAllDay ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" })}</TableCell>
            <TableCell>{row.location || "-"}</TableCell>
            <TableCell><Chip size="small" label={eventStatusLabels[row.status]} color={row.status === "PUBLISHED" ? "primary" : "default"} /></TableCell>
            <TableCell align="right"><IconButton component="a" href={`/admin/events/${row.id}/edit`} aria-label={`${row.title} 수정`}><Pencil aria-hidden="true" className="size-4" /></IconButton></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </TableContainer>
  );
}

