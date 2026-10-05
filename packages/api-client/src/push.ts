import { z } from 'zod';
import { pushCredentialSchema, pushDeviceSchema, pushRegistrationSchema, pushStatusSchema, type PushCredential, type PushRegistration } from '@daegwang/contracts/features/member/push';
import { createMemberTransport, decodeMemberResponse } from './member';
import { ApiError } from './worship';

export function createPushClient(base: string | undefined, token: () => Promise<string | null>, fetcher: typeof fetch = fetch) {
  const request = createMemberTransport(base, token, 'push-devices', fetcher);
  return {
    status: async () => decodeMemberResponse(pushStatusSchema, await request('', 'GET')),
    register: async (input: PushRegistration) => decodeMemberResponse(z.object({ data: pushDeviceSchema }), await request('', 'POST', pushRegistrationSchema.parse(input))).data,
  };
}
export async function revokePush(base: string | undefined, input: PushCredential, fetcher: typeof fetch = fetch) {
  const url = new URL(base ?? '');
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname)))) throw new ApiError(0, '알림 연결 주소를 확인해 주세요.');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const result = await fetcher(`${url.href.replace(/\/$/, '')}/api/v1/push/revoke`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pushCredentialSchema.parse(input)), signal: controller.signal, credentials: 'omit', redirect: 'error', cache: 'no-store' });
    if (!result.ok) throw new ApiError(result.status, '이 기기의 푸시 해제를 완료하지 못했습니다.');
  } catch { throw new ApiError(0, '푸시 해제를 확인하지 못했습니다. 연결 후 다시 시도하거나 휴대폰 설정에서 알림을 꺼 주세요.'); }
  finally { clearTimeout(timer); }
}
