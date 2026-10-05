import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { publicEnv } from '@daegwang/config/env';
import { createAppChurchQueries } from './app-query-core';
import { createAppChurchHandler } from './app-api';
export const appChurchHandler = createAppChurchHandler(() => createAppChurchQueries(getPrisma(), () => new Date(), publicEnv.NEXT_PUBLIC_SUPABASE_URL), () => process.env.APP_PUBLIC_CHURCH_ENABLED === 'true');
