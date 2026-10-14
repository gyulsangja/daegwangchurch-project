import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { requireSupabaseConfig } from '@daegwang/config/env';
import { createClient } from '@supabase/supabase-js';
import { socialConsentSchema } from '@daegwang/contracts/features/member/extras';
import { configuredAccountPolicy } from './account-server';
import { configuredDeletionPolicy } from './deletion-server';
import { configuredSocialProviders } from './social-config';
import { createMemberRecordHandler } from './record-api';
import { memberIdentity } from './record-server';
import { MemberRecordConflict } from './record-service';
import { requestChurchOnSignup } from './church-membership';
const unsupported = async () => { throw new MemberRecordConflict(); };
export async function socialConsentHandler(request: Request) {
  const policy = configuredAccountPolicy();
  const providers = configuredSocialProviders(process.env, !!policy, !!configuredDeletionPolicy());
  return createMemberRecordHandler({ allowedOrigins: memberIdentity.allowedOrigins, enabled: () => !!policy && providers.length > 0,
    async authenticate(token) {
      const { url, publishableKey } = requireSupabaseConfig();
      const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) } }).auth;
      const { data, error } = await auth.getUser(token);
      if (error || !data.user || data.user.is_anonymous || !data.user.email || !data.user.email_confirmed_at || !data.user.identities?.some(identity => providers.includes(identity.provider as 'google' | 'kakao'))) return null;
      if (await getPrisma().memberDeletion.findUnique({ where: { ownerId: data.user.id } })) return null;
      return data.user.id;
    },
    service(ownerId) { return { list: unsupported, detail: unsupported, create: unsupported, remove: unsupported,
      async update(_id, input) {
        const value = socialConsentSchema.parse(input);
        if (value.policyVersion !== policy!.version) throw new MemberRecordConflict();
        if (value.churchRequest && process.env.APP_CHURCH_MEMBERSHIP_ENABLED !== 'true') throw new MemberRecordConflict();
        await getPrisma().$transaction(async tx => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}::text, 0))`;
          if (await tx.memberDeletion.findUnique({ where: { ownerId } })) throw new MemberRecordConflict();
          const consent = { consentVersion: policy!.version, consentedAt: new Date(), consentSnapshot: { terms: policy!.terms, privacy: policy!.privacy } };
          await tx.memberProfile.upsert({ where: { ownerId }, create: { ownerId, displayName: value.displayName, ...consent }, update: {} });
          await tx.memberProfile.updateMany({ where: { ownerId, consentVersion: { not: policy!.version } }, data: { ...consent, version: { increment: 1 } } });
          await tx.memberProfile.updateMany({ where: { ownerId, consentVersion: null }, data: { displayName: value.displayName, ...consent, version: { increment: 1 } } });
          if (value.churchRequest) await requestChurchOnSignup(tx, ownerId, value.churchRequest);
        });
        return { ok: true };
      },
    }; },
  })(request, 'consent');
}
