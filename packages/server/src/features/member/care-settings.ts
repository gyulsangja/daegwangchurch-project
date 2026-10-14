import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { carePolicySchema } from './care-service';

export const careSettingsSchema = z.object({ enabled: z.boolean(), policy: carePolicySchema });
export async function readCareSettings(db: PrismaClient, env: NodeJS.ProcessEnv = process.env) {
  const row = await db.careSetting.findUnique({ where: { id: 'CARE' } });
  if (row) return careSettingsSchema.parse(row);
  try { return { enabled: env.APP_MEMBER_CARE_ENABLED === 'true', policy: carePolicySchema.parse(JSON.parse(env.APP_MEMBER_CARE_POLICY ?? '')) }; }
  catch { return null; }
}

export async function saveCareSettings(db: PrismaClient, actorId: string, input: unknown) {
  const value = careSettingsSchema.parse(input);
  return db.$transaction(async tx => {
    const actor = await tx.adminProfile.findFirst({ where: { id: actorId, isActive: true, role: 'SUPER_ADMIN' } });
    if (!actor) throw new Error('FORBIDDEN');
    const count = await tx.adminProfile.count({ where: { id: { in: value.policy.adminIds }, isActive: true } });
    if (count !== new Set(value.policy.adminIds).size) throw new Error('INVALID_ADMIN');
    await tx.careSetting.upsert({ where: { id: 'CARE' }, create: { id: 'CARE', ...value }, update: value });
    await tx.activityLog.create({ data: { actorId, action: 'UPDATE', entityType: 'CareSettings', summary: '상담·심방 접수 및 열람 설정 변경' } });
    return value;
  });
}
