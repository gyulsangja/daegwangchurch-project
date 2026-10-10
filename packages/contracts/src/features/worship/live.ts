export type LiveBroadcast = { videoId: string; title: string; channelTitle: string; startedAt: string; embeddable: boolean };
export type LiveStatus = { status: 'live' | 'offline' | 'unavailable' | 'disabled'; broadcast: LiveBroadcast | null; checkedAt: string };
