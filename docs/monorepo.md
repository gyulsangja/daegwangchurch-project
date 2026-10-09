# 모노레포 운영 및 배포 전환

2026-10-09 서버리스 연결 주의: Vercel 실행용 `apps/admin`·`apps/website`의 DATABASE_URL은 Supabase **transaction pooler(6543)** 를 사용한다. 세션 풀(5432)을 여러 함수 인스턴스에서 사용해 연결 한도가 소진되는 실제 오류를 확인했다. 공통 PrismaPg 풀은 인스턴스당 max 2, 연결 대기 10초, idle 10초로 제한했다. DB CLI의 DIRECT_URL/마이그레이션 연결은 별도로 유지하며 일괄 포트 변경하지 않는다. [Supabase Prisma 연결](https://supabase.com/docs/guides/database/prisma), [Prisma 드라이버 풀 설정](https://docs.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/connection-pool).

2026-10-06 후속: 원격 푸시 모듈/기기 API/발송 작업을 구현하고 푸시 migration까지 실제 DB 총 12개 적용. Expo/FCM 계정·HTTPS 배포·주기 호출·실기기 연결 전으로 발송은 꺼져 있다. 아래 과거 상태보다 [푸시 연결 안내](notifications.md)와 HANDOFF 최상단을 우선한다.

2026-10-05 현재 실제 DB 연결 및 회원·모임·돌봄 저장소, 가입/복구 어댑터, 회원탈퇴 큐가 구현되어 있다. 아래 날짜가 있는 체험/연결 전 기록은 당시 상태이며, 현재 활성 여부와 검증 결과는 [HANDOFF.md](HANDOFF.md) 최상단과 [RELEASE_READINESS.md](RELEASE_READINESS.md)를 따른다. 탈퇴는 [처리 기준](account-deletion.md)에 따라 비활성으로 준비되어 있다.

## 로컬 회원 체험과 운영 API 구분 (2026-10-04)

`npm run dev:mobile:preview`는 `node --import tsx scripts/preview-mobile.mjs`로 127.0.0.1:3210 테스트 API와 8088 Expo를 실행한다. `preview-members.ts`는 계정/세션/개인 기록을 메모리에만 둔다. `.env.local`을 바꾸지 않고 자식 프로세스에 가상 Supabase URL/key와 `EXPO_PUBLIC_DEMO_MODE=true`를 주입한다. 외부 출처의 회원 요청을 거부한다. 고정 인증번호와 가상 토큰은 운영 인증 구현으로 사용하지 않는다.

새 API 계약: `/api/v1/account/options|signup|verify|resend|recovery|reset`, `/api/v1/me/requests`, `/notifications`, `/preferences`, `/profile`. 본인 상세/읽음/취소에는 `/:id`를 사용한다. 운영 Next API의 options는 비활성 상태이고 나머지 신규 어댑터는 503을 반환한다. 신규 운영 DB 스키마/담당자 관리/메일/푸시는 미구현이다. 기존 `/me/records`, `/bookmarks`, `/schedules` 정적 경로는 기존 구현을 계속 사용한다.

실제 전환 전 [회사 PC 점검표](company-pc-checklist.md)를 따른다. 테스트 API를 앱·운영 패키지에서 import하거나 배포하지 않는다. `npm run test:preview`와 `verify-offline-web.mjs`는 fixture 검증이며 운영 통합 검증이 아니다.

## 결정과 경계

저장소 자체가 독산대광교회 플랫폼이다. 홈페이지는 apps/website라는 한 앱이며, 관리자와 모바일을 포함하지 않는다. 저장소 경로 이름 daegwangchurch는 계속 사용한다. 이 채팅은 별도 작업 폴더에서 실행되므로 IDE에서는 이 저장소 루트를 열어야 한다.

모바일 → api-client → contracts 순으로만 서버와 통신한다. 모바일에서 server/database/config/web-ui를 import하지 않는다. contracts에는 Prisma·Next·React·비밀 환경변수 의존성을 넣지 않는다. 서버는 공통 DB 패키지를 사용하며, 웹 Server Actions의 인증·쿠키·redirect는 admin에 남긴다. 공통 코드는 apps의 소스를 역참조하지 않는다. check:boundaries가 이 경계를 확인한다.

서버의 관리자용 query는 자체적으로 인증을 대신하지 않는다. 현재 admin의 보호된 layout, 각 mutation의 requireAdmin/requireSuperAdmin이 접근을 제어한다. 새 API를 만들 때도 엔드포인트에서 반드시 인증/권한을 검사한다. 모바일 말씀 API는 공개된 APP revision만 반환한다. 공개 공지 API의 별도 활성화 조건은 아래를 따른다.

현재 공개 홈페이지는 서버에서 공통 DB 조회 로직을 사용한다. 기존 새가족 문의 제출도 홈페이지 Server Action으로 유지한다. 따라서 홈페이지 DB 권한은 아직 완전한 읽기 전용이 아니다. 앱 로그인, 개인 기록, 교적/재정 구현 시 도메인별 권한과 별도 서비스 전환을 검토한다. 지금은 별도 마이크로서비스를 만들지 않는다.

## 발행과 캐시

홈페이지 공개 화면은 force-dynamic으로 매 요청 DB에서 조회한다. React cache는 한 요청 안의 중복 조회를 줄이는 용도다. admin의 revalidatePath는 /admin 경로만 무효화한다. 분리된 배포의 홈페이지 캐시를 지웠다고 가정하지 않는다. 저장 후 홈페이지를 새로 요청하면 변경을 읽는다. 이미 열린 화면은 새로고침이 필요하다.

말씀 앱 API는 no-store, APP 공개 revision을 조회한다. 2026-10-04 사용자 요청으로 채널별 독립 발행을 폐지하고 공통 저장 트랜잭션에서 원본과 APP revision을 함께 저장한다. 비공개·삭제도 함께 철회한다. 공개 조건과 고정/콘텐츠 날짜/ID 정렬을 홈페이지와 공유한다. 기존 콘텐츠는 관리자 저장으로 동기화하며 API 활성화 설정은 별도로 유지한다. [통합 콘텐츠 기준](unified-content.md)을 따른다. CORS *는 비인증 공개 GET에만 사용한다. 향후 회원/개인정보 API에 이 규칙을 그대로 적용하지 않는다.

공지 API `/api/v1/notices` 및 `/api/v1/notices/:id`는 기본 비활성화다. 관리자가 `APP_PUBLIC_NOTICES_ENABLED=true`로 켜면 홈페이지의 공개 공지를 앱에도 제공한다. 별도 APP revision 방식이 아니며, PUBLISHED/삭제 여부/예약 시작/종료 조건을 홈페이지와 공유한다. 공개·미삭제 첨부파일만 반환하며 DB/스토리지 설정 오류는 503으로 처리한다. 목록은 `page=0`부터 20개씩, `nextPage`로 이동한다. 운영 활성화는 공개 공지 공유 정책 확인 후 진행한다. 이 작업에서는 활성화·배포하지 않았다.

## 로컬 환경

교회 안내 API에 `pastor`, `newcomer`, `contact`도 제공한다. 동일한 APP_PUBLIC_CHURCH_ENABLED 플래그를 사용한다. 목회자 사진에는 공개 Supabase URL 설정이 필요하며 비공개/삭제 사진은 URL을 반환하지 않는다. 연락처 응답에는 공개 대표 전화/이메일/홈페이지/주소/좌표/교통·주차만 포함한다. 지도는 [Google Maps URL 문서](https://developers.google.com/maps/documentation/urls/get-started)의 외부 길찾기 형식을 사용한다.

교회 안내 API `/api/v1/church/about`, `/api/v1/church/schedules`는 `APP_PUBLIC_CHURCH_ENABLED=true`에서 활성화한다(기본 false). 소개는 발행된 ABOUT_CHURCH 페이지의 공개 필드만, 예배 시간표는 isVisible·미삭제 항목만 반환한다. 발행 시점 이전 소개는 404, 시간표 없음은 빈 배열, DB 오류는 503이다. no-store와 공개 GET용 CORS 규칙을 따른다.

행사 API `/api/v1/events` 및 `/:id`는 `APP_PUBLIC_EVENTS_ENABLED=true`에서 활성화한다(기본 false). `page=0`부터 20개씩, `period=upcoming|past`(기본 upcoming), `nextPage` 응답. 공개 시점·PUBLISHED·미삭제 조건을 적용하며 본문은 문자열 또는 body만 반환한다. 종료 시각이 미래인 진행 중 행사도 예정에 포함하고, 종료 시각 없는 시간 지정 행사는 시작 기준, 종일 행사는 한국 날짜 기준으로 구분한다.

주보 API `/api/v1/bulletins` 및 `/:id`는 `APP_PUBLIC_BULLETINS_ENABLED=true`로 별도 활성화한다(기본 false). 홈페이지 공개 주보 중 공개·미삭제 PDF가 있는 항목만 제공한다. `page=0`부터 20개씩, 선택적 `month=YYYY-MM`, `nextPage` 응답. 목록/상세 모두 공개 조건을 재검사하며 캐시하지 않는다. PDF 원본은 공개 스토리지 URL이므로 이미 외부에서 열린 문서의 회수까지 보장하지 않는다.

- website: apps/website/.env.local. DATABASE_URL, 공개 SITE/Supabase/Kakao 설정, 문의 rate-limit salt, ADMIN_URL.
- admin: apps/admin/.env.local. DATABASE_URL, 공개 Supabase/SITE 설정, APP_PUBLICATION_ENABLED, 문의 보관기간 설정.
- mobile: apps/mobile/.env.local. EXPO_PUBLIC_API_BASE_URL만 사용. 일반 로컬 API 포트 3001.
- DB CLI: packages/database/.env의 DIRECT_URL(권장), DATABASE_URL. 기존 루트 .env는 호환 fallback이며 새 설정을 중복 관리하지 않는다.

기존 루트 .env와 .vercel 연결 정보는 삭제하지 않았다. 실제 값은 문서나 Git에 넣지 않는다. 웹/모바일 React 버전은 각 프레임워크가 요구하는 버전을 유지하며 전역 override로 강제 통일하지 않는다.

## Vercel 배포 전환 순서

이 변경은 로컬 소스 변경이며 배포 프로젝트 설정/운영 DB를 자동 수정하지 않는다.

1. 같은 Git 저장소에 admin용 Vercel 프로젝트를 추가하고 Root Directory를 apps/admin으로 설정한다. 기존 홈페이지 프로젝트의 Root Directory는 apps/website로 변경한다. 두 프로젝트 모두 루트 밖 공유 파일 포함 옵션을 활성화한다.
2. 프레임워크는 Next.js, 루트 workspace lockfile을 사용한 설치, 각 앱의 npm run build를 사용한다. 설치 시 루트 postinstall이 Prisma generate를 실행한다. 설정을 override하는 환경에서는 저장소 루트에서 npm ci와 npm run db:generate를 선행한다.
3. 환경변수는 앱별로 위 목록을 등록한다. admin의 NEXT_PUBLIC_SITE_URL은 홈페이지 URL이다. website의 ADMIN_URL은 관리자 origin이며 홈페이지와 동일하면 안 된다. 관리자 주소를 정한 뒤 홈페이지를 다시 빌드한다.
4. Supabase 관리자 인증 Redirect URL/사이트 설정을 새 관리자 origin에 맞춰 확인한다. 기존 세션은 호스트가 바뀌므로 다시 로그인해야 할 수 있다. 쿠키를 두 앱에서 공유하도록 임의로 확장하지 않는다.
5. 앱 발행 migration 적용 여부를 확인한다. 운영 적용은 별도 작업으로 db:deploy를 실행한다. APP_PUBLICATION_ENABLED는 준비 완료 후 true로 켠다.
6. admin 로그인·콘텐츠 수정·홈페이지 새로고침·APP 발행/해제·/api/v1/worship 조회를 staging에서 검증한다.
7. 모바일 EXPO_PUBLIC_API_BASE_URL을 admin HTTPS origin으로 설정하고 새 빌드/배포한다. 기존 홈페이지 /api/v1/worship 주소는 더 이상 API를 제공하지 않는다. 이미 배포된 앱이 있다면 API 주소 전환 또는 별도의 한시적 프록시 배포를 먼저 조율한다.

홈페이지 /admin 및 하위 주소는 ADMIN_URL이 설정되면 같은 경로로 임시 redirect한다. POST/Server Action은 기존 관리자 탭에서 계속 사용하지 말고 새 관리자 화면에서 다시 로그인하여 작업한다. 개발 모드는 ADMIN_URL 없이도 localhost:3001로 연결한다. production에서 누락 시 잘못된 localhost로 보내지 않는다.

## 되돌리기

운영 배포 전에는 기존 배포가 그대로 서비스된다. 운영 전환 문제 시 해당 Vercel 프로젝트를 이전 deployment/root 설정으로 복원한다. DB 스키마 변경이 없는 구조 이동이므로 DB rollback은 필요하지 않다. 앱 발행 migration은 별도의 변경이므로 구조 이동과 묶어 되돌리지 않는다.

이번 작업 전의 수정된 원본까지 로컬 작업 백업에 보관했다. Git diff에는 기존 사용자 수정도 포함되므로 무조건 git reset/clean하지 않는다. 새 구조가 정상인지 확인한 후 별도 커밋으로 정리한다.

참고: [Expo monorepos](https://docs.expo.dev/guides/monorepos/), [Vercel monorepos](https://vercel.com/docs/monorepos).

## 앱 개인 기능 및 공동기도 연결 (2026-10-04)

- GET/POST /api/v1/me/records, GET/PATCH/DELETE /:id: 묵상·일반 기도·특별기도.
- GET/POST /api/v1/me/bookmarks, GET/DELETE /:id: 공개 말씀 저장.
- GET/POST /api/v1/me/schedules, GET/PATCH/DELETE /:id: 개인 일정 및 교회 행사 참조 저장.
- OPTIONS 사전 요청, bearer 사용자 검증, no-store, 소유자 조건, 버전 충돌(409), 잘못된 입력(422), 다른 출처(403). 서버 실패에 개인 본문/DB 오류를 반환하거나 로그로 남기지 않는다.
- APP_MEMBER_RECORDS_ENABLED=false 기본값. true 전 신규 migration 3개와 서버 역할 권한 검증 필요.
- APP_MEMBER_ALLOWED_ORIGINS 예: http://localhost:8088 (정확한 origin의 쉼표 목록; * 금지). 서버 Supabase 설정은 기존 NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY를 사용.
- 모바일 EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. 서비스 비밀키 금지. 세션은 메모리 전용.
- GET /api/v1/prayers 및 /:id: APP_PUBLIC_PRAYERS_ENABLED=true에서만 공지 CMS 분류 공동기도의 현재 공개 자료 반환. 공지 예약/만료/삭제 조건 유지, 공개 첨부만 제공. 일반 공지 ID 직접 요청으로 분류를 우회할 수 없다. 공지 CMS를 사용하므로 홈페이지에도 공개된다.
- APP_PUBLICATION_ENABLED는 말씀 조회/검색/저장 시 필요. APP_PUBLIC_EVENTS_ENABLED는 교회 행사 조회/저장에 필요. 공개 API를 끈 상태에서 개인 일정을 사용할 수 있다.
- migrations/20261004120000_member_records, 20261004130000_member_bookmarks, 20261004140000_member_schedules는 이번 작업에서 적용하지 않았다. 관리자 개인 기록 열람 API는 없다. DB 관리자 시스템 권한과 종단간 암호화는 별도 영역이다.

운영 migration/seed/배포는 별도 사용자 요청 시에만 수행한다. 실제 인증·DB 통합 검증과 회원가입/탈퇴/목회 요청 정책은 HANDOFF의 최신 상태를 따른다.

## 연결 전 UX 후속 준비 (2026-10-04)

- GET `/api/v1/me/notifications`, GET/PATCH `/:id`, GET/PATCH `/api/v1/me/preferences`의 서버 저장 서비스를 준비했다. 별도 `APP_MEMBER_NOTIFICATIONS_ENABLED=false`가 기본이다. `20261004150000_member_notifications`는 파일만 추가했고 적용하지 않았다. 발송/기기 토큰/예약 작업은 별도다.
- 개인 기록은 `date`/`worshipId`, 공개 행사·개인 일정은 `month` 조회 조건을 추가했다. 기존 공개·소유자 조건을 유지한다.
- 관리자 개발 체험은 `npm run dev:admin:preview`로 실행한다. `/preview/app-operations`는 development·명시적 플래그·loopback 호스트에서만 열리며 실제 저장/발행을 하지 않는다. `/admin/app-operations`는 기존 `requireAdmin` 인증을 따른다.
- [UI/UX 검토와 검증](offline-ux-review.md), [회사 PC 연결 점검표](company-pc-checklist.md)를 최신 상태로 참고한다.
