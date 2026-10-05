export type AppReadiness = { key: string; label: string; enabled: boolean; href: string; note: string };
export function appReadiness(env: Record<string, string | undefined>): AppReadiness[] {
  return [
    ['APP_PUBLICATION_ENABLED', '말씀', '/admin/worship', '한 번 저장하면 홈페이지와 앱에 같은 내용이 반영됩니다. 이전 콘텐츠는 편집 화면에서 저장 상태를 확인하세요.'],
    ['APP_PUBLIC_NOTICES_ENABLED', '공지사항', '/admin/notices', '공개 상태와 게시 시작·종료 시간을 확인하세요.'],
    ['APP_PUBLIC_BULLETINS_ENABLED', '주보', '/admin/bulletins', '공개 PDF와 발행 날짜를 확인하세요.'],
    ['APP_PUBLIC_EVENTS_ENABLED', '교회 일정', '/admin/events', '시작·종료 시간과 장소를 확인하세요.'],
    ['APP_PUBLIC_CHURCH_ENABLED', '교회 안내', '/admin/pages', '소개·예배 시간·대표 연락처를 최신으로 유지하세요.'],
    ['APP_PUBLIC_PRAYERS_ENABLED', '공동기도', '/admin/notices', '공동기도 분류의 공개 공지입니다. 개인 기도는 포함되지 않습니다.'],
  ].map(([key, label, href, note]) => ({ key, label, href, note, enabled: env[key] === 'true' }));
}
export function allowAdminPreview(mode: string | undefined, enabled: string | undefined, host: string | null) {
  return mode === 'development' && enabled === 'true' && !!host && /^(localhost|127\.0\.0\.1):3001$/.test(host);
}
