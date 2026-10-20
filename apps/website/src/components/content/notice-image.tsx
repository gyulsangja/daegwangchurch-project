'use client';
import { useState } from 'react';
export function NoticeImage({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return <figure className="my-6">
    {failed ? <p role="status" className="rounded-xl bg-background-muted p-4">이미지를 불러오지 못했습니다. 아래 링크로 다시 열어 주세요.</p> :
      <a href={url} target="_blank" rel="noreferrer" aria-label={`${name} 크게 보기`}>
        {/* Original aspect ratio and public storage URL; loading failure must not break the article. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} loading="lazy" onError={() => setFailed(true)} className="h-auto w-full rounded-xl" />
      </a>}
    <figcaption className="mt-2 text-sm text-text-secondary"><a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline">{name} · 크게 보기</a></figcaption>
  </figure>;
}
