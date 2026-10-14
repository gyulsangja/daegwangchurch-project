'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { Download, ExternalLink, FileText, Maximize2, X } from 'lucide-react';
import { Button } from '@daegwang/web-ui/components/ui/button';

export function BulletinViewer({ title, pdfName, pdfUrl }: { title: string; pdfName: string; pdfUrl: string }) {
  const [expanded, setExpanded] = useState(false);
  return <>
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3"><FileText aria-hidden="true" className="size-6 shrink-0 text-primary-600" /><span className="truncate font-bold">{pdfName}</span></div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setExpanded(true)}><Maximize2 aria-hidden="true" className="size-4" />전체 화면</Button>
        <Button asChild variant="secondary"><a href={pdfUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="size-4" />원본 열기</a></Button>
        <Button asChild variant="secondary"><a href={pdfUrl} download={pdfName}><Download aria-hidden="true" className="size-4" />다운로드</a></Button>
      </div>
    </div>
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background-muted"><iframe src={pdfUrl} title={`${title} PDF 미리보기`} className="h-[70vh] min-h-80 w-full" /></div>
    <Dialog fullScreen open={expanded} onClose={() => setExpanded(false)} aria-labelledby="bulletin-fullscreen-title" slotProps={{ paper: { sx: { height: '100dvh', margin: 0 } } }}>
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-2">
        <h2 id="bulletin-fullscreen-title" className="min-w-0 flex-1 truncate font-bold">{title}</h2>
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center px-2 text-sm font-semibold text-primary-700">원본 열기</a>
        <Button variant="secondary" onClick={() => setExpanded(false)} aria-label="주보 전체 화면 닫기"><X aria-hidden="true" className="size-4" />닫기</Button>
      </div>
      <iframe src={pdfUrl} title={`${title} PDF 전체 화면`} className="min-h-0 w-full flex-1 border-0" />
    </Dialog>
  </>;
}
