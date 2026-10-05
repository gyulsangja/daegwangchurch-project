import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { publicEnv } from '@daegwang/config/env';
import { createAppBulletinQueries } from './app-query-core';
import { createAppBulletinHandlers } from './app-api';

export const appBulletinHandlers = createAppBulletinHandlers(
  () => createAppBulletinQueries(getPrisma(), publicEnv.NEXT_PUBLIC_SUPABASE_URL),
  () => process.env.APP_PUBLIC_BULLETINS_ENABLED === 'true',
);
