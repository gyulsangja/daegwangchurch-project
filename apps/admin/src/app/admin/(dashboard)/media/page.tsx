import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Database, HardDrive, ShieldCheck, Trash2 } from "lucide-react";
import { ConfirmSubmitButton } from "../../../../components/admin/confirm-submit-button";
import { cleanupUnreferencedMediaAction } from "../../../../features/media/actions";
import {
  getMediaManagementData,
  MEDIA_CLEANUP_GRACE_HOURS,
} from "@daegwang/server/features/media/queries";
import { requireSuperAdmin } from "../../../../lib/auth/permissions";

function bytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

const date = (value: Date) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(value);

function Metric({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <Paper variant="outlined" className="flex items-center gap-4 p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="mt-1 text-xl font-extrabold">{value}</p>
      </div>
    </Paper>
  );
}

export default async function MediaManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ cleaned?: string; storageFailures?: string }>;
}) {
  await requireSuperAdmin();
  const { cleaned, storageFailures } = await searchParams;
  const data = await getMediaManagementData();
  const failureCount = Number(storageFailures) || 0;

  return (
    <div className="mx-auto max-w-[90rem]">
      <p className="text-sm font-bold text-primary-700">MEDIA MANAGEMENT</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">미디어 관리</h1>
      <p className="mt-2 text-text-secondary">
        업로드 기록과 콘텐츠 참조 관계를 확인하고 사용하지 않는 파일을 정리합니다.
      </p>

      {cleaned !== undefined ? (
        <Alert severity={failureCount ? "warning" : "success"} className="mt-6!">
          미사용 미디어 {Number(cleaned) || 0}건을 정리했습니다.
          {failureCount
            ? ` Storage 객체 ${failureCount}건은 삭제하지 못했으므로 Supabase 정책과 접속 상태를 확인해 주세요.`
            : " Storage 객체 정리도 완료했습니다."}
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Database} label="사용 중 미디어" value={`${data.totalCount}건`} />
        <Metric icon={HardDrive} label="사용 중 용량" value={bytes(data.totalBytes)} />
        <Metric icon={Trash2} label="정리 대상" value={`${data.candidateCount}건`} />
        <Metric icon={ShieldCheck} label="정리 가능 용량" value={bytes(data.candidateBytes)} />
      </div>

      <Paper
        component="section"
        variant="outlined"
        className="mt-6 flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 className="font-extrabold">미사용 파일 일괄 정리</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            업로드 후 {MEDIA_CLEANUP_GRACE_HOURS}시간이 지났고 주보, 공지, 앨범, 인물,
            사역 등 어느 콘텐츠에서도 참조하지 않는 파일만 영구 삭제합니다.
          </p>
        </div>
        <form action={cleanupUnreferencedMediaAction}>
          <ConfirmSubmitButton
            label={`미사용 ${data.candidateCount}건 정리`}
            message={`어떤 콘텐츠에서도 사용하지 않는 미디어 ${data.candidateCount}건(${bytes(data.candidateBytes)})을 DB와 Storage에서 영구 삭제합니다. 계속하시겠습니까?`}
          />
        </form>
      </Paper>

      {data.candidates.length ? (
        <TableContainer component={Paper} variant="outlined" className="mt-6">
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell>등록일</TableCell>
                <TableCell>파일명</TableCell>
                <TableCell>형식</TableCell>
                <TableCell>버킷·경로</TableCell>
                <TableCell align="right">용량</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.candidates.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell className="whitespace-nowrap!">{date(item.createdAt)}</TableCell>
                  <TableCell className="max-w-64 truncate! font-bold">{item.originalName}</TableCell>
                  <TableCell>{item.mimeType}</TableCell>
                  <TableCell>
                    <span className="block max-w-sm truncate text-sm text-text-secondary">
                      {item.bucket}/{item.objectPath}
                    </span>
                  </TableCell>
                  <TableCell align="right" className="whitespace-nowrap!">{bytes(item.sizeBytes)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={item.deletedAt ? "default" : "warning"}
                      label={item.deletedAt ? "삭제 기록" : "미참조"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper variant="outlined" className="mt-6 p-10 text-center text-text-secondary">
          현재 정리할 미사용 미디어가 없습니다.
        </Paper>
      )}
    </div>
  );
}
