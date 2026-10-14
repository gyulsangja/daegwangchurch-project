import { useMemo } from 'react';
import { BulletinFrame } from './bulletin-frame';
import { bulletinViewerHtml } from '../lib/bulletin-viewer';
export function BulletinDocument({ url }: { url: string }) {
  const html = useMemo(() => bulletinViewerHtml(url), [url]);
  return <BulletinFrame url={url} render={fullScreen => <iframe title={fullScreen ? '주보 전체 화면 문서' : '주보 문서'} srcDoc={html} sandbox="allow-scripts allow-same-origin" style={{ border: 0, width: '100%', height: '100%' }} />} />;
}
