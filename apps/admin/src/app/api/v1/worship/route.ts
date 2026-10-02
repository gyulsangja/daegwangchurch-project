import { appWorshipHandlers } from "@daegwang/server/features/worship/app-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return appWorshipHandlers.list(request); }
