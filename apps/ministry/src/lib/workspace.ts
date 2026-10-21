import 'server-only';
import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { createDirectory, type Actor } from '@daegwang/ministry-core/directory';
import { createFixture } from '@daegwang/ministry-core/fixture';
import { isLocalReviewEnabled } from '@daegwang/ministry-core/local-access';

const globalStore = globalThis as typeof globalThis & { ministryReview?: ReturnType<typeof createDirectory> };
export const reviewActor: Actor = { id: 'local-review-admin', churchId: 'demo-daegwang', role: 'ADMIN', organizationIds: [] };
export const enabled = (host: string | null) => isLocalReviewEnabled({ NODE_ENV: process.env.NODE_ENV, MINISTRY_LOCAL_DEMO: process.env.MINISTRY_LOCAL_DEMO }, host);
export function directory(host: string | null) {
  if (!enabled(host)) throw new Error('LOCAL_REVIEW_DISABLED');
  return globalStore.ministryReview ??= createDirectory(createFixture(), randomUUID);
}
export async function workspace() {
  const host = (await headers()).get('host');
  if (!enabled(host)) notFound();
  const service = directory(host);
  return { service, actor: reviewActor, config: service.config(reviewActor) };
}
