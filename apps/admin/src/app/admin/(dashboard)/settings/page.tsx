import { SiteSettingForm } from "../../../../components/admin/site-setting-form";
import { getSiteSettings } from "@daegwang/server/features/settings/queries";
export default async function AdminSettingsPage() { const settings = await getSiteSettings(); return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">SITE SETTINGS</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">교회 기본 정보</h1><p className="mt-2 text-text-secondary">홈페이지와 앱의 기본 정보, 주소, 공개 연락처와 외부 채널을 관리합니다.</p><SiteSettingForm values={settings} /></div>; }
