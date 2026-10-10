import { getLiveBroadcast } from '../../../lib/live-broadcast';

export async function GET() {
  return Response.json(await getLiveBroadcast(), { headers: { 'Cache-Control': 'no-store' } });
}
