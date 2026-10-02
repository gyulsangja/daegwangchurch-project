"use client";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo } from "react";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { createScheduleAction, updateScheduleAction, type ScheduleActionState } from "../../features/schedules/actions";
export type ScheduleFormValues = { id?: string; name?: string; dayLabel?: string; timeLabel?: string; location?: string; note?: string; sortOrder?: number; isVisible?: boolean };
export function ScheduleForm({ initialValues = {} }: { initialValues?: ScheduleFormValues }) { const action = useMemo(() => initialValues.id ? updateScheduleAction.bind(null, initialValues.id) : createScheduleAction, [initialValues.id]); const [state, formAction, pending] = useActionState(action, {} as ScheduleActionState); const error = (n: string) => state.errors?.[n]?.[0]; return <form action={formAction} className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
  <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">{state.message ? <Alert severity="error">{state.message}</Alert> : null}<TextField required fullWidth label="예배명" name="name" defaultValue={initialValues.name ?? ""} error={Boolean(error("name"))} helperText={error("name") ?? "예: 주일 오전예배"} /><div className="grid gap-6 sm:grid-cols-2"><TextField required label="요일" name="dayLabel" defaultValue={initialValues.dayLabel ?? ""} error={Boolean(error("dayLabel"))} helperText={error("dayLabel") ?? "예: 매주 주일"} /><TextField required label="시간" name="timeLabel" defaultValue={initialValues.timeLabel ?? ""} error={Boolean(error("timeLabel"))} helperText={error("timeLabel") ?? "예: 오전 11:00"} /></div><TextField fullWidth label="장소" name="location" defaultValue={initialValues.location ?? ""} error={Boolean(error("location"))} helperText={error("location") ?? "예: 본당"} /><TextField fullWidth multiline minRows={5} label="추가 안내" name="note" defaultValue={initialValues.note ?? ""} error={Boolean(error("note"))} helperText={error("note") ?? "대상이나 참고사항을 입력하세요."} /></Paper>
  <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24"><h2 className="font-extrabold">노출 설정</h2><TextField type="number" size="small" label="노출 순서" name="sortOrder" defaultValue={initialValues.sortOrder ?? 0} error={Boolean(error("sortOrder"))} helperText={error("sortOrder") ?? "숫자가 작을수록 먼저 표시됩니다."} /><FormControlLabel control={<Checkbox name="isVisible" defaultChecked={initialValues.isVisible ?? true} />} label="홈페이지에 공개" /><div className="grid gap-2 pt-2"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "저장 중" : "저장"}</Button><Button asChild variant="secondary"><Link href="/admin/pages/worship-info">취소</Link></Button></div></Paper>
</form>; }
