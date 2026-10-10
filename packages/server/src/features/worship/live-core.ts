import type { LiveBroadcast } from '@daegwang/contracts/features/worship/live';

export function channelFilter(value: string): Record<string, string> | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['youtube.com', 'www.youtube.com'].includes(url.hostname)) return null;
    const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    if (parts[0]?.startsWith('@')) return { forHandle: parts[0] };
    if (parts[0] === 'channel' && /^UC[\w-]{22}$/.test(parts[1] ?? '')) return { id: parts[1] };
    if (parts[0] === 'user' && parts[1]) return { forUsername: parts[1] };
  } catch { /* Invalid configuration must never fetch an arbitrary host. */ }
  return null;
}

export type YouTubeVideo = { id?: string; snippet?: { title?: string; channelId?: string; channelTitle?: string; liveBroadcastContent?: string }; status?: { privacyStatus?: string; embeddable?: boolean }; liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string } };

export function selectLiveVideo(items: YouTubeVideo[], channelId: string): LiveBroadcast | null {
  const live = items.filter(item => /^[\w-]{11}$/.test(item.id ?? '') && item.snippet?.channelId === channelId && item.snippet.liveBroadcastContent === 'live' && item.status?.privacyStatus === 'public' && item.liveStreamingDetails?.actualStartTime && !item.liveStreamingDetails.actualEndTime && Number.isFinite(Date.parse(item.liveStreamingDetails.actualStartTime)))
    .sort((a, b) => Date.parse(b.liveStreamingDetails!.actualStartTime!) - Date.parse(a.liveStreamingDetails!.actualStartTime!) || a.id!.localeCompare(b.id!))[0];
  return live ? { videoId: live.id!, title: live.snippet?.title || '대광교회 실시간 예배', channelTitle: live.snippet?.channelTitle || '대광교회', startedAt: live.liveStreamingDetails!.actualStartTime!, embeddable: live.status?.embeddable === true } : null;
}
