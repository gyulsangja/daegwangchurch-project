'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Play, Radio } from 'lucide-react';
import type { LiveStatus } from '@daegwang/contracts/features/worship/live';
import { YouTubeEmbed } from '../content/youtube-embed';

export function HomeLive() {
  const [state, setState] = useState<LiveStatus | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      if (document.hidden) return;
      controller?.abort(); controller = new AbortController();
      const request = controller;
      const timeout = setTimeout(() => request.abort(), 15000);
      try {
        const response = await fetch('/api/live', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Unavailable');
        const data = await response.json() as LiveStatus;
        if (!disposed) setState(Date.now() - Date.parse(data.checkedAt) < 180000 ? data : null);
      } catch { if (!disposed) setState(null); }
      finally { clearTimeout(timeout); }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const live = state?.status === 'live' ? state.broadcast : null;
  if (!live) return null;
  return <section aria-labelledby="home-live-title" className="bg-[#183f3b] py-8 text-white md:py-12">
    <div className="container-site grid items-center gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
      <div><p className="inline-flex items-center gap-2 text-sm font-semibold text-[#e6cf9f]"><Radio aria-hidden="true" className="size-4" />지금, 함께 드리는 예배 <span className="rounded border border-current px-2 py-0.5 text-xs">LIVE</span></p>
        <h2 id="home-live-title" className="mt-4 text-2xl font-semibold leading-snug md:text-4xl">{live.title}</h2>
        <p className="mt-4 text-sm leading-7 text-white/75">{live.channelTitle}에서 실시간으로 전해드립니다.<br />계신 자리에서 함께 예배드려요.</p>
        <a href={`https://www.youtube.com/watch?v=${live.videoId}`} target="_blank" rel="noopener" className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded text-sm font-semibold">YouTube에서 함께하기<ArrowUpRight aria-hidden="true" className="size-4" /></a>
      </div>
      <div className="min-w-0">{playing === live.videoId && live.embeddable ? <YouTubeEmbed videoId={live.videoId} title={live.title} /> : <>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-black">{failedThumbnail === live.videoId ? <span className="flex items-center gap-3 text-white/75"><Radio aria-hidden="true" className="size-6" />대광교회 실시간 예배</span> : <Image src={`https://i.ytimg.com/vi/${live.videoId}/mqdefault.jpg`} alt={live.title} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-contain" onError={() => setFailedThumbnail(live.videoId)} />}</div>
        {live.embeddable ? <button onClick={() => setPlaying(live.videoId)} className="focus-ring mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e6cf9f] px-4 py-3 font-semibold text-[#183f3b]"><Play aria-hidden="true" className="size-4" />여기서 실시간 예배 보기</button> : <p className="mt-3 text-sm text-white/75">이 방송은 위의 YouTube 링크에서 시청할 수 있습니다.</p>}
      </>}</div>
    </div>
  </section>;
}
