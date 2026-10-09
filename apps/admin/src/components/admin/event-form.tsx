"use client";

import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo } from "react";

import { Button } from "@daegwang/web-ui/components/ui/button";
import { createEventAction, updateEventAction, type EventActionState } from "../../features/events/actions";
import { eventStatusLabels } from "@daegwang/contracts/features/events/schema";

export type EventFormValues = {
  id?: string;
  title?: string;
  category?: string;
  startsAt?: string;
  endsAt?: string;
  isAllDay?: boolean;
  location?: string;
  ministryName?: string;
  description?: string;
  status?: keyof typeof eventStatusLabels;
};

const initialState: EventActionState = {};

export function EventForm({ initialValues = {} }: { initialValues?: EventFormValues }) {
  const action = useMemo(() => (initialValues.id ? updateEventAction.bind(null, initialValues.id) : createEventAction), [initialValues.id]);
  const [state, formAction, pending] = useActionState(action, initialState);
  const error = (name: string) => state.errors?.[name]?.[0];
  return (
    <form action={formAction} data-unsaved-warning className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">
        {state.message ? <Alert severity="error">{state.message}</Alert> : null}
        <TextField fullWidth required label="일정 제목" name="title" defaultValue={initialValues.title ?? ""} error={Boolean(error("title"))} helperText={error("title")} />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField fullWidth required label="분류" name="category" defaultValue={initialValues.category ?? "교회행사"} error={Boolean(error("category"))} helperText={error("category") ?? "예: 예배, 교육, 교회행사"} />
          <TextField fullWidth label="담당 부서" name="ministryName" defaultValue={initialValues.ministryName ?? ""} error={Boolean(error("ministryName"))} helperText={error("ministryName")} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField fullWidth required type="datetime-local" label="시작" name="startsAt" defaultValue={initialValues.startsAt ?? ""} error={Boolean(error("startsAt"))} helperText={error("startsAt")} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth type="datetime-local" label="종료" name="endsAt" defaultValue={initialValues.endsAt ?? ""} error={Boolean(error("endsAt"))} helperText={error("endsAt") ?? "종료 시간이 없으면 비워둘 수 있습니다."} slotProps={{ inputLabel: { shrink: true } }} />
        </div>
        <FormControlLabel control={<Checkbox name="isAllDay" defaultChecked={initialValues.isAllDay} />} label="종일 일정" />
        <TextField fullWidth label="장소" name="location" defaultValue={initialValues.location ?? ""} error={Boolean(error("location"))} helperText={error("location")} />
        <TextField fullWidth multiline minRows={8} label="일정 설명" name="description" defaultValue={initialValues.description ?? ""} error={Boolean(error("description"))} helperText={error("description") ?? "준비물, 대상, 신청 방법 등 상세 안내를 입력하세요."} />
      </Paper>
      <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-extrabold">홈페이지·앱 공통 공개 설정</h2>
        <TextField select fullWidth size="small" label="상태" name="status" defaultValue={initialValues.status ?? "DRAFT"} error={Boolean(error("status"))} helperText={error("status")}>
          {Object.entries(eventStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <Alert severity="info">한 번 등록한 일정을 홈페이지와 앱에서 함께 사용합니다. 날짜·장소 수정과 비공개도 함께 반영됩니다.</Alert>
        <div className="grid gap-2 pt-2">
          <Button type="submit" disabled={pending}>{pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}{pending ? "저장 중" : "저장"}</Button>
          <Button asChild variant="secondary"><Link href="/admin/events">취소</Link></Button>
        </div>
      </Paper>
    </form>
  );
}
