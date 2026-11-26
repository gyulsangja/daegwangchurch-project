import { getLiveBroadcast } from '../../../lib/live-broadcast';

export async function GET() {
  const live = await getLiveBroadcast();
  // Only share a recent, successful public result among visitors at the edge.
  const share = (live.status === 'live' || live.status === 'offline') && Date.now() - Date.parse(live.checkedAt) < 160000;
  return Response.json(live, { headers: {
    'Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': share ? 'public, s-maxage=15' : 'no-store',
    'Access-Control-Allow-Origin': '*',
  } });
}
