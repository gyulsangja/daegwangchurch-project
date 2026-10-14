import Link from 'next/link';
import { appReadiness } from '../../lib/app-readiness';
import { configuredAccountPolicy, configuredRegistrationPolicy } from '@daegwang/server/features/member/account-server';
import { configuredDeletionPolicy } from '@daegwang/server/features/member/deletion-server';
import { pushConfig } from '@daegwang/server/features/member/push-config';
import { configuredSocialProviders } from '@daegwang/server/features/member/social-config';
import { configuredCarePolicy } from '@daegwang/server/features/member/operations-server';
export async function ServiceAvailability() {
  const account = configuredAccountPolicy(); const deletion = configuredDeletionPolicy();
  const care = await configuredCarePolicy(); const social = configuredSocialProviders(process.env, !!account, !!deletion);
  const items = [
    ...appReadiness(process.env).map(item => ({ ...item, reason: '서버 공개 연결 설정이 꺼져 있습니다. 콘텐츠는 해당 관리 메뉴에서 확인하세요.' })),
    { label: '교인 확인', enabled: process.env.APP_CHURCH_MEMBERSHIP_ENABLED === 'true', href: '/admin/members', reason: '교인 확인 서버 연결이 꺼져 있습니다.' },
    { label: '모임 소식', enabled: process.env.APP_GROUPS_ENABLED === 'true', href: '/admin/groups', reason: '모임 소식 서버 연결이 꺼져 있습니다.' },
    { label: '상담·심방', enabled: !!care, href: '/admin/care', reason: '접수 설정에서 담당자·보관 기간을 정하고 새 요청 받기를 켜세요.' },
    { label: '이메일 가입', enabled: !!configuredRegistrationPolicy(), href: '', reason: '가입 서버 설정을 확인해 주세요. 이메일 인증 여부는 Supabase 설정을 따릅니다.' },
    { label: '비밀번호 복구', enabled: !!account, href: '', reason: '비밀번호 복구 이메일 발송 설정이 필요합니다.' },
    { label: '구글·카카오 가입', enabled: social.length === 2, href: '', reason: `연결된 제공자: ${social.join(', ') || '없음'}. 각 개발자 콘솔·Supabase 로그인 설정이 필요합니다.` },
    { label: '휴대폰 푸시', enabled: pushConfig(process.env).available, href: '', reason: '푸시 자격 증명 또는 자동 발송 연결을 확인해야 합니다.' },
  ];
  const unavailable = items.filter(item => !item.enabled);
  return <details className="mt-8 rounded-xl border border-border bg-white p-5"><summary className="focus-ring cursor-pointer font-bold">이용 설정 확인 · {unavailable.length ? `${unavailable.length}개 확인 필요` : '서버 설정 연결됨'}</summary><p className="mt-3 text-sm text-text-secondary">웹·앱 공통 관리 기능의 서버 설정입니다. 실제 휴대폰 푸시 수신과 외부 계정 로그인 성공 여부는 별도 확인이 필요합니다.</p><ul className="mt-4 divide-y divide-border">{items.map(item => <li key={item.label} className="py-3"><p className="font-semibold">{item.label} · {item.enabled ? '설정 연결됨' : '확인 필요'}</p>{!item.enabled && <p className="mt-1 text-sm text-text-secondary">{item.reason}</p>}{item.href && <Link href={item.href} className="inline-flex min-h-11 items-center text-sm font-bold text-primary-700">관리 화면 열기 →</Link>}</li>)}</ul></details>;
}
