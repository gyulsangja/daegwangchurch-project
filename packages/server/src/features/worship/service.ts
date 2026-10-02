import "server-only";

import { createWorshipService } from "@daegwang/server/features/worship/service-core";
import { getPrisma } from "@daegwang/database/prisma";

export function getWorshipService() {
  return createWorshipService(getPrisma());
}
