import { HomePageForm } from "@/components/admin/home-page-form";
import { getHomePageContent } from "@/features/pages/queries";
export default async function AdminHomePage() { const page = await getHomePageContent(false); return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">HOME PAGE</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">메인 화면 관리</h1><p className="mt-2 text-text-secondary">대표 문구와 메인 화면의 주요 영역 노출을 관리합니다.</p><HomePageForm content={page.content} status={page.status} /></div>; }
