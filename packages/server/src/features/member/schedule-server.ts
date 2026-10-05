import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { createMemberRecordHandler } from './record-api';
import { memberIdentity } from './record-server';
import { createScheduleService } from './schedule-service';
import { createAppEventQueries } from '../events/app-query-core';
export const memberScheduleHandler = createMemberRecordHandler({ ...memberIdentity, service: userId => createScheduleService(getPrisma(), userId, async id => process.env.APP_PUBLIC_EVENTS_ENABLED === 'true' ? createAppEventQueries(getPrisma()).detail(id) : null) });
