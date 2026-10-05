"use client";
import { startTransition, useActionState, useState } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { changeAppPublicationAction } from "../../features/worship/app-actions";

export function AppPublicationPanel({ id, updatedAt, version, hasChanges }: {
  id: string; updatedAt: string; version: number | null; hasChanges: boolean;
}) {
  const [state, action, pending] = useActionState(changeAppPublicationAction.bind(null, id, updatedAt), { message: "", success: false });
  const [intent, setIntent] = useState<'publish' | 'unpublish' | null>(null);
  return <Paper component="section" variant="outlined" className="mt-8 p-5 md:p-7" aria-labelledby="app-publication-title">
    <h2 id="app-publication-title" className="text-xl font-extrabold">앱 발행</h2>
    <p className="mt-2">{version ? `앱 발행본 ${version}차${hasChanges ? " · 저장된 변경사항이 있습니다" : " · 최신 저장 내용이 반영되어 있습니다"}` : "아직 앱에 발행하지 않았습니다."}</p>
    <p className="mt-2 text-sm text-text-secondary">위 편집 내용을 먼저 저장한 뒤 발행해 주세요. 이 버튼은 저장된 내용을 발행합니다. 홈페이지 공개 상태와는 별도로 적용됩니다.</p>
    {state.message && <Alert className="mt-4!" severity={state.success ? "success" : "error"} role="status">{state.message}</Alert>}
    <div className="mt-5 flex flex-wrap gap-3">
      <Button onClick={() => setIntent('publish')} disabled={pending || (!!version && !hasChanges)}>{pending ? "처리 중…" : version ? "저장된 내용 다시 발행" : "저장된 내용 앱에 발행"}</Button>
      {version && <Button onClick={() => setIntent('unpublish')} variant="secondary" disabled={pending}>앱 발행 중단</Button>}
    </div>
    <Dialog open={intent !== null} onClose={() => setIntent(null)} fullWidth aria-labelledby="publication-confirm-title"><DialogTitle id="publication-confirm-title">{intent === 'publish' ? '저장된 내용을 앱에 공개할까요?' : '앱 공개를 중단할까요?'}</DialogTitle><DialogContent><p>{intent === 'publish' ? '앱에서 로그인 없이 볼 수 있는 말씀으로 공개됩니다. 편집 중인 미저장 내용은 반영되지 않습니다.' : '앱 목록과 상세에서 더 이상 공개되지 않습니다. 이미 외부에서 열린 영상은 회수되지 않습니다.'}</p><p className="mt-3">홈페이지 공개 상태는 이 작업으로 바뀌지 않습니다.</p></DialogContent><DialogActions><Button variant="secondary" onClick={() => setIntent(null)}>취소</Button><Button onClick={() => { if (!intent || pending) return; const data = new FormData(); data.set('intent', intent); setIntent(null); startTransition(() => action(data)); }}>확인하고 적용</Button></DialogActions></Dialog>
  </Paper>;
}
