"use client";

import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@daegwang/web-ui/components/ui/button";
import { saveChurchPageAction, saveNewcomerEducationAction, saveVisionPageAction, type FixedPageActionState } from "../../features/pages/actions";
import type { ChurchPageContent, NewcomerEducationContent, VisionPageContent } from "@daegwang/contracts/features/pages/content";
import { pageStatusLabels } from "@daegwang/contracts/features/pages/schema";

const initialState: FixedPageActionState = {};
type Props =
  | { variant: "church"; content: ChurchPageContent; status: keyof typeof pageStatusLabels }
  | { variant: "vision"; content: VisionPageContent; status: keyof typeof pageStatusLabels }
  | { variant: "newcomerEducation"; content: NewcomerEducationContent; status: keyof typeof pageStatusLabels };

export function FixedPageForm(props: Props) {
  const action = props.variant === "church" ? saveChurchPageAction : props.variant === "vision" ? saveVisionPageAction : saveNewcomerEducationAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const error = (name: string) => state.errors?.[name]?.[0];
  const field = (name: string, label: string, value: string, multiline = false) => (
    <TextField key={name} fullWidth required name={name} label={label} defaultValue={value} multiline={multiline} minRows={multiline ? 4 : undefined} error={Boolean(error(name))} helperText={error(name)} />
  );

  return (
    <form action={formAction} data-unsaved-warning className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">
        {state.message ? <Alert severity={state.success ? "success" : "error"}>{state.message}</Alert> : null}
        {field("heroTitle", "대표 제목", props.content.heroTitle)}
        {field("heroDescription", "대표 설명", props.content.heroDescription, true)}
        {props.variant === "church" ? <>
          <div className="grid gap-6 sm:grid-cols-2">{field("sinceLabel", "시작 연도 표기", props.content.sinceLabel)}{field("motto", "교회 표어", props.content.motto, true)}</div>
          {field("sectionTitle", "소개 제목", props.content.sectionTitle)}
          {field("body", "소개 내용", props.content.body, true)}
          <h2 className="border-t border-border pt-6 text-lg font-extrabold">교회가 소중히 여기는 가치</h2>
          {props.content.values.map((value, index) => <div key={index} className="grid gap-6 rounded-2xl bg-background-muted p-5 sm:grid-cols-[0.8fr_1.2fr]">{field(`value${index + 1}Title`, `${index + 1}번째 가치 제목`, value.title)}{field(`value${index + 1}Description`, `${index + 1}번째 가치 설명`, value.description, true)}</div>)}
        </> : props.variant === "vision" ? <>
          <div className="grid gap-6 sm:grid-cols-2">{field("philosophy", "목회철학", props.content.philosophy, true)}{field("motto", "교회 표어", props.content.motto, true)}</div>
          {field("directionTitle", "방향 제목", props.content.directionTitle)}
          {field("directionDescription", "방향 설명", props.content.directionDescription, true)}
          <div className="grid gap-6 sm:grid-cols-3">{props.content.directions.map((value, index) => field(`direction${index + 1}`, `${index + 1}번째 방향`, value))}</div>
        </> : <>
          {field("processTitle", "과정 영역 제목", props.content.processTitle)}
          <div className="grid gap-6 sm:grid-cols-3">{field("duration", "교육 기간", props.content.duration, true)}{field("location", "교육 장소", props.content.location, true)}{field("leader", "담당자", props.content.leader, true)}</div>
          {field("applicationInfo", "신청 안내", props.content.applicationInfo, true)}
          <h2 className="border-t border-border pt-6 text-lg font-extrabold">교육 단계</h2>
          {props.content.steps.map((step, index) => <div key={index} className="grid gap-6 rounded-2xl bg-background-muted p-5 sm:grid-cols-[0.7fr_1.3fr]">{field(`step${index + 1}Title`, `STEP ${index + 1} 제목`, step.title)}{field(`step${index + 1}Description`, `STEP ${index + 1} 설명`, step.description, true)}</div>)}
        </>}
      </Paper>
      <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-extrabold">공개 설정</h2>
        <TextField select fullWidth size="small" label="상태" name="status" defaultValue={props.status}>{Object.entries(pageStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
        <Alert severity="info">공개 상태로 저장하면 홈페이지에 즉시 반영됩니다.</Alert>
        <div className="grid gap-2 pt-2"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "저장 중" : "저장"}</Button><Button asChild variant="secondary"><Link href="/admin/pages">목록으로</Link></Button></div>
      </Paper>
    </form>
  );
}
