import { z } from 'zod';
import { memberScheduleInputSchema, memberScheduleListSchema, memberSchedulePageSchema, memberScheduleSchema, memberScheduleUpdateSchema, type PersonalSchedule } from '@daegwang/contracts/features/member/schedules';
import { createMemberTransport, decodeMemberResponse as decode } from './member';
export function createScheduleClient(baseUrl: string | undefined, token: () => Promise<string | null>, fetcher: typeof fetch = fetch) {
  const request = createMemberTransport(baseUrl, token, 'schedules', fetcher);
  return {
    async list(input: z.input<typeof memberScheduleListSchema> = {}, signal?: AbortSignal) { const query = memberScheduleListSchema.parse(input); const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return decode(memberSchedulePageSchema, await request(`?${params}`, 'GET', undefined, signal)); },
    async detail(id: string, signal?: AbortSignal) { return decode(z.object({ data: memberScheduleSchema }), await request(`/${encodeURIComponent(id)}`, 'GET', undefined, signal)).data; },
    async create(content: z.input<typeof memberScheduleInputSchema>) { return decode(z.object({ data: memberScheduleSchema }), await request('', 'POST', memberScheduleInputSchema.parse(content))).data; },
    async update(id: string, version: number, content: PersonalSchedule) { return decode(z.object({ data: z.object({ id: z.string(), version: z.number().int().positive() }) }), await request(`/${encodeURIComponent(id)}`, 'PATCH', memberScheduleUpdateSchema.parse({ version, content }))).data; },
    async remove(id: string, version: number) { await request(`/${encodeURIComponent(id)}`, 'DELETE', { version }); },
  };
}
