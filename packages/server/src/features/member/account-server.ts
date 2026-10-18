import 'server-only';
import { createHash, createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getPrisma } from '@daegwang/database/prisma';
import { Prisma } from '@daegwang/database/generated/client';
import { requireSupabaseConfig } from '@daegwang/config/env';
import { accountPolicySchema, createAccountService, AccountOperationError } from './account-service';
import { memberIdentity } from './record-server';
import { deletionConfig } from './deletion-config';
import { requestChurchOnSignup } from './church-membership';
import { withAgePolicy } from './age-policy';

export function configuredAccountPolicy() {
  // Enabling requires reviewed policies, configured SMTP/OTP templates and a server-only salt.
  if (process.env.APP_ACCOUNT_ENABLED !== 'true' || process.env.APP_ACCOUNT_EMAIL_READY !== 'true' || (process.env.APP_ACCOUNT_RATE_LIMIT_SALT?.length ?? 0) < 32) return null;
  try { return withAgePolicy(accountPolicySchema.parse(JSON.parse(process.env.APP_ACCOUNT_POLICY ?? ''))); } catch { return null; }
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function configuredRegistrationPolicy() {
  if (process.env.APP_ACCOUNT_SIMPLE_SIGNUP !== 'true') return deletionConfig(process.env) ? configuredAccountPolicy() : null;
  if ((process.env.APP_ACCOUNT_RATE_LIMIT_SALT?.length ?? 0) < 32) return null;
  if (process.env.APP_ACCOUNT_POLICY) {
    try { return withAgePolicy(accountPolicySchema.parse(JSON.parse(process.env.APP_ACCOUNT_POLICY))); } catch { return null; }
  }
  return withAgePolicy({ version: 'simple-signup-v1', terms: '', privacy: '', deletion: '', care: '' });
}
export async function accountHandler(request: Request, operation: string) {
  const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' });
  const reply = (status: number, message: string) => Response.json({ error: { message } }, { status, headers });
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin && !memberIdentity.allowedOrigins().includes(origin)) return reply(403, '허용되지 않은 요청입니다.');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  if (request.method === 'OPTIONS') { headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS'); headers.set('Access-Control-Allow-Headers', 'Content-Type'); return new Response(null, { status: 204, headers }); }
  const policy = ['signup', 'verify', 'resend'].includes(operation) ? configuredRegistrationPolicy() : configuredAccountPolicy();
  if (!policy) return reply(503, '가입·복구 서비스의 운영 설정을 준비하고 있습니다.');
  if (!['signup', 'verify', 'resend', 'recovery', 'reset'].includes(operation)) return reply(404, '요청한 서비스를 찾을 수 없습니다.');
  if (request.method !== 'POST') return reply(405, '지원하지 않는 요청입니다.');
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, 'JSON 형식이 필요합니다.');
  try {
    const reader = request.body?.getReader(); if (!reader) return reply(422, '입력 내용을 확인해 주세요.');
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) { const part = await reader.read(); if (part.done) break; length += part.value.byteLength; if (length > 16384) { await reader.cancel(); return reply(413, '입력 내용이 너무 깁니다.'); } chunks.push(part.value); }
    let input: unknown; try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(422, '입력 형식을 확인해 주세요.'); }
    if (operation === 'signup' && !z.object({ ageConfirmed: z.literal(true) }).safeParse(input).success) return reply(422, '만 14세 이상 확인이 필요합니다. 최신 앱으로 업데이트한 뒤 가입해 주세요.');
    const { email } = z.object({ email: z.email().max(254) }).parse(input);
    if (operation === 'signup' && z.object({ churchRequest: z.unknown().optional() }).parse(input).churchRequest && process.env.APP_CHURCH_MEMBERSHIP_ENABLED !== 'true') return reply(503, '교인 확인 요청을 준비하고 있습니다.');
    const emailHash = createHmac('sha256', process.env.APP_ACCOUNT_RATE_LIMIT_SALT!).update(email.trim().toLowerCase()).digest('hex');
    const key = `account:${emailHash}`; const db = getPrisma(); const now = new Date(); const until = new Date(now.getTime() + 600000);
    const limits = await db.$queryRaw<Array<{ requestCount: number }>>`INSERT INTO inquiry_rate_limits (key,"windowStartedAt","requestCount","expiresAt","updatedAt") VALUES (${key},${now},1,${until},${now}) ON CONFLICT (key) DO UPDATE SET "requestCount"=CASE WHEN inquiry_rate_limits."expiresAt" <= ${now} THEN 1 ELSE inquiry_rate_limits."requestCount"+1 END, "windowStartedAt"=CASE WHEN inquiry_rate_limits."expiresAt" <= ${now} THEN ${now} ELSE inquiry_rate_limits."windowStartedAt" END, "expiresAt"=CASE WHEN inquiry_rate_limits."expiresAt" <= ${now} THEN ${until} ELSE inquiry_rate_limits."expiresAt" END, "updatedAt"=${now} RETURNING "requestCount"`;
    if (limits[0].requestCount > 10) return reply(429, '잠시 기다린 뒤 다시 시도해 주세요.');
    const { url, publishableKey } = requireSupabaseConfig();
    if (operation === 'signup' && process.env.APP_ACCOUNT_SIMPLE_SIGNUP === 'true') {
      const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: publishableKey }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const settings = response.ok ? await response.json() : null;
      if (!settings?.mailer_autoconfirm || settings.disable_signup) return reply(503, '회원가입 설정을 마무리하고 있습니다. 교회 관리자에게 문의해 주세요.');
    }
    const service = createAccountService({ policy, immediateSignup: process.env.APP_ACCOUNT_SIMPLE_SIGNUP === 'true',
      auth: () => createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }).auth,
      async rememberConsent(ownerId, _email, displayName, accepted, churchRequest) {
        if (churchRequest && process.env.APP_CHURCH_MEMBERSHIP_ENABLED !== 'true') throw new AccountOperationError(503);
        const data = { emailHash, displayName, policyVersion: accepted.version, termsHash: hash(accepted.terms), privacyHash: hash(accepted.privacy), policySnapshot: { ageConfirmed: true, terms: accepted.terms, privacy: accepted.privacy, ...(churchRequest ? { churchRequest } : {}) }, consentedAt: now, expiresAt: new Date(now.getTime() + 86400000) };
        await db.pendingRegistration.upsert({ where: { ownerId }, create: { ownerId, ...data }, update: data });
      },
      async confirmConsent(ownerId) {
        await db.$transaction(async tx => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}::text, 0))`;
          if (await tx.memberDeletion.findUnique({ where: { ownerId } })) throw new AccountOperationError(409);
          const consent = await tx.pendingRegistration.findFirst({ where: { ownerId, emailHash, expiresAt: { gt: new Date() } } });
          if (!consent) throw new AccountOperationError(409);
          const snapshot = z.object({ ageConfirmed: z.literal(true).optional(), terms: z.string(), privacy: z.string(), churchRequest: z.unknown().optional() }).parse(consent.policySnapshot);
          const churchRequest = snapshot.churchRequest;
          consent.policySnapshot = { terms: snapshot.terms, privacy: snapshot.privacy, ...(snapshot.ageConfirmed ? { ageConfirmed: true } : {}) };
          const acceptedSnapshot = snapshot.terms || snapshot.privacy ? { policy: consent.policySnapshot, termsHash: consent.termsHash, privacyHash: consent.privacyHash } : Prisma.DbNull;
          await tx.memberProfile.upsert({ where: { ownerId }, create: { ownerId, displayName: consent.displayName, consentVersion: snapshot.terms || snapshot.privacy ? consent.policyVersion : null, consentedAt: snapshot.terms || snapshot.privacy ? consent.consentedAt : null, consentSnapshot: acceptedSnapshot }, update: {} });
          await tx.memberProfile.updateMany({ where: { ownerId, consentVersion: null }, data: { consentVersion: snapshot.terms || snapshot.privacy ? consent.policyVersion : null, consentedAt: snapshot.terms || snapshot.privacy ? consent.consentedAt : null, consentSnapshot: acceptedSnapshot, version: { increment: 1 } } });
          if (churchRequest) {
            if (process.env.APP_CHURCH_MEMBERSHIP_ENABLED !== 'true') throw new AccountOperationError(503);
            await requestChurchOnSignup(tx, ownerId, churchRequest);
          }
          await tx.pendingRegistration.delete({ where: { ownerId } });
        });
      },
    });
    const result = await service(operation, input); return Response.json({ ok: true, ...result }, { headers });
  } catch (error) {
    if (error instanceof z.ZodError) return reply(422, '입력 내용을 확인해 주세요.');
    if (error instanceof AccountOperationError) return reply(error.status, error.status === 429 ? '잠시 기다린 뒤 다시 시도해 주세요.' : '인증번호와 입력 내용을 확인해 주세요.');
    return reply(503, '요청 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
