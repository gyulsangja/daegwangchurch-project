import { AdminProfileForm } from "../../../../../components/admin/admin-profile-form";
import { requireSuperAdmin } from "../../../../../lib/auth/permissions";
export default async function NewAdminPage() { await requireSuperAdmin(); return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">CONNECT ADMIN</p><h1 className="mt-1 text-3xl font-extrabold">관리자 연결</h1><p className="mt-2 text-text-secondary">Supabase Auth에서 생성한 사용자를 CMS 관리자 권한과 연결합니다.</p><AdminProfileForm /></div>; }
