import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { publicEnv } from '@daegwang/config/env';
import { createAppNoticeQueries } from './app-query-core';
import { createAppNoticeHandlers } from './app-api';

export const appNoticeHandlers = createAppNoticeHandlers(
  () => createAppNoticeQueries(getPrisma(), publicEnv.NEXT_PUBLIC_SUPABASE_URL),
  () => process.env.APP_PUBLIC_NOTICES_ENABLED === 'true',
);

// Public CMS notices only; this never reads MemberRecord or private prayers.
export const appPrayerHandlers = createAppNoticeHandlers(
  () => createAppNoticeQueries(getPrisma(), publicEnv.NEXT_PUBLIC_SUPABASE_URL, () => new Date(), '공동기도'),
  () => process.env.APP_PUBLIC_PRAYERS_ENABLED === 'true',
);
