import 'server-only';
import { z } from 'zod';
import { getPrisma } from '@daegwang/database/prisma';
import { requireSupabaseConfig } from '@daegwang/config/env';
import { createMemberRecordHandler } from './record-api';
import { createMemberRecordService } from './record-service';
import { createAppWorshipQueries } from '../worship/app-query-core';
export const memberIdentity = {
  enabled: () => process.env.APP_MEMBER_RECORDS_ENABLED === 'true',
  allowedOrigins: () => (process.env.APP_MEMBER_ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean),
  async authenticate(token: string) {
    const { url, publishableKey } = requireSupabaseConfig();
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error('Identity provider unavailable');
    const user = z.object({ id: z.uuid(), is_anonymous: z.boolean().optional() }).safeParse(await response.json());
    if (!user.success || user.data.is_anonymous) return null;
    if (await getPrisma().memberDeletion.findUnique({ where: { ownerId: user.data.id }, select: { ownerId: true } })) return null;
    return user.data.id;
  },
};
export const memberRecordHandler = createMemberRecordHandler({ ...memberIdentity, service: userId => createMemberRecordService(getPrisma(), userId, async id => process.env.APP_PUBLICATION_ENABLED === 'true' ? createAppWorshipQueries(getPrisma()).detail(id) : null) });
