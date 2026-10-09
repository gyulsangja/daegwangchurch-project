'use client';
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Button } from '@daegwang/web-ui/components/ui/button';
import { parseYouTubeUrl } from '@daegwang/contracts/lib/youtube/parser';
import { z } from 'zod';
export function PublicationRehearsal() {
  const [title, setTitle] = useState('[예시] 오늘의 첫시간 주님께'); const [date, setDate] = useState('2026-10-04'); const [url, setUrl] = useState('https://youtu.be/T0000000001');
  const [confirm, setConfirm] = useState(false); const [result, setResult] = useState(''); const [error, setError] = useState('');
  const edited = () => { setResult(''); setError(''); };
  return <section className="mx-auto mt-8 max-w-6xl rounded-2xl border border-border bg-white p-6" aria-labelledby="rehearsal-title">
    <h2 id="rehearsal-title" className="text-xl font-bold">통합 등록 연습</h2><p className="mt-2 text-text-secondary">한 번 저장하면 홈페이지와 앱에 함께 반영되는 흐름입니다. 여기서는 가상 자료만 사용합니다.</p>
    <form className="mt-5 grid gap-5" onSubmit={event => { event.preventDefault(); if (!title.trim() || !z.iso.date().safeParse(date).success || !parseYouTubeUrl(url)) { setError('제목·날짜·YouTube 주소를 확인해 주세요.'); return; } setError(''); setConfirm(true); }}>
      <TextField label="콘텐츠 제목" value={title} onChange={e => { edited(); setTitle(e.target.value); }} slotProps={{ htmlInput: { maxLength: 200 } }} />
      <div className="grid gap-5 sm:grid-cols-2"><TextField label="콘텐츠 날짜" type="date" value={date} onChange={e => { edited(); setDate(e.target.value); }} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="YouTube 주소" value={url} onChange={e => { edited(); setUrl(e.target.value); }} /></div>
      <p className="rounded-xl bg-primary-50 p-4 font-semibold text-primary-700">홈페이지·앱 함께 공개</p>
      {error && <p role="alert" className="font-bold text-red-700">{error}</p>}{result && <p role="status" className="rounded-xl bg-primary-50 p-4 font-bold text-primary-700">{result}</p>}
      <Button type="submit" size="lg">발행 전 미리보기</Button>
    </form>
    <Dialog open={confirm} onClose={() => setConfirm(false)} fullWidth aria-labelledby="publish-confirm"><DialogTitle id="publish-confirm">등록할 내용을 확인해 주세요</DialogTitle><DialogContent><p className="font-bold">{title}</p><p className="mt-3">{date} · 홈페이지·앱 함께 공개</p><p className="mt-3">체험 확인 후에도 실제로 공개되지 않습니다.</p></DialogContent><DialogActions><Button variant="secondary" onClick={() => setConfirm(false)}>돌아가서 수정</Button><Button onClick={() => { setConfirm(false); setResult('발행 절차 체험 완료 · 실제 발행 0건'); }}>체험 확인</Button></DialogActions></Dialog>
  </section>;
}
