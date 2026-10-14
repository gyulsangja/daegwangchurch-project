import { mkdir, writeFile } from 'node:fs/promises';
process.loadEnvFile('apps/website/.env.local');
const key = process.env.YOUTUBE_DATA_API_KEY;
if (!key) throw new Error('YouTube API key is required');
const channelId = 'UC1tP9iJvaJpr63dIU608WcQ';
const selected = new Map([
  ['PLq1lzFFvAjiz9PJp56QvixCaChlopKyn2', 'SUNDAY_AFTERNOON'],
  ['PLq1lzFFvAjixF5sjE6-DyNbj6elzIZ3zi', 'WEDNESDAY'],
  ['PLq1lzFFvAjizPFXqAcJ6kOc3KwJrbvIYn', 'FIRST_HOUR'],
  ['PLq1lzFFvAjixzTZb2F-zQySdQMVQQ1ff5', 'SUNDAY_MORNING'],
]);
async function api(path, args) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [name, value] of Object.entries({ ...args, key })) if (value) url.searchParams.set(name, value);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`YouTube ${path}: HTTP ${response.status}`);
  return response.json();
}
const entries = new Map(); const playlistCounts = [];
for (const [playlistId, type] of selected) {
  let pageToken = '', count = 0;
  do {
    const result = await api('playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: '50', pageToken });
    for (const item of result.items) {
      const id = item.contentDetails.videoId;
      if (!entries.has(id)) entries.set(id, { id, type, playlists: [] });
      entries.get(id).playlists.push(playlistId); count++;
    }
    pageToken = result.nextPageToken;
  } while (pageToken);
  playlistCounts.push({ playlistId, type, count }); console.log({ type, count });
}
const videos = [], excluded = [];
const ids = [...entries.keys()];
for (let i = 0; i < ids.length; i += 50) {
  const chunk = ids.slice(i, i + 50);
  const result = await api('videos', { part: 'snippet,status,liveStreamingDetails,contentDetails', id: chunk.join(','), maxResults: '50' });
  const found = new Set(result.items.map(item => item.id));
  for (const id of chunk) if (!found.has(id)) excluded.push({ id, reason: 'unavailable' });
  for (const item of result.items) {
    if (item.snippet.channelId !== channelId || item.status.privacyStatus !== 'public' || item.snippet.liveBroadcastContent !== 'none') { excluded.push({ id: item.id, reason: 'not-public-channel-archive' }); continue; }
    videos.push({ ...entries.get(item.id), video: item });
  }
  if (i % 250 === 0) console.log({ inspected: Math.min(i + 50, ids.length), total: ids.length });
}
await mkdir('test-results/content-import', { recursive: true });
await writeFile('test-results/content-import/youtube-archive.json', JSON.stringify({ collectedAt: new Date().toISOString(), channelId, playlistCounts, videos, excluded }, null, 2));
console.log({ unique: ids.length, publicArchives: videos.length, excluded: excluded.length, multiplePlaylists: videos.filter(v => v.playlists.length > 1).length });
