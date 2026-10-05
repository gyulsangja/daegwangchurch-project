import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { createMemberRecordHandler } from './record-api';
import { memberIdentity } from './record-server';
import { createBookmarkService } from './bookmark-service';
import { createAppWorshipQueries } from '../worship/app-query-core';
export const bookmarkHandler = createMemberRecordHandler({ ...memberIdentity, service: userId => createBookmarkService(getPrisma(), userId, async id => process.env.APP_PUBLICATION_ENABLED === 'true' ? createAppWorshipQueries(getPrisma()).detail(id) : null) });
