import { FixedPageForm } from "../../../../../components/admin/fixed-page-form";
import { getVisionPageContent } from "@daegwang/server/features/pages/queries";

export default async function AdminVisionPage() {
  const page = await getVisionPageContent(false);
  return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">VISION & MISSION</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">비전과 사명 관리</h1><p className="mt-2 text-text-secondary">목회철학과 교회가 나아갈 방향을 수정합니다.</p><FixedPageForm variant="vision" content={page.content} status={page.status} /></div>;
}
