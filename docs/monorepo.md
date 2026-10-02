# 모노레포 운영 및 배포 전환

## 결정과 경계

저장소 자체가 독산대광교회 플랫폼이다. 홈페이지는 apps/website라는 한 앱이며, 관리자와 모바일을 포함하지 않는다. 저장소 경로 이름 daegwangchurch는 계속 사용한다. 이 채팅은 별도 작업 폴더에서 실행되므로 IDE에서는 이 저장소 루트를 열어야 한다.

모바일 → api-client → contracts 순으로만 서버와 통신한다. 모바일에서 server/database/config/web-ui를 import하지 않는다. contracts에는 Prisma·Next·React·비밀 환경변수 의존성을 넣지 않는다. 서버는 공통 DB 패키지를 사용하며, 웹 Server Actions의 인증·쿠키·redirect는 admin에 남긴다. 공통 코드는 apps의 소스를 역참조하지 않는다. check:boundaries가 이 경계를 확인한다.

서버의 관리자용 query는 자체적으로 인증을 대신하지 않는다. 현재 admin의 보호된 layout, 각 mutation의 requireAdmin/requireSuperAdmin이 접근을 제어한다. 새 API를 만들 때도 엔드포인트에서 반드시 인증/권한을 검사한다. 모바일 API는 공개된 APP revision만 반환한다.

현재 공개 홈페이지는 서버에서 공통 DB 조회 로직을 사용한다. 기존 새가족 문의 제출도 홈페이지 Server Action으로 유지한다. 따라서 홈페이지 DB 권한은 아직 완전한 읽기 전용이 아니다. 앱 로그인, 개인 기록, 교적/재정 구현 시 도메인별 권한과 별도 서비스 전환을 검토한다. 지금은 별도 마이크로서비스를 만들지 않는다.

## 발행과 캐시

홈페이지 공개 화면은 force-dynamic으로 매 요청 DB에서 조회한다. React cache는 한 요청 안의 중복 조회를 줄이는 용도다. admin의 revalidatePath는 /admin 경로만 무효화한다. 분리된 배포의 홈페이지 캐시를 지웠다고 가정하지 않는다. 저장 후 홈페이지를 새로 요청하면 변경을 읽는다. 이미 열린 화면은 새로고침이 필요하다.

공개 앱 API는 no-store, APP 공개 revision만 조회한다. 홈페이지 발행과 앱 발행은 독립적이다. CORS *는 비인증 공개 GET에만 사용한다. 향후 회원/개인정보 API에 이 규칙을 그대로 적용하지 않는다.

## 로컬 환경

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
