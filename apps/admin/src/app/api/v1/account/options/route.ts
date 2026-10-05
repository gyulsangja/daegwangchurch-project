import { unavailableMemberOptions } from '@daegwang/contracts/features/member/extras';
import { configuredAccountPolicy } from '@daegwang/server/features/member/account-server';
import { configuredCarePolicy } from '@daegwang/server/features/member/operations-server';
import { configuredDeletionPolicy } from '@daegwang/server/features/member/deletion-server';
export const dynamic = 'force-dynamic';
export function GET() {
  const notifications = process.env.APP_MEMBER_NOTIFICATIONS_ENABLED === 'true';
  const account = configuredAccountPolicy(); const care = configuredCarePolicy(); const deletion = configuredDeletionPolicy();
  const policy = account || care || deletion ? { version: account?.version ?? care?.version ?? deletion!.version, terms: account?.terms ?? '', privacy: account?.privacy ?? '', care: care?.notice ?? '', deletion: deletion?.notice ?? account?.deletion ?? '' } : null;
  return Response.json({ ...unavailableMemberOptions, mode: notifications || policy ? 'configured' : 'unavailable', registration: !!account && !!deletion, recovery: !!account, notifications, care: !!care, deletion: !!deletion, policy, carePolicyVersion: care?.version ?? null, deletionPolicyVersion: deletion?.version ?? null }, { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' } });
}
