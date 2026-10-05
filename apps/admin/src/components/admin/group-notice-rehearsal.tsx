'use client';
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Button } from '@daegwang/web-ui/components/ui/button';
export function GroupNoticeRehearsal() {
  const [group, setGroup] = useState('[예시] 전도회'); const [title, setTitle] = useState('함께하는 모임 안내'); const [audience, setAudience] = useState('PUBLIC'); const [notify, setNotify] = useState(false); const [web, setWeb] = useState(false); const [error, setError] = useState(''); const [confirm, setConfirm] = useState(false); const [done, setDone] = useState(false);
  return <section className="mx-auto mt-8 max-w-6xl rounded-2xl border border-border bg-white p-6"><h2 className="text-xl font-bold">모임 공지 발행 체험</h2><p className="my-3 text-text-secondary">관심 구독과 소속 승인을 구분합니다. 실제 모임 이름·담당자는 관리자 등록으로 관리하며, 이 화면은 가상 연습입니다.</p>
    <form className="grid gap-5" onChange={() => setDone(false)} onSubmit={event => { event.preventDefault(); setDone(false); if (!group.trim() || !title.trim()) { setError('모임 이름과 공지 제목을 입력해 주세요.'); return; } if (audience === 'MEMBERS' && web) { setError('소속 전용 안내는 공개 홈페이지에 발행할 수 없습니다.'); return; } setError(''); setConfirm(true); }}>
      <TextField label="모임 이름" value={group} onChange={event => setGroup(event.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
      <TextField label="모임 공지 제목" value={title} onChange={event => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} />
      <TextField select label="열람 대상" value={audience} onChange={event => setAudience(event.target.value)}><MenuItem value="PUBLIC">누구나 읽는 공개 소식</MenuItem><MenuItem value="MEMBERS">확인된 소속만 읽는 안내</MenuItem></TextField>
      <FormControlLabel label="홈페이지에도 공개" control={<Checkbox checked={web} onChange={event => setWeb(event.target.checked)} />} />
      <FormControlLabel label="알림 발송 요청" control={<Checkbox checked={notify} onChange={event => setNotify(event.target.checked)} />} />
      <p className="text-sm text-text-secondary">공개 소식 알림은 관심 구독·수신 동의 대상, 소속 안내는 승인된 소속·수신 동의 대상에게만 보냅니다. 잠금화면에는 민감한 제목·본문을 표시하지 않고 앱에서 권한을 다시 확인하는 방식으로 연결할 예정입니다.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}{done && <p role="status">모임 공지 체험 완료 · 실제 발행·알림 0건</p>}
      <Button type="submit">모임 공지 미리보기</Button>
    </form>
    <Dialog open={confirm} onClose={() => setConfirm(false)} fullWidth aria-labelledby="group-confirm"><DialogTitle id="group-confirm">모임과 열람 대상을 확인해 주세요</DialogTitle><DialogContent><p>{group} · {title}</p><p className="mt-3">{audience === 'PUBLIC' ? '공개 소식' : '확인된 소속만'} · {web ? '앱·홈페이지' : '앱'}</p><p className="mt-3">{notify ? '수신 동의자 대상 알림 요청' : '알림 요청 없음'} · 실제 발송하지 않습니다.</p></DialogContent><DialogActions><Button variant="secondary" onClick={() => setConfirm(false)}>돌아가서 수정</Button><Button onClick={() => { setConfirm(false); setDone(true); }}>모임 공지 체험 확인</Button></DialogActions></Dialog>
  </section>;
}
