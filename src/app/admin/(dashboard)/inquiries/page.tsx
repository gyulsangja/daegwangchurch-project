import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import {
  purgeExpiredInquiriesAction,
} from "@/features/inquiries/actions";
import { getInquiryRetentionDays } from "@/features/inquiries/policy";
import {
  getAdminInquiries,
  getExpiredInquiryCount,
} from "@/features/inquiries/queries";
import {
  inquiryStatusLabels,
  inquiryTypeLabels,
} from "@/features/inquiries/schema";
import { requireSuperAdmin } from "@/lib/auth/permissions";

const date = (value: Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; purged?: string }>;
}) {
  await requireSuperAdmin();
  const { q = "", status = "", purged } = await searchParams;
  const retentionDays = getInquiryRetentionDays();
  const [rows, expiredCount] = await Promise.all([
    getAdminInquiries(q, status),
    getExpiredInquiryCount(retentionDays),
  ]);

  return (
    <div className="mx-auto max-w-[90rem]">
      <p className="text-sm font-bold text-primary-700">INQUIRY MANAGEMENT</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">문의 관리</h1>
      <p className="mt-2 text-text-secondary">
        개인정보 보호를 위해 최고 관리자만 문의를 확인할 수 있습니다.
      </p>

      {purged !== undefined ? (
        <Alert severity="success" className="mt-6!">
          보관기간이 지난 문의 {Number(purged) || 0}건을 영구 삭제했습니다.
        </Alert>
      ) : null}

      <Paper
        component="section"
        variant="outlined"
        className="mt-8 flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex gap-4">
          <ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary-700" />
          <div>
            <h2 className="font-extrabold">개인정보 보관기간 관리</h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              처리 완료일로부터 {retentionDays}일이 지난 문의는 삭제 대상입니다.
              현재 {expiredCount}건이 있습니다.
            </p>
          </div>
        </div>
        <form action={purgeExpiredInquiriesAction}>
          <ConfirmSubmitButton
            label={`만료 문의 ${expiredCount}건 정리`}
            message={`${retentionDays}일이 지난 처리 완료 문의 ${expiredCount}건과 내부 메모를 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`}
          />
        </form>
      </Paper>

      <Paper
        component="form"
        variant="outlined"
        className="mt-5 grid gap-4 p-4 sm:grid-cols-[1fr_12rem_auto]"
      >
        <TextField
          name="q"
          defaultValue={q}
          size="small"
          label="이름·연락처·내용 검색"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="size-4" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          name="status"
          defaultValue={status}
          size="small"
          label="처리 상태"
        >
          <MenuItem value="">전체</MenuItem>
          {Object.entries(inquiryStatusLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </Paper>

      {rows.length ? (
        <TableContainer component={Paper} variant="outlined" className="mt-5">
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>접수일</TableCell>
                <TableCell>유형</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>제목·내용</TableCell>
                <TableCell>연락처</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell className="whitespace-nowrap!">{date(row.createdAt)}</TableCell>
                  <TableCell>{inquiryTypeLabels[row.type]}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      className="font-extrabold hover:text-primary-700"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/inquiries/${row.id}`} className="block max-w-sm">
                      <span className="block truncate font-bold">
                        {row.title || "제목 없음"}
                      </span>
                      <span className="mt-1 block truncate text-sm text-text-secondary">
                        {row.content}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{row.phone || row.email || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={inquiryStatusLabels[row.status]}
                      color={
                        row.status === "NEW"
                          ? "error"
                          : row.status === "COMPLETED"
                            ? "success"
                            : "default"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper variant="outlined" className="mt-5 p-10 text-center text-text-secondary">
          조건에 맞는 문의가 없습니다.
        </Paper>
      )}
    </div>
  );
}
