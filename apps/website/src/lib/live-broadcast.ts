import 'server-only';
import { createHash } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { getSiteSettings } from '@daegwang/server/features/settings/queries';
import { channelFilter, selectLiveVideo, type YouTubeVideo } from '@daegwang/server/features/worship/live-core';
import type { LiveStatus } from '@daegwang/contracts/features/worship/live';

type ApiItem = YouTubeVideo & { id?: string; contentDetails?: { relatedPlaylists?: { uploads?: string }; videoId?: string } };
type SearchItem = { id?: { videoId?: string } };

export async function getLiveBroadcast(): Promise<LiveStatus> {
  const key = process.env.YOUTUBE_DATA_API_KEY ?? '';
  const disabled = (): LiveStatus => ({ status: 'disabled', broadcast: null, checkedAt: new Date().toISOString() });
  if (!key) return disabled();
  const channelUrl = (await getSiteSettings()).youtubeUrl;
  const filter = channelFilter(channelUrl);
  if (!filter) return disabled();
  const scope = createHash('sha256').update(`${key}:${channelUrl}`).digest('hex');
  async function api<T>(resource: string, params: Record<string, string>): Promise<T[]> {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    url.search = new URLSearchParams({ ...params, key }).toString();
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('YouTube unavailable');
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid YouTube response');
    return data.items;
  }
  const channel = unstable_cache(async () => {
    try { return (await api<ApiItem>('channels', { part: 'contentDetails', ...filter }))[0] ?? null; } catch { return null; }
  }, ['live-channel-v1', scope], { revalidate: 3600 });
  const discover = unstable_cache(async (id: string) => {
    try { return (await api<SearchItem>('search', { part: 'id', channelId: id, type: 'video', order: 'date', maxResults: '25' })).map(item => item.id?.videoId).filter((id): id is string => !!id); } catch { return []; }
  }, ['live-discovery-v1', scope], { revalidate: 1800 });
  const uploads = unstable_cache(async (id: string) => {
    try { return (await api<ApiItem>('playlistItems', { part: 'contentDetails', playlistId: id, maxResults: '25' })).map(item => item.contentDetails?.videoId).filter((id): id is string => !!id); } catch { return []; }
  }, ['live-uploads-v1', scope], { revalidate: 120 });
  const snapshot = unstable_cache(async (): Promise<LiveStatus> => {
    try {
      const info = await channel();
      if (!info?.id) throw new Error('Channel unavailable');
      const [recent, found] = await Promise.all([info.contentDetails?.relatedPlaylists?.uploads ? uploads(info.contentDetails.relatedPlaylists.uploads) : [], discover(info.id)]);
      const ids = [...new Set([...recent, ...found])].filter(id => /^[\w-]{11}$/.test(id)).slice(0, 50);
      if (!ids.length) throw new Error('No candidates');
      const broadcast = selectLiveVideo(await api<YouTubeVideo>('videos', { part: 'snippet,status,liveStreamingDetails', id: ids.join(',') }), info.id);
      return { status: broadcast ? 'live' : 'offline', broadcast, checkedAt: new Date().toISOString() };
    } catch {
      // Never cache a thrown error or expose an API key/provider response to visitors.
      return { status: 'unavailable', broadcast: null, checkedAt: new Date().toISOString() };
    }
  }, ['live-status-v1', scope], { revalidate: 60 });
  const result = await snapshot();
  return Date.now() - Date.parse(result.checkedAt) > 180000 ? { ...result, status: 'unavailable', broadcast: null } : result;
}
