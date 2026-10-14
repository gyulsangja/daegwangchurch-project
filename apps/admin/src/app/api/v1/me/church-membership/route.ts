import { churchMembershipHandler } from '@daegwang/server/features/member/church-membership-server';
export const dynamic = 'force-dynamic';
const handle = (request: Request) => churchMembershipHandler(request, 'membership');
export { handle as GET, handle as PATCH, handle as OPTIONS };
