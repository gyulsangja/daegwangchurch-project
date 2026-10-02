import Chip from "@mui/material/Chip";
import { ArrowLeft, CalendarDays, Download, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

import { ContentShell } from "../site/content-shell";
import { Button } from "@daegwang/web-ui/components/ui/button";

type BulletinDetail = {
  title: string;
  date: string;
  summary: string;
  pdfName: string;
  pdfUrl: string;
};

export function BulletinDetailPage({ bulletin }: { bulletin: BulletinDetail }) {
  return (
    <ContentShell narrow>
      <Link href="/news/bulletins" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-text-secondary hover:text-primary-700">
        <ArrowLeft aria-hidden="true" className="size-4" /> 목록으로
      </Link>
      <article className="mt-8">
        <header className="border-b border-border pb-8">
          <Chip label="주일주보" color="primary" variant="outlined" />
          <h1 className="text-balance mt-5 text-4xl font-extrabold tracking-[-0.05em] md:text-5xl">{bulletin.title}</h1>
          <p className="mt-5 flex items-center gap-2 text-sm text-text-secondary"><CalendarDays aria-hidden="true" className="size-4" />{bulletin.date}</p>
          {bulletin.summary ? <p className="mt-6 text-lg leading-8 text-text-secondary">{bulletin.summary}</p> : null}
        </header>
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3"><FileText aria-hidden="true" className="size-6 shrink-0 text-primary-600" /><span className="truncate font-bold">{bulletin.pdfName}</span></div>
          <div className="flex gap-2">
            <Button asChild variant="secondary"><a href={bulletin.pdfUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="size-4" /> 새 창</a></Button>
            <Button asChild><a href={bulletin.pdfUrl} download={bulletin.pdfName}><Download aria-hidden="true" className="size-4" /> 다운로드</a></Button>
          </div>
        </div>
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background-muted">
          <iframe src={bulletin.pdfUrl} title={`${bulletin.title} PDF 미리보기`} className="h-[70vh] min-h-[36rem] w-full" />
        </div>
      </article>
    </ContentShell>
  );
}

