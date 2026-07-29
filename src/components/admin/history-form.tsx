"use client";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { createHistoryAction, updateHistoryAction, type HistoryActionState } from "@/features/history/actions";

export type HistoryFormValues = { id?: string; year?: number; month?: number | null; day?: number | null; title?: string; content?: string; sortOrder?: number; isVisible?: boolean };
export function HistoryForm({ initialValues = {} }: { initialValues?: HistoryFormValues }) {
  const action = useMemo(() => initialValues.id ? updateHistoryAction.bind(null, initialValues.id) : createHistoryAction, [initialValues.id]);
  const [state, formAction, pending] = useActionState(action, {} as HistoryActionState); const error = (n: string) => state.errors?.[n]?.[0];
  return <form action={formAction} className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
    <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">{state.message ? <Alert severity="error">{state.message}</Alert> : null}<div className="grid gap-6 sm:grid-cols-3"><TextField required type="number" label="연도" name="year" defaultValue={initialValues.year ?? new Date().getFullYear()} error={Boolean(error("year"))} helperText={error("year")} /><TextField type="number" label="월" name="month" defaultValue={initialValues.month ?? ""} error={Boolean(error("month"))} helperText={error("month")} /><TextField type="number" label="일" name="day" defaultValue={initialValues.day ?? ""} error={Boolean(error("day"))} helperText={error("day")} /></div><TextField required fullWidth label="연혁 제목" name="title" defaultValue={initialValues.title ?? ""} error={Boolean(error("title"))} helperText={error("title")} /><TextField fullWidth multiline minRows={8} label="상세 내용" name="content" defaultValue={initialValues.content ?? ""} error={Boolean(error("content"))} helperText={error("content") ?? "행사나 변화의 상세 내용을 입력하세요."} /></Paper>
    <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24"><h2 className="font-extrabold">노출 설정</h2><TextField type="number" size="small" label="같은 날짜 내 순서" name="sortOrder" defaultValue={initialValues.sortOrder ?? 0} error={Boolean(error("sortOrder"))} helperText={error("sortOrder") ?? "숫자가 작을수록 먼저 표시됩니다."} /><FormControlLabel control={<Checkbox name="isVisible" defaultChecked={initialValues.isVisible ?? true} />} label="홈페이지에 공개" /><div className="grid gap-2 pt-2"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "저장 중" : "저장"}</Button><Button asChild variant="secondary"><Link href="/admin/pages/history">취소</Link></Button></div></Paper>
  </form>;
}
