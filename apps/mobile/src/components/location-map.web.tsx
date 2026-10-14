export function LocationMap({ url }: { url: string }) {
  return <iframe title="대광교회 위치 지도" src={url} style={{ width: '100%', height: 260, border: 0, borderRadius: 16 }} />;
}
