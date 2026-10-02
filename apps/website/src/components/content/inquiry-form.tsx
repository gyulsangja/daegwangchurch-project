"use client";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { submitInquiryAction, type PublicInquiryState } from "@/features/inquiries/actions";
import { inquiryTypeLabels } from "@daegwang/contracts/features/inquiries/schema";

export function InquiryForm({ defaultType = "GENERAL", returnPath = "/newcomer/contact" }: { defaultType?: keyof typeof inquiryTypeLabels; returnPath?: "/newcomer/contact" | "/newcomer/register" }) { const [state, formAction, pending] = useActionState(submitInquiryAction, {} as PublicInquiryState); const error = (name: string) => state.errors?.[name]?.[0]; return <Paper component="form" action={formAction} variant="outlined" className="flex flex-col gap-6 p-6 md:p-10"><input type="hidden" name="returnPath" value={returnPath} /><div className="absolute -left-[9999px]" aria-hidden="true"><label>웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label></div>{state.message ? <Alert severity="error">{state.message}</Alert> : null}
  <div className="grid gap-6 sm:grid-cols-2"><TextField select required fullWidth label="문의 종류" name="type" defaultValue={defaultType}>{Object.entries(inquiryTypeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField required fullWidth label="이름" name="name" error={Boolean(error("name"))} helperText={error("name")} /></div>
  <div className="grid gap-6 sm:grid-cols-2"><TextField fullWidth label="전화번호" name="phone" type="tel" error={Boolean(error("phone"))} helperText={error("phone") ?? "전화번호 또는 이메일 중 하나는 필수입니다."} /><TextField fullWidth label="이메일" name="email" type="email" error={Boolean(error("email"))} helperText={error("email")} /></div>
  <TextField select fullWidth label="선호 연락 방법" name="preferredContact" defaultValue="전화"><MenuItem value="전화">전화</MenuItem><MenuItem value="문자">문자</MenuItem><MenuItem value="이메일">이메일</MenuItem><MenuItem value="상관없음">상관없음</MenuItem></TextField>
  <TextField fullWidth label="제목" name="title" error={Boolean(error("title"))} helperText={error("title")} />
  <TextField required fullWidth multiline minRows={8} label={defaultType === "NEWCOMER" ? "방문·등록 관련 내용" : "문의 내용"} name="content" error={Boolean(error("content"))} helperText={error("content") ?? "민감한 개인정보는 문의 내용에 작성하지 마세요."} />
  <div><FormControlLabel control={<Checkbox required name="privacyAgreed" />} label={<span>문의 처리에 필요한 개인정보 수집 및 이용에 동의합니다.</span>} />{error("privacyAgreed") ? <p className="text-sm text-red-600">{error("privacyAgreed")}</p> : null}<p className="mt-1 text-sm text-text-secondary">수집 항목과 보유 기간은 <Link href="/privacy" target="_blank" className="font-bold text-primary-700 underline">개인정보처리방침</Link>에서 확인할 수 있습니다.</p></div>
  <Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}{pending ? "접수 중" : "문의 접수"}</Button>
</Paper>; }
