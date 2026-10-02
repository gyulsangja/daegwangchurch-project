import Chip from "@mui/material/Chip";
import { ArrowLeft, CalendarDays, Download, ExternalLink, Paperclip, Pin } from "lucide-react";
import Link from "next/link";

import { ContentShell } from "../site/content-shell";
import { Button } from "@daegwang/web-ui/components/ui/button";

type NoticeDetail = {
  title: string;
  category: string;
  body: string;
  date: string;
  isImportant: boolean;
  isPinned: boolean;
  attachments: Array<{ id: string; name: string; sizeBytes: number; url: string }>;
};

export function NoticeDetailPage({ notice }: { notice: NoticeDetail }) {
  return (
    <ContentShell narrow>
      <Link href="/news/notices" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-text-secondary hover:text-primary-700">
        <ArrowLeft aria-hidden="true" className="size-4" /> 목록으로
      </Link>
      <article className="mt-8">
        <header className="border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Chip label={notice.category} color="primary" variant="outlined" />
            {notice.isImportant ? <Chip label="중요" color="error" /> : null}
            {notice.isPinned ? <Chip icon={<Pin className="size-3" />} label="고정" /> : null}
          </div>
          <h1 className="text-balance mt-5 text-4xl font-extrabold tracking-[-0.05em] md:text-5xl">{notice.title}</h1>
          <p className="mt-5 flex items-center gap-2 text-sm text-text-secondary"><CalendarDays aria-hidden="true" className="size-4" />{notice.date}</p>
        </header>
        <div className="whitespace-pre-wrap py-10 text-lg leading-9 text-text-secondary">{notice.body}</div>
        {notice.attachments.length ? (
          <section className="border-t border-border py-8">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Paperclip aria-hidden="true" className="size-5 text-primary-600" /> 첨부파일</h2>
            <div className="mt-4 grid gap-3">
              {notice.attachments.map((attachment) => (
                <div key={attachment.id} className="flex flex-col gap-3 rounded-xl bg-background-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><p className="truncate font-bold">{attachment.name}</p><p className="mt-1 text-xs text-text-secondary">{attachment.sizeBytes >= 1024 * 1024 ? `${(attachment.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${(attachment.sizeBytes / 1024).toFixed(1)} KB`}</p></div>
                  <div className="flex gap-2"><Button asChild variant="secondary"><a href={attachment.url} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="size-4" /> 열기</a></Button><Button asChild><a href={attachment.url} download={attachment.name}><Download aria-hidden="true" className="size-4" /> 다운로드</a></Button></div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </ContentShell>
  );
}
