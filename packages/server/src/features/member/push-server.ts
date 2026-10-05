import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { memberIdentity } from './record-server';
import { createMemberRecordHandler } from './record-api';
import { createPushDeviceService, revokePushDevice } from './push-device-service';
import { createPushRevokeHandler, createPushWorkerHandler } from './push-api';
import { pushConfig } from './push-config';
import { createPushWorker } from './push-worker';
import { createExpoPushProvider } from './push-provider';

const config = () => pushConfig(process.env);
export const pushDeviceHandler = createMemberRecordHandler({ ...memberIdentity, enabled: () => true, service: owner => createPushDeviceService(getPrisma(), owner, { available: () => config().available, projectId: config().projectId }) });
export const pushRevokeHandler = createPushRevokeHandler(input => revokePushDevice(getPrisma(), input), memberIdentity.allowedOrigins);
export const pushWorkerHandler = createPushWorkerHandler(config, () => createPushWorker(getPrisma(), createExpoPushProvider(config().accessToken), {
  worship: process.env.APP_PUBLICATION_ENABLED === 'true', notices: process.env.APP_PUBLIC_NOTICES_ENABLED === 'true', events: process.env.APP_PUBLIC_EVENTS_ENABLED === 'true', schedules: process.env.APP_MEMBER_RECORDS_ENABLED === 'true',
})());
