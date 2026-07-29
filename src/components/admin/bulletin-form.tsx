"use client";

import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { ExternalLink, FileText, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { createBulletinAction, updateBulletinAction, type BulletinActionState } from "@/features/bulletins/actions";
import { bulletinStatusLabels } from "@/features/bulletins/schema";

export type BulletinFormValues = {
  id?: string;
  title?: string;
  worshipDate?: string;
  summary?: string;
  status?: keyof typeof bulletinStatusLabels;
  pdfName?: string;
  pdfUrl?: string;
};

const initialState: BulletinActionState = {};

export function BulletinForm({ initialValues = {} }: { initialValues?: BulletinFormValues }) {
  const action = useMemo(
    () => (initialValues.id ? updateBulletinAction.bind(null, initialValues.id) : createBulletinAction),
    [initialValues.id],
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  const error = (name: string) => state.errors?.[name]?.[0];

  return (
    <form action={formAction} data-unsaved-warning className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">
        {state.message ? <Alert severity="error">{state.message}</Alert> : null}
        <TextField fullWidth required label="제목" name="title" defaultValue={initialValues.title ?? ""} error={Boolean(error("title"))} helperText={error("title")} />
        <TextField fullWidth required type="date" label="예배 날짜" name="worshipDate" defaultValue={initialValues.worshipDate ?? new Date().toISOString().slice(0, 10)} error={Boolean(error("worshipDate"))} helperText={error("worshipDate")} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField fullWidth multiline minRows={5} label="주보 요약" name="summary" defaultValue={initialValues.summary ?? ""} error={Boolean(error("summary"))} helperText={error("summary") ?? "공개 목록과 상세 화면에 표시할 간단한 설명입니다."} />
        <div className={`rounded-2xl border border-dashed p-6 ${error("pdfFile") ? "border-red-500" : "border-border"}`}>
          <div className="flex items-start gap-4">
            <FileText aria-hidden="true" className="mt-1 size-7 shrink-0 text-primary-600" />
            <div className="min-w-0 flex-1">
              <label htmlFor="pdfFile" className="font-extrabold">주보 PDF {initialValues.id ? "교체" : "업로드"}</label>
              <p className="mt-1 text-sm text-text-secondary">PDF 형식, 최대 10MB</p>
              <input id="pdfFile" name="pdfFile" type="file" accept="application/pdf,.pdf" required={!initialValues.id} className="mt-4 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-bold file:text-primary-700" />
              {error("pdfFile") ? <p className="mt-2 text-sm text-red-600">{error("pdfFile")}</p> : null}
              {initialValues.pdfName ? (
                <div className="mt-4 rounded-xl bg-background-muted p-3 text-sm">
                  <p className="truncate font-bold">현재 파일: {initialValues.pdfName}</p>
                  {initialValues.pdfUrl ? <a href={initialValues.pdfUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary-700 hover:underline">PDF 확인 <ExternalLink aria-hidden="true" className="size-3" /></a> : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Paper>
      <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-extrabold">공개 설정</h2>
        <TextField select fullWidth size="small" label="상태" name="status" defaultValue={initialValues.status ?? "DRAFT"} error={Boolean(error("status"))} helperText={error("status")}>
          {Object.entries(bulletinStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <Alert severity="info">공개 상태로 저장하면 교회소식의 주보 페이지에 즉시 표시됩니다.</Alert>
        <div className="grid gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
            {pending ? "업로드 및 저장 중" : "저장"}
          </Button>
          <Button asChild variant="secondary"><Link href="/admin/bulletins">취소</Link></Button>
        </div>
      </Paper>
    </form>
  );
}
