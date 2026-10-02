"use client";

import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Save } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import {
  createWorshipAction,
  updateWorshipAction,
  type WorshipActionState,
} from "../../features/worship/actions";
import { contentStatusLabels, worshipTypeLabels } from "@daegwang/contracts/features/worship/schema";
import { parseYouTubeUrl } from "@daegwang/contracts/lib/youtube/parser";
import { Button } from "@daegwang/web-ui/components/ui/button";

export type WorshipFormValues = {
  id?: string;
  type?: keyof typeof worshipTypeLabels;
  title?: string;
  contentDate?: string;
  youtubeUrl?: string;
  preacher?: string;
  sermonTitle?: string;
  scripture?: string;
  description?: string;
  summary?: string;
  status?: keyof typeof contentStatusLabels;
  isPinned?: boolean;
};

const initialState: WorshipActionState = {};

export function WorshipForm({ initialValues = {} }: { initialValues?: WorshipFormValues }) {
  const action = useMemo(
    () => (initialValues.id ? updateWorshipAction.bind(null, initialValues.id) : createWorshipAction),
    [initialValues.id],
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  const [youtubeUrl, setYoutubeUrl] = useState(initialValues.youtubeUrl ?? "");
  const youtube = parseYouTubeUrl(youtubeUrl);
  const error = (name: string) => state.errors?.[name]?.[0];

  return (
    <form action={formAction} data-unsaved-warning className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">
        {state.message ? <Alert severity="error">{state.message}</Alert> : null}
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField select fullWidth label="예배 유형" name="type" defaultValue={initialValues.type ?? "SUNDAY_MORNING"} error={Boolean(error("type"))} helperText={error("type")}>
            {Object.entries(worshipTypeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="콘텐츠 날짜" name="contentDate" type="date" defaultValue={initialValues.contentDate ?? new Date().toISOString().slice(0, 10)} error={Boolean(error("contentDate"))} helperText={error("contentDate")} slotProps={{ inputLabel: { shrink: true } }} />
        </div>
        <TextField fullWidth label="제목" name="title" defaultValue={initialValues.title ?? ""} error={Boolean(error("title"))} helperText={error("title")} required />
        <TextField fullWidth label="YouTube URL" name="youtubeUrl" value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} error={Boolean(error("youtubeUrl"))} helperText={error("youtubeUrl") ?? "watch, youtu.be, shorts, live URL을 사용할 수 있습니다."} required />
        {youtube ? (
          <div className="grid overflow-hidden rounded-2xl border border-border sm:grid-cols-[12rem_1fr]">
            <Image src={youtube.thumbnailUrl} alt="YouTube 영상 미리보기" width={480} height={270} className="aspect-video h-full w-full object-cover" />
            <div className="p-4 text-sm"><p className="font-bold text-primary-700">영상 인식 완료</p><p className="mt-1 break-all text-text-secondary">ID: {youtube.videoId}</p></div>
          </div>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField fullWidth label="설교자" name="preacher" defaultValue={initialValues.preacher ?? ""} error={Boolean(error("preacher"))} helperText={error("preacher")} />
          <TextField fullWidth label="설교 제목" name="sermonTitle" defaultValue={initialValues.sermonTitle ?? ""} error={Boolean(error("sermonTitle"))} helperText={error("sermonTitle")} />
        </div>
        <TextField fullWidth label="성경 위치" name="scripture" defaultValue={initialValues.scripture ?? ""} error={Boolean(error("scripture"))} helperText={error("scripture") ?? "예: 요한복음 1:1–5. 성경 본문은 입력하지 않습니다."} />
        <TextField fullWidth multiline minRows={5} label="설명" name="description" defaultValue={initialValues.description ?? ""} error={Boolean(error("description"))} helperText={error("description")} />
        <TextField fullWidth multiline minRows={3} label="짧은 요약" name="summary" defaultValue={initialValues.summary ?? ""} error={Boolean(error("summary"))} helperText={error("summary")} />
      </Paper>
      <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-extrabold">홈페이지 공개 설정</h2>
        <TextField select fullWidth size="small" label="상태" name="status" defaultValue={initialValues.status ?? "DRAFT"} error={Boolean(error("status"))} helperText={error("status")}>
          {Object.entries(contentStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <FormControlLabel control={<Checkbox name="isPinned" defaultChecked={initialValues.isPinned} />} label="메인에 우선 노출" />
        <div className="grid gap-2 pt-2">
          <Button type="submit" disabled={pending}>{pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}{pending ? "저장 중…" : "저장"}</Button>
          <Button asChild variant="secondary"><Link href="/admin/worship">취소</Link></Button>
        </div>
      </Paper>
    </form>
  );
}
