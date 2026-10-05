import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { configuredAccountPolicy } from '@daegwang/server/features/member/account-server';
import { configuredCarePolicy } from '@daegwang/server/features/member/operations-server';
import { configuredDeletionPolicy } from '@daegwang/server/features/member/deletion-server';
import { pushConfig } from '@daegwang/server/features/member/push-config';
export async function operationStatus() {
  try {
    const db = getPrisma(); const now = new Date();
    const [published, synced, schedules, bulletins, site, groups, deletions] = await Promise.all([
      db.worshipContent.count({ where: { status: 'PUBLISHED', deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] } }),
      db.worshipPublication.findMany({ where: { channel: 'APP', worshipContent: { status: 'PUBLISHED', deletedAt: null } }, select: { sourceUpdatedAt: true, worshipContent: { select: { updatedAt: true } } } }),
      db.worshipSchedule.count({ where: { isVisible: true, deletedAt: null } }),
      db.bulletin.count({ where: { status: 'PUBLISHED', deletedAt: null, pdfMedia: { visibility: 'PUBLIC', deletedAt: null }, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] } }),
      db.siteSetting.findUnique({ where: { singletonKey: 'SITE' }, select: { phone: true, email: true, address: true } }),
      db.churchGroup.count({ where: { isActive: true } }),
      db.memberDeletion.count({ where: { status: 'PENDING' } }),
    ]);
    const missing = Math.max(0, published - synced.filter(row => row.sourceUpdatedAt.getTime() === row.worshipContent.updatedAt.getTime()).length);
    const push = pushConfig(process.env);
    const pushCounts = push.available ? await db.memberPushDelivery.groupBy({ by: ['status'], _count: true }) : [];
    const pushDevices = push.available ? await db.memberPushDevice.count({ where: { expiresAt: { gt: now } } }) : 0;
    const failures = pushCounts.filter(row => ['FAILED', 'UNKNOWN'].includes(row.status)).reduce((total, row) => total + row._count, 0);
    return [
      { label: '말씀 통합 반영', detail: missing ? `공개 말씀 ${published}건 중 ${missing}건은 편집 화면에서 확인 후 저장이 필요합니다.` : `공개 말씀 ${published}건 · 저장 상태 일치`, href: '/admin/worship', ready: !missing },
      { label: '주보·예배 안내', detail: `공개 주보 ${bulletins}건 · 예배 시간표 ${schedules}건`, href: '/admin/bulletins', ready: bulletins > 0 && schedules > 0 },
      { label: '교회 연락처', detail: site?.address && (site.phone || site.email) ? '주소와 대표 연락처가 등록되어 있습니다. 실제 정보인지 확인해 주세요.' : '주소 또는 대표 연락처를 확인해 주세요.', href: '/admin/settings', ready: !!(site?.address && (site.phone || site.email)) },
      { label: '개인 묵상·기도·일정', detail: process.env.APP_MEMBER_RECORDS_ENABLED === 'true' ? '연결 활성 · 실제 회원 로그인과 저장 확인 필요' : '연결 꺼짐', href: '/admin/app-operations', ready: process.env.APP_MEMBER_RECORDS_ENABLED === 'true' },
      { label: '모임·소속 안내', detail: `활성 모임 ${groups}개 · ${process.env.APP_GROUPS_ENABLED === 'true' ? '앱 연결 활성' : '앱 연결 꺼짐'}`, href: '/admin/groups', ready: groups > 0 && process.env.APP_GROUPS_ENABLED === 'true' },
      { label: '상담·심방', detail: configuredCarePolicy() ? '담당자·동의·보관 설정 완료 · 실제 접수 확인 필요' : '담당자·동의 문구·보관 기간 미정 · 접수 중지', href: '/admin/care', ready: !!configuredCarePolicy() },
      { label: '가입·비밀번호 복구', detail: configuredAccountPolicy() ? (configuredDeletionPolicy() ? '가입·복구 연결 활성 · 실제 메일 도착 확인 필요' : '복구 연결 활성 · 가입은 탈퇴 설정 완료 후 활성') : '약관·개인정보 안내·SMTP·인증 메일 설정 대기', href: '/admin/app-operations', ready: !!configuredAccountPolicy() && !!configuredDeletionPolicy() },
      { label: '회원탈퇴', detail: `${configuredDeletionPolicy() ? '접수 활성' : '정책·인증 서버 키·재처리 작업 설정 대기'} · 계정 삭제 대기 ${deletions}건`, href: '/admin/app-operations', ready: !!configuredDeletionPolicy() && deletions === 0 },
      { label: '휴대폰 푸시', detail: push.available ? `설정 활성 · 등록 기기 ${pushDevices}대 · 실패/결과 미확인 ${failures}건. 주기 작업 실행과 실제 휴대폰 도착을 확인하세요. 제공자 접수는 화면 표시를 보장하지 않습니다.` : '앱·발송 작업 구현 · Expo/FCM 계정 연결과 배포 서버의 5분 주기 작업 설정 대기. 현재 실제 발송 꺼짐.', href: '/admin/app-operations', ready: false },
    ];
  } catch { return [{ label: '운영 상태 조회', detail: 'DB 연결과 migration 적용 상태를 확인해 주세요.', href: '/admin/app-operations', ready: false }]; }
}
