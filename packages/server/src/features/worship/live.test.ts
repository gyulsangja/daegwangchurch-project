import test from 'node:test';
import assert from 'node:assert/strict';
import { channelFilter, selectLiveVideo, type YouTubeVideo } from './live-core';

const channelId = 'UCabcdefghijklmnopqrstuv';
const live: YouTubeVideo = { id: 'abcdefghijk', snippet: { channelId, title: '주일예배', liveBroadcastContent: 'live' }, status: { privacyStatus: 'public', embeddable: true }, liveStreamingDetails: { actualStartTime: '2026-10-11T02:00:00Z' } };
test('resolves configured channel handles and rejects unrelated URLs', () => {
  assert.deepEqual(channelFilter('https://www.youtube.com/@서울독산동대광교회'), { forHandle: '@서울독산동대광교회' });
  assert.deepEqual(channelFilter(`https://youtube.com/channel/${channelId}`), { id: channelId });
  assert.equal(channelFilter('https://youtube.com.evil.test/@church'), null);
  assert.equal(channelFilter('http://127.0.0.1/live'), null);
});
test('only genuinely live, public broadcasts belonging to this church are highlighted', () => {
  assert.equal(selectLiveVideo([live], channelId)?.videoId, live.id);
  for (const item of [
    { ...live, snippet: { ...live.snippet, liveBroadcastContent: 'upcoming' } },
    { ...live, liveStreamingDetails: { ...live.liveStreamingDetails, actualEndTime: '2026-10-11T03:00:00Z' } },
    { ...live, status: { privacyStatus: 'private' } },
    { ...live, snippet: { ...live.snippet, channelId: 'another-channel' } },
    { ...live, liveStreamingDetails: {} },
  ]) assert.equal(selectLiveVideo([item], channelId), null);
});
test('restricted embeds retain external viewing and concurrent broadcasts have deterministic order', () => {
  assert.equal(selectLiveVideo([{ ...live, status: { ...live.status, embeddable: false } }], channelId)?.embeddable, false);
  const recent = { ...live, id: 'lmnopqrstuv', liveStreamingDetails: { actualStartTime: '2026-10-11T02:10:00Z' } };
  assert.equal(selectLiveVideo([live, recent], channelId)?.videoId, recent.id);
});
