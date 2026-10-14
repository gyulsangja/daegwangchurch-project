import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { createMemberRecordHandler } from './record-api';
import { memberIdentity } from './record-server';
import { createChurchMembershipService } from './church-membership';
import { MemberRecordConflict } from './record-service';
const unsupported = async () => { throw new MemberRecordConflict(); };
export const churchMembershipHandler = createMemberRecordHandler({ ...memberIdentity, enabled: () => process.env.APP_CHURCH_MEMBERSHIP_ENABLED === 'true', service: owner => {
  const service = createChurchMembershipService(getPrisma(), owner);
  return { detail: service.detail, update: (_id, input) => service.request(input), list: unsupported, create: unsupported, remove: unsupported };
} });
