export function Video({ videoId }: { videoId: string }) {
  return <iframe title="첫시간 주님께 YouTube 영상" src={`https://www.youtube.com/embed/${videoId}?playsinline=1`} allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{ width: '100%', height: 200, border: 0, borderRadius: 12, background: '#142e32' }} />;
}
