import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { requireSupabaseConfig } from '@daegwang/config/env';
import { z } from 'zod';
import { createMemberRecordHandler } from './record-api';
import { memberIdentity } from './record-server';
import { createGroupService } from './group-service';
import { carePolicySchema, createCareService } from './care-service';
import { MemberRecordConflict } from './record-service';
import { profileSchema } from '@daegwang/contracts/features/member/extras';
import { deletionHandler } from './deletion-server';

export function configuredCarePolicy() {
  if (process.env.APP_MEMBER_CARE_ENABLED !== 'true') return null;
  try { return carePolicySchema.parse(JSON.parse(process.env.APP_MEMBER_CARE_POLICY ?? '')); } catch { return null; }
}
const unsupported = async () => { throw new MemberRecordConflict(); };
export const groupHandler = createMemberRecordHandler({ ...memberIdentity, enabled: () => process.env.APP_GROUPS_ENABLED === 'true', service: owner => {
  const service = createGroupService(getPrisma(), owner);
  return { list: service.snapshot, detail: service.snapshot, update: (_id, input) => service.update(input), create: unsupported, remove: unsupported };
} });
export const careHandler = createMemberRecordHandler({ ...memberIdentity, enabled: () => !!configuredCarePolicy(), service: owner => createCareService(getPrisma(), owner, configuredCarePolicy()!) });

// Email comes from verified Supabase identity, never caller-supplied profile JSON.
export async function profileHandler(request: Request) {
  let identity: { id: string; email: string } | null = null;
  const handler = createMemberRecordHandler({ ...memberIdentity, enabled: () => process.env.APP_MEMBER_RECORDS_ENABLED === 'true',
    async authenticate(token) {
      const { url, publishableKey } = requireSupabaseConfig();
      const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (r.status === 401 || r.status === 403) return null;
      if (!r.ok) throw new Error('Identity unavailable');
      const user = z.object({ id: z.uuid(), email: z.email(), is_anonymous: z.boolean().optional() }).parse(await r.json());
      if (user.is_anonymous) return null;
      if (await getPrisma().memberDeletion.findUnique({ where: { ownerId: user.id }, select: { ownerId: true } })) return null;
      identity = user; return user.id;
    },
    service(ownerId) {
      const db = getPrisma();
      async function detail() { const row = await db.memberProfile.upsert({ where: { ownerId }, create: { ownerId }, update: {} }); return profileSchema.parse({ email: identity!.email, displayName: row.displayName, consentVersion: row.consentVersion, version: row.version }); }
      return { detail, list: unsupported, create: unsupported, remove: unsupported,
        async update(_id, input) {
          const value = z.object({ displayName: z.string().trim().max(40), version: z.number().int().positive() }).strict().parse(input);
          const row = await db.memberProfile.updateMany({ where: { ownerId, version: value.version }, data: { displayName: value.displayName, version: { increment: 1 } } });
          if (!row.count) throw new MemberRecordConflict(); return detail();
        },
      };
    },
  });
  if (request.method === 'DELETE') return deletionHandler(request);
  return handler(request, 'profile');
}

export async function publicGroups() {
  const headers = { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' };
  if (process.env.APP_GROUPS_ENABLED !== 'true') return Response.json({ error: { message: '모임 소식을 준비하고 있습니다.' } }, { status: 503, headers });
  try { return Response.json({ data: await createGroupService(getPrisma()).snapshot() }, { headers }); }
  catch { return Response.json({ error: { message: '모임 소식을 불러오지 못했습니다.' } }, { status: 503, headers }); }
}
