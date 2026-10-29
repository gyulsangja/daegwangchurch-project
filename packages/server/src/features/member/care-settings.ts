import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { carePolicySchema } from './care-service';
import {ContentManagementError} from '../church-content/management';

export const careSettingsSchema = z.object({ enabled: z.boolean(), policy: carePolicySchema });
export async function readCareSettings(db: PrismaClient, env: NodeJS.ProcessEnv = process.env) {
  const row = await db.careSetting.findUnique({ where: { id: 'CARE' } });
  if (row) return careSettingsSchema.parse(row);
  try { return { enabled: env.APP_MEMBER_CARE_ENABLED === 'true', policy: carePolicySchema.parse(JSON.parse(env.APP_MEMBER_CARE_POLICY ?? '')) }; }
  catch { return null; }
}

export async function saveCareSettings(db: PrismaClient, actorId: string, input: unknown, expectedVersion?:string|null) {
  const value = careSettingsSchema.parse(input);
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin-member-management', 0))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('care-settings', 0))`;
    const actor = await tx.adminProfile.findFirst({ where: { id: actorId, isActive: true, role: 'SUPER_ADMIN' } });
    if (!actor) throw new Error('FORBIDDEN');
    const current=await tx.careSetting.findUnique({where:{id:'CARE'}});
    if(expectedVersion!==undefined&&(current?careSettingsSchema.parse(current).policy.version:null)!==expectedVersion)throw new ContentManagementError(409,'접수 설정이 다른 화면에서 변경되었습니다. 다시 불러와 주세요.');
    const count = await tx.adminProfile.count({ where: { id: { in: value.policy.adminIds }, isActive: true } });
    if (count !== new Set(value.policy.adminIds).size) throw new Error('INVALID_ADMIN');
    await tx.careSetting.upsert({ where: { id: 'CARE' }, create: { id: 'CARE', ...value }, update: value });
    await tx.activityLog.create({ data: { actorId, action: 'UPDATE', entityType: 'CareSettings', summary: '상담·심방 접수 및 열람 설정 변경' } });
    return value;
  });
}
