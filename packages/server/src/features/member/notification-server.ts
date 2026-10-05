import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { memberIdentity } from './record-server';
import { createMemberRecordHandler } from './record-api';
import { createNotificationServices } from './notification-service';
import { createAutomaticNotificationService } from './notification-sync';
const enabled = () => process.env.APP_MEMBER_NOTIFICATIONS_ENABLED === 'true';
export const notificationHandler = createMemberRecordHandler({ ...memberIdentity, enabled, service: owner => createAutomaticNotificationService(getPrisma(), owner, { push: true, worship: process.env.APP_PUBLICATION_ENABLED === 'true', notices: process.env.APP_PUBLIC_NOTICES_ENABLED === 'true', events: process.env.APP_PUBLIC_EVENTS_ENABLED === 'true', schedules: process.env.APP_MEMBER_RECORDS_ENABLED === 'true' }) });
export const preferenceHandler = createMemberRecordHandler({ ...memberIdentity, enabled, service: owner => createNotificationServices(getPrisma(), owner).preferences });
