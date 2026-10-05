import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { createAppEventQueries } from './app-query-core';
import { createAppEventHandlers } from './app-api';

export const appEventHandlers = createAppEventHandlers(
  () => createAppEventQueries(getPrisma()),
  () => process.env.APP_PUBLIC_EVENTS_ENABLED === 'true',
);
