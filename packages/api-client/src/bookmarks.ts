import { z } from 'zod';
import { bookmarkInputSchema, bookmarkListSchema, bookmarkPageSchema, bookmarkSchema } from '@daegwang/contracts/features/member/bookmarks';
import { createMemberTransport, decodeMemberResponse as decode } from './member';
export function createBookmarkClient(baseUrl: string | undefined, token: () => Promise<string | null>, fetcher: typeof fetch = fetch) {
  const request = createMemberTransport(baseUrl, token, 'bookmarks', fetcher);
  return {
    async list(input: z.input<typeof bookmarkListSchema> = {}, signal?: AbortSignal) { const query = bookmarkListSchema.parse(input); const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return decode(bookmarkPageSchema, await request(`?${params}`, 'GET', undefined, signal)); },
    async save(worshipId: string) { return decode(z.object({ data: bookmarkSchema }), await request('', 'POST', bookmarkInputSchema.parse({ worshipId }))).data; },
    async remove(id: string) { await request(`/${encodeURIComponent(id)}`, 'DELETE', {}); },
  };
}
