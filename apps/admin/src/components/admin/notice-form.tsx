"use client";

import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { ExternalLink, LoaderCircle, Paperclip, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo } from "react";

import { Button } from "@daegwang/web-ui/components/ui/button";
import { createNoticeAction, updateNoticeAction, type NoticeActionState } from "../../features/notices/actions";
import { noticeStatusLabels } from "@daegwang/contracts/features/notices/schema";

export type NoticeFormValues = {
  id?: string;
  title?: string;
  category?: string;
  body?: string;
  status?: keyof typeof noticeStatusLabels;
  isImportant?: boolean;
  isPinned?: boolean;
  publishStartsAt?: string;
  publishEndsAt?: string;
  attachments?: Array<{ id: string; name: string; sizeBytes: number; url: string }>;
};

const initialState: NoticeActionState = {};

export function NoticeForm({ initialValues = {} }: { initialValues?: NoticeFormValues }) {
  const action = useMemo(
    () => (initialValues.id ? updateNoticeAction.bind(null, initialValues.id) : createNoticeAction),
    [initialValues.id],
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  const error = (name: string) => state.errors?.[name]?.[0];

  return (
    <form action={formAction} data-unsaved-warning className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">
        {state.message ? <Alert severity="error">{state.message}</Alert> : null}
        <TextField fullWidth required label="제목" name="title" defaultValue={initialValues.title ?? ""} error={Boolean(error("title"))} helperText={error("title")} />
        <TextField fullWidth required label="분류" name="category" defaultValue={initialValues.category ?? "교회소식"} error={Boolean(error("category"))} helperText={error("category") ?? "예: 교회소식, 예배안내, 새가족, 공동기도. 공동기도도 공개 공지이며 홈페이지에 노출됩니다."} />
        <TextField fullWidth required multiline minRows={14} label="본문" name="body" defaultValue={initialValues.body ?? ""} error={Boolean(error("body"))} helperText={error("body") ?? "줄바꿈을 포함한 일반 텍스트로 저장됩니다."} />
        {initialValues.attachments?.length ? (
          <section>
            <h2 className="text-lg font-extrabold">등록된 첨부파일</h2>
            <div className="mt-4 grid gap-3">
              {initialValues.attachments.map((attachment) => (
                <div key={attachment.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><a href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 font-bold text-primary-700 hover:underline"><Paperclip aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">{attachment.name}</span><ExternalLink aria-hidden="true" className="size-3 shrink-0" /></a><p className="mt-1 text-xs text-text-secondary">{(attachment.sizeBytes / 1024).toFixed(1)} KB</p></div>
                  <FormControlLabel control={<Checkbox name="removeAttachmentIds" value={attachment.id} />} label="저장할 때 삭제" />
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <div className={`rounded-2xl border border-dashed p-6 ${error("attachmentFiles") ? "border-red-500" : "border-border"}`}>
          <div className="flex items-start gap-4">
            <Paperclip aria-hidden="true" className="mt-1 size-7 shrink-0 text-primary-600" />
            <div className="min-w-0 flex-1">
              <label htmlFor="attachmentFiles" className="font-extrabold">첨부파일 추가</label>
              <p className="mt-1 text-sm text-text-secondary">PDF, 이미지, DOCX, XLSX, PPTX, HWP, TXT · 각 5MB 이하 · 전체 10MB 이하</p>
              <input id="attachmentFiles" name="attachmentFiles" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.pptx,.hwp,.txt" multiple className="mt-4 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-bold file:text-primary-700" />
              {error("attachmentFiles") ? <p className="mt-2 text-sm text-red-600">{error("attachmentFiles")}</p> : null}
            </div>
          </div>
        </div>
      </Paper>
      <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-extrabold">공개 설정</h2>
        <TextField select fullWidth size="small" label="상태" name="status" defaultValue={initialValues.status ?? "DRAFT"} error={Boolean(error("status"))} helperText={error("status")}>
          {Object.entries(noticeStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <div className="grid gap-1">
          <FormControlLabel control={<Checkbox name="isImportant" defaultChecked={initialValues.isImportant} />} label="중요 공지" />
          <FormControlLabel control={<Checkbox name="isPinned" defaultChecked={initialValues.isPinned} />} label="목록 상단 고정" />
          <p className="text-sm leading-6 text-text-secondary">푸시 연결 후에는 새로 공개한 중요 공지만 수신에 동의한 교인에게 한 번 안내합니다. 밤 10시~오전 8시는 보류하며, 본문 수정은 다시 발송하지 않습니다. 목록 상단 고정은 푸시와 관계없습니다.</p>
        </div>
        <TextField fullWidth size="small" type="datetime-local" label="게시 시작" name="publishStartsAt" defaultValue={initialValues.publishStartsAt ?? ""} error={Boolean(error("publishStartsAt"))} helperText={error("publishStartsAt")} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField fullWidth size="small" type="datetime-local" label="게시 종료" name="publishEndsAt" defaultValue={initialValues.publishEndsAt ?? ""} error={Boolean(error("publishEndsAt"))} helperText={error("publishEndsAt")} slotProps={{ inputLabel: { shrink: true } }} />
        <div className="grid gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
            {pending ? "저장 중" : "저장"}
          </Button>
          <Button asChild variant="secondary"><Link href="/admin/notices">취소</Link></Button>
        </div>
      </Paper>
    </form>
  );
}
