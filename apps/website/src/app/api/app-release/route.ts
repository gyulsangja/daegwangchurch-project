import release from '@/lib/android-release.json';

export function GET() {
  return Response.json(release, { headers: { 'Cache-Control': 'no-store' } });
}
