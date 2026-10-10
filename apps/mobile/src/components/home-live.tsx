import { useCallback, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { createLiveClient } from '@daegwang/api-client/live';
import type { LiveBroadcast } from '@daegwang/contracts/features/worship/live';
import { Action, styles } from './ui';
import { Video } from './video';
import { VideoThumbnail } from './video-thumbnail';

const client = createLiveClient(process.env.EXPO_PUBLIC_WEBSITE_URL);

export function HomeLive() {
  const [live, setLive] = useState<LiveBroadcast | null>(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let focused = true;
    let request: AbortController | undefined;
    const refresh = async () => {
      if (AppState.currentState && AppState.currentState !== 'active') return;
      request?.abort(); const controller = new AbortController(); request = controller;
      try { const data = await client.current(controller.signal); if (focused && !controller.signal.aborted) setLive(data); }
      catch { if (focused && !controller.signal.aborted) setLive(null); }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); else { request?.abort(); setLive(null); } });
    return () => { focused = false; request?.abort(); clearInterval(timer); subscription.remove(); setLive(null); };
  }, []));
  if (!live) return null;
  return <View style={liveStyles.card}>
    <Text style={liveStyles.badge}>LIVE · 지금, 함께 드리는 예배</Text>
    <Text accessibilityRole="header" style={liveStyles.title}>{live.title}</Text>
    <Text style={[styles.caption, { color: '#e0ebe7' }]}>계신 자리에서 함께 예배드려요.</Text>
    {live.embeddable ? <Video videoId={live.videoId} /> : <><VideoThumbnail videoId={live.videoId} /><Text style={[styles.caption, { color: '#e0ebe7' }]}>이 방송은 YouTube에서 시청할 수 있습니다.</Text></>}
    <Action title="YouTube에서 함께하기" secondary onPress={() => { setError(''); void Linking.openURL(`https://www.youtube.com/watch?v=${live.videoId}`).catch(() => setError('YouTube를 열지 못했습니다. 다시 시도해 주세요.')); }} />
    {!!error && <Text accessibilityRole="alert" style={[styles.caption, { color: 'white' }]}>{error}</Text>}
  </View>;
}

const liveStyles = StyleSheet.create({
  card: { backgroundColor: '#183f3b', borderRadius: 20, padding: 16, gap: 12 },
  badge: { fontFamily: 'NotoSansKR_700Bold', fontSize: 13, lineHeight: 20, color: '#e6cf9f' },
  title: { fontFamily: 'NotoSansKR_700Bold', fontSize: 23, lineHeight: 34, color: 'white' },
});
