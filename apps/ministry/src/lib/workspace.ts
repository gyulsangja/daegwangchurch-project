import 'server-only';
import {resolve} from 'node:path';
import {persistentDirectory} from './persistent-directory';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { type Actor } from '@daegwang/ministry-core/directory';
import { isLocalReviewEnabled } from '@daegwang/ministry-core/local-access';

export const reviewActor: Actor = { id: 'local-review-admin', churchId: 'demo-daegwang', role: 'ADMIN', organizationIds: [], permissions: ['CARE'] };
export const enabled = (host: string | null) => isLocalReviewEnabled({ NODE_ENV: process.env.NODE_ENV, MINISTRY_LOCAL_DEMO: process.env.MINISTRY_LOCAL_DEMO }, host);
export function directory(host: string | null) {
  if (!enabled(host)) throw new Error('LOCAL_REVIEW_DISABLED');
  return persistentDirectory(process.env.MINISTRY_LOCAL_DB_PATH ?? resolve(process.cwd(),'../../.local/ministry/review.sqlite'));
}
export async function workspace() {
  const host = (await headers()).get('host');
  if (!enabled(host)) notFound();
  const service = directory(host);
  return { service, actor: reviewActor, config: service.config(reviewActor) };
}
