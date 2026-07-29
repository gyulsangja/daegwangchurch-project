import { FixedPageForm } from "@/components/admin/fixed-page-form";
import { getChurchPageContent } from "@/features/pages/queries";

export default async function AdminChurchPage() {
  const page = await getChurchPageContent(false);
  return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">ABOUT CHURCH</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">교회소개 관리</h1><p className="mt-2 text-text-secondary">교회소개 페이지의 핵심 문구와 가치를 수정합니다.</p><FixedPageForm variant="church" content={page.content} status={page.status} /></div>;
}
