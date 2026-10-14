import { socialConsentSchema } from '@daegwang/contracts/features/member/extras';
import { createMemberTransport } from './member';
import type { z } from 'zod';
export function readOAuthCode(callback: string, expected: string) {
  const actual = new URL(callback); const target = new URL(expected);
  if (actual.protocol !== target.protocol || actual.host !== target.host || actual.pathname !== target.pathname || actual.username || actual.password || actual.hash || actual.searchParams.has('error') || actual.searchParams.getAll('code').length !== 1) throw new Error('인증 응답을 확인하지 못했습니다. 다시 시작해 주세요.');
  const code = actual.searchParams.get('code');
  if (!code || code.length > 2048) throw new Error('인증번호가 없습니다. 다시 시작해 주세요.');
  return code;
}
export async function saveSocialConsent(base: string | undefined, token: string, input: z.infer<typeof socialConsentSchema>) {
  await createMemberTransport(base, async () => token, 'social-consent')('', 'PATCH', socialConsentSchema.parse(input));
}
