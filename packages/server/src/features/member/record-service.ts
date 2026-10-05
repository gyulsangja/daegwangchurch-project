import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { memberRecordInputSchema, memberRecordListSchema, memberRecordSchema, memberRecordUpdateSchema, recordWorshipSchema, type MemberRecordInput } from '@daegwang/contracts/features/member/records';
export class MemberRecordNotFound extends Error {}
export class MemberRecordConflict extends Error {}
export function createMemberRecordService(database: Pick<PrismaClient, 'memberRecord'>, verifiedUserId: string, findWorship?: (id: string) => Promise<unknown>) {
  const ownerId = z.uuid().parse(verifiedUserId);
  const dto = (row: { id: string; content: unknown; version: number; createdAt: Date; updatedAt: Date }) => memberRecordSchema.parse({ id: row.id, content: row.content, version: row.version, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  async function checkReflection(content: MemberRecordInput) {
    if (content.kind !== 'REFLECTION' && content.reflectionId) {
      const reference = await database.memberRecord.findFirst({ where: { id: content.reflectionId, ownerId, kind: 'REFLECTION' }, select: { id: true } });
      if (!reference) throw new MemberRecordNotFound();
    }
  }
  return {
    async list(input: unknown) {
      const query = memberRecordListSchema.parse(input);
      const rows = await database.memberRecord.findMany({ where: { ownerId, kind: query.kind, AND: [
        ...(query.date ? [{ content: { path: ['date'], equals: query.date } }] : []),
        ...(query.worshipId ? [{ content: { path: ['worship', 'id'], equals: query.worshipId } }] : []),
        ...(query.month ? [{ content: { path: ['date'], string_starts_with: query.month + '-' } }] : []),
        ...(query.reflectionId ? [{ content: { path: ['reflectionId'], equals: query.reflectionId } }] : []),
      ] }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], skip: query.page * 20, take: 21 });
      return { data: rows.slice(0, 20).map(dto), nextPage: rows.length > 20 ? query.page + 1 : null };
    },
    async detail(id: string) {
      const row = await database.memberRecord.findFirst({ where: { id, ownerId } });
      if (!row) throw new MemberRecordNotFound();
      return dto(row);
    },
    async create(input: unknown) {
      const content = memberRecordInputSchema.parse(input);
      if (content.kind === 'REFLECTION') {
        const worship = await findWorship?.(content.worship.id);
        if (!worship) throw new MemberRecordNotFound();
        // Save only the public reference, never trust the client-supplied snapshot.
        content.worship = recordWorshipSchema.strip().parse(worship);
      }
      await checkReflection(content);
      return dto(await database.memberRecord.create({ data: { ownerId, kind: content.kind, content } }));
    },
    async update(id: string, input: unknown) {
      const { version, content } = memberRecordUpdateSchema.parse(input);
      const existing = await database.memberRecord.findFirst({ where: { id, ownerId }, select: { id: true, kind: true, content: true } });
      if (!existing) throw new MemberRecordNotFound();
      if (existing.kind !== content.kind) throw new MemberRecordConflict();
      if (content.kind === 'REFLECTION') {
        const previous = memberRecordInputSchema.parse(existing.content);
        if (previous.kind !== 'REFLECTION' || previous.worship.id !== content.worship.id) throw new MemberRecordConflict();
        content.worship = previous.worship;
      } else {
        const previous = memberRecordInputSchema.parse(existing.content);
        if (previous.kind === 'REFLECTION' || previous.reflectionId !== content.reflectionId) await checkReflection(content);
      }
      const result = await database.memberRecord.updateMany({ where: { id, ownerId, version }, data: { content, version: { increment: 1 } } });
      if (!result.count) throw new MemberRecordConflict();
      return { id, version: version + 1 };
    },
    async remove(id: string, input: unknown) {
      const { version } = z.object({ version: z.number().int().positive() }).strict().parse(input);
      const existing = await database.memberRecord.findFirst({ where: { id, ownerId }, select: { id: true } });
      if (!existing) throw new MemberRecordNotFound();
      const result = await database.memberRecord.deleteMany({ where: { id, ownerId, version } });
      if (!result.count) throw new MemberRecordConflict();
    },
  };
}
