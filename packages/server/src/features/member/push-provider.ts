import { z } from 'zod';

const resultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), id: z.string().min(1).max(200).optional() }),
  z.object({ status: z.literal('error'), details: z.object({ error: z.string() }).optional() }),
]);
export type PushResult = { status: 'accepted'; receiptId: string } | { status: 'delivered' | 'pending' | 'retry' | 'unknown' | 'failed' | 'unregistered'; code: string };
export type PushMessage = { to: string; notificationId: string; ttl: number; priority?: 'normal' | 'high' };
export type PushProvider = { send: (message: PushMessage) => Promise<PushResult>; receipt: (id: string) => Promise<PushResult> };
function failure(code?: string): PushResult {
  if (code === 'DeviceNotRegistered') return { status: 'unregistered', code };
  if (code === 'MessageRateExceeded') return { status: 'retry', code };
  return { status: 'failed', code: ['MessageTooBig', 'MismatchSenderId', 'InvalidCredentials'].includes(code ?? '') ? code! : 'ProviderRejected' };
}
export function createExpoPushProvider(accessToken?: string, fetcher: typeof fetch = fetch): PushProvider {
  async function post(path: string, body: unknown) {
    return fetcher(`https://exp.host/--/api/v2/push/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(8000) });
  }
  return {
    async send(message) {
      try {
        // No personal content, membership, owner ID or untrusted URL in a lock-screen payload.
        const response = await post('send', { to: message.to, title: '대광교회', body: '새 알림이 있습니다. 앱에서 확인해 주세요.', data: { notificationId: message.notificationId }, sound: 'default', channelId: 'church-updates', ttl: message.ttl, priority: message.priority ?? 'normal' });
        if (response.status === 429) return { status: 'retry', code: 'RateLimited' };
        if (response.status >= 500) return { status: 'unknown', code: 'ProviderUnavailable' };
        if (!response.ok) return { status: 'failed', code: 'ProviderRejected' };
        const parsed = z.object({ data: resultSchema }).safeParse(await response.json());
        if (!parsed.success) return { status: 'unknown', code: 'InvalidResponse' };
        const result = parsed.data.data;
        return result.status === 'error' ? failure(result.details?.error) : result.id ? { status: 'accepted', receiptId: result.id } : { status: 'unknown', code: 'MissingTicket' };
      } catch { return { status: 'unknown', code: 'NetworkUncertain' }; }
    },
    async receipt(id) {
      try {
        const response = await post('getReceipts', { ids: [id] });
        if (!response.ok) return { status: 'pending', code: 'ReceiptUnavailable' };
        const parsed = z.object({ data: z.record(z.string(), resultSchema) }).safeParse(await response.json());
        if (!parsed.success || !parsed.data.data[id]) return { status: 'pending', code: 'ReceiptPending' };
        const result = parsed.data.data[id];
        return result.status === 'ok' ? { status: 'delivered', code: 'ProviderDelivered' } : failure(result.details?.error);
      } catch { return { status: 'pending', code: 'ReceiptUnavailable' }; }
    },
  };
}
