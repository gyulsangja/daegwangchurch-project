import { appWorshipHandlers } from "@daegwang/server/features/worship/app-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return appWorshipHandlers.detail((await params).id);
}
