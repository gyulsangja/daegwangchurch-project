import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ministryStatusLabels, ministryTypeLabels } from "@/features/ministries/schema";
type Row = { id: string; name: string; slug: string; type: keyof typeof ministryTypeLabels; status: keyof typeof ministryStatusLabels; sortOrder: number; audience: string | null };
export function MinistryTable({ rows }: { rows: Row[] }) { if (!rows.length) return <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">등록된 사역이 없습니다.</Paper>; return <TableContainer component={Paper} variant="outlined" className="mt-5"><Table sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>사역명</TableCell><TableCell>구분</TableCell><TableCell>대상</TableCell><TableCell>주소</TableCell><TableCell>순서</TableCell><TableCell>상태</TableCell><TableCell align="right">관리</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id} hover><TableCell><Link href={`/admin/ministries/${row.id}/edit`} className="font-extrabold hover:text-primary-700">{row.name}</Link></TableCell><TableCell>{ministryTypeLabels[row.type]}</TableCell><TableCell>{row.audience || "-"}</TableCell><TableCell className="font-mono! text-xs!">{row.slug}</TableCell><TableCell>{row.sortOrder}</TableCell><TableCell><Chip size="small" label={ministryStatusLabels[row.status]} color={row.status === "PUBLISHED" ? "primary" : "default"} /></TableCell><TableCell align="right"><Button asChild size="icon" variant="ghost"><Link href={`/admin/ministries/${row.id}/edit`} aria-label={`${row.name} 수정`}><Pencil className="size-4" /></Link></Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>; }
