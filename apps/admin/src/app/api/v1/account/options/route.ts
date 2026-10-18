import { unavailableMemberOptions } from '@daegwang/contracts/features/member/extras';
import { configuredAccountPolicy, configuredRegistrationPolicy } from '@daegwang/server/features/member/account-server';
import { configuredCarePolicy } from '@daegwang/server/features/member/operations-server';
import { configuredDeletionPolicy } from '@daegwang/server/features/member/deletion-server';
import { configuredSocialProviders } from '@daegwang/server/features/member/social-config';
import { careRetentionLabel } from '@daegwang/server/features/member/care-service';
export const dynamic = 'force-dynamic';
export async function GET() {
  const notifications = process.env.APP_MEMBER_NOTIFICATIONS_ENABLED === 'true';
  const account = configuredAccountPolicy(); const registration = configuredRegistrationPolicy(); const care = await configuredCarePolicy().catch(() => null); const deletion = configuredDeletionPolicy();
  const policy = registration || account || care || deletion ? { version: registration?.version ?? account?.version ?? care?.version ?? deletion!.version, terms: registration?.terms ?? account?.terms ?? '', privacy: registration?.privacy ?? account?.privacy ?? '', care: care ? `${care.notice}\n보관 기간: 접수일로부터 ${careRetentionLabel(care)}. 지정된 교회 담당자만 열람합니다.` : '', deletion: deletion?.notice ?? account?.deletion ?? '' } : null;
  return Response.json({ ...unavailableMemberOptions, mode: notifications || policy ? 'configured' : 'unavailable', registration: !!registration, socialProviders: configuredSocialProviders(process.env, !!account, !!deletion), churchMembership: process.env.APP_CHURCH_MEMBERSHIP_ENABLED === 'true', recovery: !!account, notifications, care: !!care, deletion: !!deletion, policy, carePolicyVersion: care?.version ?? null, deletionPolicyVersion: deletion?.version ?? null }, { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' } });
}
