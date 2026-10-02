"use client";
import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { changeAppPublicationAction } from "../../features/worship/app-actions";

export function AppPublicationPanel({ id, updatedAt, version, hasChanges }: {
  id: string; updatedAt: string; version: number | null; hasChanges: boolean;
}) {
  const [state, action, pending] = useActionState(changeAppPublicationAction.bind(null, id, updatedAt), { message: "", success: false });
  return <Paper component="section" variant="outlined" className="mt-8 p-5 md:p-7" aria-labelledby="app-publication-title">
    <h2 id="app-publication-title" className="text-xl font-extrabold">앱 발행</h2>
    <p className="mt-2">{version ? `앱 발행본 ${version}차${hasChanges ? " · 저장된 변경사항이 있습니다" : " · 최신 저장 내용이 반영되어 있습니다"}` : "아직 앱에 발행하지 않았습니다."}</p>
    <p className="mt-2 text-sm text-text-secondary">위 편집 내용을 먼저 저장한 뒤 발행해 주세요. 이 버튼은 저장된 내용을 발행합니다. 홈페이지 공개 상태와는 별도로 적용됩니다.</p>
    {state.message && <Alert className="mt-4!" severity={state.success ? "success" : "error"} role="status">{state.message}</Alert>}
    <form action={action} className="mt-5 flex flex-wrap gap-3">
      <Button type="submit" name="intent" value="publish" disabled={pending || (!!version && !hasChanges)}>{pending ? "처리 중…" : version ? "저장된 내용 다시 발행" : "저장된 내용 앱에 발행"}</Button>
      {version && <Button type="submit" name="intent" value="unpublish" variant="secondary" disabled={pending}>앱 발행 중단</Button>}
    </form>
  </Paper>;
}
