import { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { Action, Card, colors } from './ui';
import { VideoThumbnail } from './video-thumbnail';

export function Video({ videoId }: { videoId: string }) {
  return <Player key={videoId} videoId={videoId} />;
}

function Player({ videoId }: { videoId: string }) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const appId = (Platform.OS === 'ios' ? Constants.expoConfig?.ios?.bundleIdentifier : Constants.expoConfig?.android?.package) ?? 'org.daegwangchurch.app';
  const origin = `https://${appId}`;
  const source = useMemo(() => ({ baseUrl: origin, html: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body,#player{margin:0;width:100%;height:100%;background:#142e32;overflow:hidden}</style></head><body><div id="player"></div><script>
    function report(value){window.ReactNativeWebView.postMessage(value);}
    function onYouTubeIframeAPIReady(){new YT.Player('player',{videoId:${JSON.stringify(videoId).replaceAll('<', '\\u003c')},playerVars:{playsinline:1,origin:${JSON.stringify(origin)}},events:{onReady:function(){report('ready')},onError:function(){report('error')}}});}
    </script><script src="https://www.youtube.com/iframe_api" onerror="report('error')"></script></body></html>` }), [origin, videoId]);
  useEffect(() => {
    if (!started || ready || failed) return;
    const timer = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timer);
  }, [started, ready, failed]);
  if (!started || failed) return <View style={{ gap: 10 }}>
    <VideoThumbnail videoId={videoId} />
    {failed && <Card title="앱에서 영상을 재생하지 못했습니다">아래 ‘YouTube에서 보기’를 누르면 유튜브 앱이나 브라우저에서 볼 수 있습니다.</Card>}
    <Action title={failed ? '앱에서 다시 재생' : '앱에서 영상 보기'} onPress={() => { setFailed(false); setReady(false); setStarted(true); }} />
  </View>;
  return <View style={{ width: '100%', aspectRatio: 16 / 9, minHeight: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.video }}>
    <WebView source={source} originWhitelist={['*']} allowsFullscreenVideo allowsInlineMediaPlayback
      onMessage={event => { if (event.nativeEvent.data === 'ready') setReady(true); if (event.nativeEvent.data === 'error') setFailed(true); }}
      onError={() => setFailed(true)} onRenderProcessGone={() => setFailed(true)} mediaPlaybackRequiresUserAction
      scrollEnabled={false} style={{ backgroundColor: colors.video }} />
  </View>;
}
