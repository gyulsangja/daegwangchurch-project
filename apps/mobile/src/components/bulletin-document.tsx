import { useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { bulletinViewerHtml } from '../lib/bulletin-viewer';
import { BulletinFrame } from './bulletin-frame';
export function BulletinDocument({ url }: { url: string }) {
  const source = useMemo(() => ({ html: bulletinViewerHtml(url), baseUrl: 'https://localhost' }), [url]);
  return <BulletinFrame url={url} render={() => <WebView source={source} style={{ flex: 1 }} originWhitelist={['https://*', 'about:blank']} javaScriptEnabled />} />;
}
