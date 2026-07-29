"use client";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveSiteSettingAction, type SiteSettingActionState } from "@/features/settings/actions";
import type { PublicSiteSettings } from "@/features/settings/queries";
export function SiteSettingForm({ values }: { values: PublicSiteSettings }) { const [state, action, pending] = useActionState(saveSiteSettingAction, {} as SiteSettingActionState); const error = (name: string) => state.errors?.[name]?.[0]; const field = (name: keyof PublicSiteSettings, label: string, options?: { type?: string; multiline?: boolean; helper?: string; step?: string }) => <TextField key={name} fullWidth name={name} label={label} type={options?.type} multiline={options?.multiline} minRows={options?.multiline ? 4 : undefined} defaultValue={values[name] ?? ""} error={Boolean(error(name))} helperText={error(name) ?? options?.helper} slotProps={options?.step ? { htmlInput: { step: options.step } } : undefined} />; return <form action={action} className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
  <div className="grid gap-6"><Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">{state.message ? <Alert severity={state.success ? "success" : "error"}>{state.message}</Alert> : null}<h2 className="text-xl font-extrabold">기본 정보</h2>{field("siteName", "교회명")}{field("description", "교회·사이트 설명", { multiline: true, helper: "검색 결과와 푸터 소개에 사용됩니다." })}{field("canonicalUrl", "대표 홈페이지 URL", { type: "url", helper: "예: https://daegwangchurch.kr" })}</Paper>
    <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7"><h2 className="text-xl font-extrabold">주소와 연락처</h2>{field("address", "도로명 주소")}{field("addressDetail", "상세 주소")}<div className="grid gap-6 sm:grid-cols-2">{field("phone", "대표 전화", { type: "tel" })}{field("email", "대표 이메일", { type: "email" })}</div><div className="grid gap-6 sm:grid-cols-2">{field("mapLatitude", "지도 위도", { type: "number", step: "any", helper: "예: 37.4660000" })}{field("mapLongitude", "지도 경도", { type: "number", step: "any", helper: "예: 126.8970000" })}</div>{field("transitInfo", "대중교통 안내", { multiline: true })}{field("parkingInfo", "주차 안내", { multiline: true })}</Paper>
    <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7"><h2 className="text-xl font-extrabold">외부 채널·개인정보 담당</h2>{field("youtubeUrl", "YouTube 채널 URL", { type: "url" })}<div className="grid gap-6 sm:grid-cols-2">{field("privacyOfficer", "개인정보 보호 담당자")}{field("privacyContact", "개인정보 문의 연락처")}</div></Paper>
  </div>
  <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24"><h2 className="font-extrabold">설정 저장</h2><Alert severity="info">저장하면 푸터, 오시는 길과 검색엔진 기본 정보에 즉시 반영됩니다.</Alert><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "저장 중" : "전체 설정 저장"}</Button></Paper>
</form>; }
