"use client";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { LoaderCircle, MessageSquarePlus, Save } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { addInquiryNoteAction, updateInquiryStatusAction, type AdminInquiryState } from "../../features/inquiries/actions";
import { inquiryStatusLabels } from "@daegwang/contracts/features/inquiries/schema";
export function InquiryAdminActions({ id, status }: { id: string; status: keyof typeof inquiryStatusLabels }) { const [statusState, statusAction, statusPending] = useActionState(updateInquiryStatusAction.bind(null, id), {} as AdminInquiryState); const [noteState, noteAction, notePending] = useActionState(addInquiryNoteAction.bind(null, id), {} as AdminInquiryState); return <div className="grid gap-5">
  <Paper component="form" action={statusAction} variant="outlined" className="flex flex-col gap-5 p-5"><h2 className="font-extrabold">처리 상태</h2>{statusState.message ? <Alert severity={statusState.success ? "success" : "error"}>{statusState.message}</Alert> : null}<TextField select fullWidth size="small" label="상태" name="status" defaultValue={status}>{Object.entries(inquiryStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><Button type="submit" disabled={statusPending}>{statusPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}상태 저장</Button></Paper>
  <Paper component="form" action={noteAction} variant="outlined" className="flex flex-col gap-5 p-5"><h2 className="font-extrabold">내부 메모 추가</h2>{noteState.message ? <Alert severity={noteState.success ? "success" : "error"}>{noteState.message}</Alert> : null}<TextField required fullWidth multiline minRows={5} label="최고 관리자만 확인할 수 있습니다" name="note" /><Button type="submit" disabled={notePending}>{notePending ? <LoaderCircle className="size-4 animate-spin" /> : <MessageSquarePlus className="size-4" />}메모 추가</Button></Paper>
</div>; }
