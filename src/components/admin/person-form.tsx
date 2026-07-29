"use client";

import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Save, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { createPersonAction, updatePersonAction, type PersonActionState } from "@/features/people/actions";

export type PersonFormValues = {
  id?: string;
  name?: string;
  position?: string;
  ministry?: string;
  introduction?: string;
  careerText?: string;
  quote?: string;
  isSeniorPastor?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
  profileImageName?: string;
  profileImageUrl?: string;
};

const initialState: PersonActionState = {};

export function PersonForm({ initialValues = {} }: { initialValues?: PersonFormValues }) {
  const action = useMemo(() => (initialValues.id ? updatePersonAction.bind(null, initialValues.id) : createPersonAction), [initialValues.id]);
  const [state, formAction, pending] = useActionState(action, initialState);
  const error = (name: string) => state.errors?.[name]?.[0];

  return (
    <form action={formAction} data-unsaved-warning className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">
        {state.message ? <Alert severity="error">{state.message}</Alert> : null}
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField fullWidth required label="이름" name="name" defaultValue={initialValues.name ?? ""} error={Boolean(error("name"))} helperText={error("name")} />
          <TextField fullWidth required label="직분" name="position" defaultValue={initialValues.position ?? ""} error={Boolean(error("position"))} helperText={error("position") ?? "예: 담임목사, 전도사"} />
        </div>
        <TextField fullWidth label="담당 사역" name="ministry" defaultValue={initialValues.ministry ?? ""} error={Boolean(error("ministry"))} helperText={error("ministry") ?? "예: 교구, 다음세대, 찬양"} />
        <TextField fullWidth multiline minRows={8} label="소개" name="introduction" defaultValue={initialValues.introduction ?? ""} error={Boolean(error("introduction"))} helperText={error("introduction")} />
        <TextField fullWidth multiline minRows={5} label="약력" name="careerText" defaultValue={initialValues.careerText ?? ""} error={Boolean(error("careerText"))} helperText={error("careerText") ?? "약력 한 항목당 한 줄씩 입력하세요."} />
        <TextField fullWidth multiline minRows={3} label="인용문·목회 메시지" name="quote" defaultValue={initialValues.quote ?? ""} error={Boolean(error("quote"))} helperText={error("quote")} />
        <div className={`rounded-2xl border border-dashed p-6 ${error("profileImage") ? "border-red-500" : "border-border"}`}>
          <div className="flex flex-col gap-5 sm:flex-row">
            {initialValues.profileImageUrl ? <Image src={initialValues.profileImageUrl} alt="현재 프로필" width={160} height={200} className="aspect-[4/5] w-32 rounded-2xl object-cover" /> : <div className="flex aspect-[4/5] w-32 items-center justify-center rounded-2xl bg-background-muted"><UserRound aria-hidden="true" className="size-10 text-primary-600" /></div>}
            <div className="min-w-0 flex-1">
              <label htmlFor="profileImage" className="font-extrabold">프로필 이미지 {initialValues.profileImageUrl ? "교체" : "업로드"}</label>
              <p className="mt-1 text-sm text-text-secondary">JPG, PNG, WebP · 최대 5MB · 세로형 사진 권장</p>
              <input id="profileImage" name="profileImage" type="file" accept="image/jpeg,image/png,image/webp" className="mt-4 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-bold file:text-primary-700" />
              {error("profileImage") ? <p className="mt-2 text-sm text-red-600">{error("profileImage")}</p> : null}
              {initialValues.profileImageUrl ? <FormControlLabel className="mt-3!" control={<Checkbox name="removeProfileImage" />} label="새 사진 없이 기존 사진 삭제" /> : null}
            </div>
          </div>
        </div>
      </Paper>
      <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-extrabold">노출 설정</h2>
        <TextField fullWidth type="number" size="small" label="노출 순서" name="sortOrder" defaultValue={initialValues.sortOrder ?? 0} error={Boolean(error("sortOrder"))} helperText={error("sortOrder") ?? "숫자가 작을수록 먼저 표시됩니다."} slotProps={{ htmlInput: { min: 0, max: 9999 } }} />
        <div className="grid gap-1">
          <FormControlLabel control={<Checkbox name="isSeniorPastor" defaultChecked={initialValues.isSeniorPastor} />} label="담임목사" />
          <FormControlLabel control={<Checkbox name="isVisible" defaultChecked={initialValues.isVisible ?? true} />} label="홈페이지에 공개" />
        </div>
        <Alert severity="info">담임목사는 공개 페이지 상단에 크게 표시됩니다.</Alert>
        <div className="grid gap-2 pt-2">
          <Button type="submit" disabled={pending}>{pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}{pending ? "업로드 및 저장 중" : "저장"}</Button>
          <Button asChild variant="secondary"><Link href="/admin/people">취소</Link></Button>
        </div>
      </Paper>
    </form>
  );
}
