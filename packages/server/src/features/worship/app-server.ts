import "server-only";
import { getPrisma } from "@daegwang/database/prisma";
import { createAppWorshipQueries } from "@daegwang/server/features/worship/app-query-core";
import { createAppWorshipHandlers } from "@daegwang/server/features/worship/app-api";

export const isAppPublicationEnabled = () => process.env.APP_PUBLICATION_ENABLED === "true";
export const appWorshipHandlers = createAppWorshipHandlers(() => createAppWorshipQueries(getPrisma()), isAppPublicationEnabled);
