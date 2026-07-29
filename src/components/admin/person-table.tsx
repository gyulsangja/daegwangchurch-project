import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Pencil, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getPublicStorageUrl } from "@/lib/storage/public-url";

type PersonRow = {
  id: string;
  name: string;
  position: string;
  ministry: string | null;
  isSeniorPastor: boolean;
  isVisible: boolean;
  sortOrder: number;
  profileImage: { bucket: string; objectPath: string; altText: string | null } | null;
};

export function PersonTable({ rows }: { rows: PersonRow[] }) {
  if (rows.length === 0) return <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">등록된 교역자가 없습니다.</Paper>;
  return (
    <TableContainer component={Paper} variant="outlined" className="mt-5">
      <Table sx={{ minWidth: 850 }} aria-label="교역자 목록">
        <TableHead><TableRow><TableCell>사진</TableCell><TableCell>이름</TableCell><TableCell>직분</TableCell><TableCell>담당 사역</TableCell><TableCell>순서</TableCell><TableCell>공개</TableCell><TableCell align="right">관리</TableCell></TableRow></TableHead>
        <TableBody>{rows.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>{row.profileImage ? <Image src={getPublicStorageUrl(row.profileImage.bucket, row.profileImage.objectPath)} alt={row.profileImage.altText ?? ""} width={48} height={60} className="aspect-[4/5] rounded-lg object-cover" /> : <div className="flex h-[60px] w-12 items-center justify-center rounded-lg bg-background-muted"><UserRound aria-hidden="true" className="size-5 text-text-secondary" /></div>}</TableCell>
            <TableCell><Link href={`/admin/people/${row.id}/edit`} className="font-bold hover:text-primary-700">{row.name}</Link>{row.isSeniorPastor ? <Chip label="담임" size="small" color="primary" className="ml-2!" /> : null}</TableCell>
            <TableCell>{row.position}</TableCell><TableCell>{row.ministry || "-"}</TableCell><TableCell>{row.sortOrder}</TableCell>
            <TableCell><Chip label={row.isVisible ? "공개" : "비공개"} size="small" color={row.isVisible ? "primary" : "default"} /></TableCell>
            <TableCell align="right"><IconButton component="a" href={`/admin/people/${row.id}/edit`} aria-label={`${row.name} 수정`}><Pencil aria-hidden="true" className="size-4" /></IconButton></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </TableContainer>
  );
}

