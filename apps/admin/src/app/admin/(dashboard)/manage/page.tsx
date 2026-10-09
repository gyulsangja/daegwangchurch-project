import Link from 'next/link';
import { requireAdmin } from '../../../../lib/auth/permissions';

export default async function ManagePage() {
  const admin = await requireAdmin();
  const links = [
    { href: '/admin/settings', title: '교회 기본 정보', description: '홈페이지와 앱의 주소·연락처·외부 채널을 관리합니다.' },
    ...(admin.role === 'SUPER_ADMIN' ? [
      { href: '/admin/inquiries', title: '방문 문의', description: '홈페이지로 접수된 새가족·방문 문의를 확인합니다.' },
      { href: '/admin/admins', title: '관리자 계정', description: '콘텐츠를 함께 관리할 담당자와 권한을 설정합니다.' },
      { href: '/admin/media', title: '첨부파일 정리', description: '이미 올린 파일을 확인합니다. 새 파일은 각 게시물에서 바로 올리세요.' },
      { href: '/admin/activity', title: '변경 이력', description: '누가 어떤 내용을 수정했는지 필요할 때 확인합니다.' },
    ] : []),
    ...(process.env.APP_GROUPS_ENABLED === 'true' ? [{ href: '/admin/groups', title: '모임·소속 관리', description: '담당 모임의 소속 승인과 소속 전용 소식을 관리합니다.' }] : []),
    ...(process.env.APP_MEMBER_CARE_ENABLED === 'true' ? [{ href: '/admin/care', title: '상담·심방 접수', description: '열람 권한이 있는 담당자의 요청을 확인합니다.' }] : []),
  ];
  return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-extrabold">관리 설정</h1>
    <p className="mt-3 text-text-secondary">가끔 필요한 설정과 관리 도구를 모았습니다.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{links.map(link => <Link key={link.href} href={link.href} className="focus-ring rounded-2xl border border-border bg-white p-6 hover:border-primary-500">
      <h2 className="text-lg font-bold">{link.title}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{link.description}</p>
    </Link>)}</div>
  </div>;
}
