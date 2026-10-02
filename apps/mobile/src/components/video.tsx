import { useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Card, colors } from './ui';

export function Video({ videoId }: { videoId: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Card title="영상을 불러오지 못했습니다">아래 YouTube에서 보기로 계속 시청할 수 있습니다.</Card>;
  return <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.video }}>
    <WebView source={{ uri: `https://www.youtube.com/embed/${videoId}?playsinline=1` }} allowsFullscreenVideo allowsInlineMediaPlayback
      onError={() => setFailed(true)} onHttpError={() => setFailed(true)} mediaPlaybackRequiresUserAction style={{ backgroundColor: colors.video }} />
  </View>;
}
