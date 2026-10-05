"use client";
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@daegwang/web-ui/components/ui/button';
import { saveHomePageAction, type FixedPageActionState } from '../../features/pages/actions';
import type { HomePageContent } from '@daegwang/contracts/features/pages/content';
import { pageStatusLabels } from '@daegwang/contracts/features/pages/schema';

export function HomePageForm({ content, status }: { content: HomePageContent; status: keyof typeof pageStatusLabels }) {
  const [state, action, pending] = useActionState(saveHomePageAction, {} as FixedPageActionState);
  const field = (name: keyof HomePageContent, label: string, multiline = false) => <TextField key={name} required fullWidth name={name} label={label} defaultValue={String(content[name])} multiline={multiline} minRows={multiline ? 4 : undefined} error={!!state.errors?.[name]} helperText={state.errors?.[name]?.[0]} />;
  return <form action={action} className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
    {/* Retain old CMS values for compatibility, but do not offer controls that no longer affect the home. */}
    {(['worshipTitle', 'newsTitle', 'sinceLabel', 'motto'] as const).map(name => <input key={name} type="hidden" name={name} value={content[name]} />)}
    <div className="grid gap-6">
      {state.message && <Alert severity={state.success ? 'success' : 'error'}>{state.message}</Alert>}
      <Paper variant="outlined" className="grid gap-6 p-6"><h2 className="text-xl font-bold">대표 인사</h2>{field('heroBadge', '상단 안내 문구')}{field('heroTitleBefore', '제목 첫 줄')}{field('heroTitleAccent', '강조 문구')}{field('heroTitleAfter', '제목 마지막 줄')}{field('heroDescription', '인사 설명', true)}</Paper>
      <Alert severity="info">말씀·첫시간·주보·공지·일정은 각각의 관리 메뉴에서 한 번만 등록합니다. 홈페이지는 최신 공개 콘텐츠를 자동으로 보여주며 앱도 같은 원본을 사용합니다.</Alert>
      <Paper variant="outlined" className="grid gap-6 p-6"><h2 className="text-xl font-bold">교회 소개</h2>{field('churchTitle', '소개 제목')}{field('churchDescription', '소개 설명', true)}</Paper>
      <Paper variant="outlined" className="grid gap-6 p-6"><h2 className="text-xl font-bold">새가족 안내</h2>{field('welcomeTitle', '환영 제목')}{field('welcomeDescription', '환영 설명', true)}</Paper>
    </div>
    <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24"><h2 className="font-bold">홈페이지 노출 설정</h2><TextField select label="상태" name="status" defaultValue={status}>{Object.entries(pageStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
      {([['showWorship', '주일 말씀·첫시간 영역'], ['showNews', '주보·공지·일정 영역'], ['showChurch', '교회 소개'], ['showWelcome', '새가족 안내']] as const).map(([name, label]) => <FormControlLabel key={name} control={<Checkbox name={name} defaultChecked={content[name]} />} label={label} />)}
      <Alert severity="info">대표 인사와 예배 시간 안내는 항상 표시됩니다. 이 설정은 홈페이지 영역의 표시 여부이며 콘텐츠 자체의 공개 상태는 바꾸지 않습니다.</Alert>
      <Button type="submit" disabled={pending}>{pending ? '저장 중…' : '저장'}</Button><Button asChild variant="secondary"><Link href="/admin/pages">목록으로</Link></Button>
    </Paper>
  </form>;
}
