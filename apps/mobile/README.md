# 독산대광교회 앱

Expo SDK 57 / React Native / Expo Router. 기존 Figma의 03 App UI를 기준으로 구현하며 홈페이지는 `apps/website`, 관리자/API는 `apps/admin`이다. 현재 범위와 남은 작업은 [HANDOFF](../../docs/HANDOFF.md), [UX 계획](../../docs/mobile-ux-plan.md)을 참고한다.

2026-10-06: `expo-notifications` 원격 푸시를 추가했다. 웹/Expo Go는 실제 기기 푸시를 지원한다고 표시하지 않는다. Android APK용 EAS preview 설정과 앱 식별자/FCM 환경 연결은 [푸시 안내](../../docs/notifications.md)를 따른다. Expo/Firebase 계정과 실제 기기 연결은 아직 없으며, Expo export 성공을 APK 빌드·실제 OS 수신 확인으로 간주하지 않는다.

## Bash에서 실행

아래 명령은 **저장소 루트** 기준이다.

```bash
npm ci
npm run dev:mobile:preview
```

http://localhost:8088 에서 앱을 확인한다. 로컬 테스트 API는 127.0.0.1:3210이다. 회사 PC의 설정 없이 공개 화면과 회원 기능을 체험할 수 있다.

- MY → 로그인 → **테스트 계정 채우기**: `demo@example.invalid` / `Demo-only-123!`.
- 회원가입은 가상 `이름@example.invalid` 주소로 진행한다. 체험 인증번호는 `123456`이다. 실제 메일은 발송하지 않는다.
- 상담/심방 접수·취소, 알림 읽음/설정, 이름 변경·계정 삭제, 개인 기록/말씀 저장/일정을 체험할 수 있다.
- 가상의 정보만 입력한다. 데이터는 테스트 서버 메모리에 있으며 서버 종료 시 사라진다. 새로고침 시 다시 로그인한다. 실제 교회 접수·푸시·운영 계정 변경은 없다.
- 코드나 샘플 API 수정 후에는 Ctrl+C 후 재실행한다. 설정은 실행한 자식 프로세스에만 적용하며 `.env.local`에 가상 키를 저장하지 않는다.

실제 서비스 연결 시:

```bash
# 파일이 없는 경우에만 복사. 기존 설정을 덮어쓰지 않는다.
test -f apps/mobile/.env.local || cp apps/mobile/.env.example apps/mobile/.env.local
npm run dev:admin
# 별도 터미널
npm run dev:mobile
```

`apps/mobile/.env.local`에 API 주소와 Supabase 프로젝트 URL/public publishable key를 입력한다. service_role, secret key, DB 비밀번호를 앱에 넣지 않는다. 서버 설정과 기능 플래그는 [monorepo 문서](../../docs/monorepo.md)를 따른다. 이번 작업에서 운영 migration이나 배포는 실행하지 않았다.

실기기의 localhost는 PC가 아닌 휴대폰이다. 회원 API는 HTTPS가 기본이며 로컬 개발 예외는 localhost/127.0.0.1/10.0.2.2다. 휴대폰 검증은 접근 가능한 HTTPS 개발 서버를 사용한다.

## 구현된 기능

- 교회명은 작은 ‘대한예수교장로회’와 큰 ‘대광교회’ 두 줄 표기. 홈 삽화와 아이콘으로 교회다운 따뜻한 표현을 보강했다.
- `/groups` 공개 모임 소식, 관심 모임·알림 선택, 확인된 소속 안내는 로컬 체험 API에서 동작한다. 운영 모임 API는 비활성이다. 자세한 권한/발행 설계는 [모임 소식 문서](../../docs/groups-and-brand.md)를 본다.

- 홈·말씀·소식·교회·MY와 공지/주보/행사/교회 상세의 공개 조회, 오류·빈 결과·비공개 처리.
- 묵상·설교 목록/상세, 유형·기간·본문·설교자 검색, YouTube 연결, 교회 달력.
- 이메일·비밀번호로 기존 Supabase 계정 로그인, 개인 기능 진입 후 로그인 복귀, 로그아웃 시 개인 화면 제거.
- 비공개 묵상·개인 기도·특별기도 작성/조회/수정/삭제, 말씀 연결, 특별기도의 선택적 응답·감사.
- 말씀 저장/해제, 개인 일정 작성/수정/삭제, 교회 일정 저장/해제 및 중복 없는 날짜별 목록.
- 공개 공동기도 목록/상세와 개인 기도 작성 진입. 공지 CMS의 공동기도 분류를 사용하며 공개 공지이므로 홈페이지에도 노출된다. 별도 APP_PUBLIC_PRAYERS_ENABLED=true 설정이 필요하다.

개인 API는 서버에서 Supabase 사용자를 확인하고 소유자 조건을 적용한다. 개인 기록을 조회하는 관리자 화면/API는 없다. DB 운영자의 시스템 권한까지 차단하는 종단간 암호화는 아니다.

## 아직 남은 범위

묵상/교회/개인 일정의 월 달력과 날짜별 표시, 홈 묵상 작성 후 상태·기도 이어쓰기, MY 이용 안내를 연결했다. 알림 목록/읽음/수신 설정의 운영 DB 서비스는 준비했으며 별도 `APP_MEMBER_NOTIFICATIONS_ENABLED=false`를 따른다. 실제 DB 적용·푸시 발송은 대기한다. [이번 UI/UX 검토](../../docs/offline-ux-review.md).

회원가입·인증·복구·계정 수정/탈퇴, 상담·심방 요청/내역/취소는 화면과 **로컬 테스트 API**를 구현했다. 이 기능들의 운영 어댑터·실제 메일·DB 저장·담당자 관리는 아직 연결하지 않았으며 운영 API는 비활성/503이다. 기존 개인 기록 플래그로 켜지지 않는다. 약관/수집 항목, 담당자 권한, 탈퇴·보관 기간 및 외부 서비스 설정을 확인한 뒤 운영 구현이 필요하다. 자동 시청 기록은 미구현이며 중보기도 요청과 묵상 공유는 보류한다.

[Figma 88개 점검표](../../docs/mobile-screen-audit.md)와 [화요일 연결 점검표](../../docs/company-pc-checklist.md)에 항목별 상태와 다음 순서를 기록했다.

로그인 세션은 메모리에만 두므로 새로고침/앱 종료 후 다시 로그인한다. 묵상·기도·일정·상담 초안은 현재 실행 메모리에 최대 30분/20개 보관해 같은 계정 재로그인 후 이어쓴다. 다른 계정·명시적 로그아웃·저장·작성 취소 시 정리하고 상담 전달 동의는 복원하지 않는다. 새로고침/종료 후 복구나 오프라인 동기화는 없다. 저장 실패/수정 충돌 시 현재 입력을 유지한다. 같은 말씀에 여러 묵상을 작성할 수 있으며 확정 정책으로 간주하지 않는다. 네이티브 내장 PDF·지도, 실제 설치 아이콘/스플래시와 전체 Figma 상태 일치는 남아 있다.

## 검증

시작 화면은 공식 `expo-splash-screen` 플러그인으로 교회 로고를 표시하고 글꼴 준비 후 해제한다. Expo Go만으로 네이티브 시작 화면의 최종 모습을 확인하지 말고 출시형 기기 빌드에서 확인한다. 확인/안내창은 짧은 화면에서 스크롤할 수 있고, 일정 필터는 줄바꿈을 지원한다.

루트에서 `npm test`, `npm run type-check`, `npm run lint`, `npm run check:boundaries`.

공개 화면 테스트는 8088 미리보기를 실행한 상태에서:

```bash
node apps/mobile/scripts/verify-web.mjs
node apps/mobile/scripts/verify-offline-web.mjs
```

두 번째 검사는 가입→동의→인증→로그인→상담/심방→알림→계정 수정→복구→탈퇴 흐름을 로컬 서버로 검사한다. 스크린샷은 명령을 실행한 폴더의 `test-results`에 생긴다. `cd apps/mobile` 후 `node scripts/verify-offline-web.mjs`로 실행하면 앱 폴더에 모인다. `npm run test:preview`는 서버 실행 없이 테스트 API를 검사하며 루트 `npm test`에도 포함된다.

회원 흐름 테스트는 **실제 계정 대신 테스트 응답을 가로채는 별도 서버**를 사용한다. 다음 설정은 테스트 실행에만 적용하고 .env.local에 저장하지 않는다.

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3210 EXPO_PUBLIC_SUPABASE_URL=https://member-test.invalid EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_browser_test_only EXPO_OFFLINE=1 npm run web --workspace @daegwang/mobile -- --port 8089
# 별도 터미널
node apps/mobile/scripts/verify-member-web.mjs
```

두 브라우저 검사는 설치된 Edge를 사용한다. 회원 인증/DB 응답은 fixture이며 실제 Supabase·PostgreSQL 통합 검증을 대신하지 않는다. 로컬 배포용 번들 검사:

8088 체험 서버 하나만으로 기존 회원 fixture 검사를 하려면 루트 Bash에서 다음 명령을 사용한다. 인증 요청까지 가로채며 실제 계정을 쓰지 않는다.

```bash
MOBILE_MEMBER_TEST_URL=http://localhost:8088 MOBILE_MEMBER_TEST_AUTH_URL=http://127.0.0.1:3210 node apps/mobile/scripts/verify-member-web.mjs
UX_MOBILE_ONLY=1 node scripts/verify-ux.mjs
# 별도 터미널에서 npm run dev:admin:preview 실행 후
UX_ADMIN_ONLY=1 node scripts/verify-ux.mjs
```

관리자 개발 체험: 루트에서 `npm run dev:admin:preview`, http://127.0.0.1:3001/preview/app-operations. 가상 발행 절차만 있으며 실제 인증/저장/발행을 우회하지 않는다. 메모리가 부족하면 개발 서버를 끈 후 빌드를 순서대로 진행한다.

```bash
cd apps/mobile
npx expo export --platform all
```

실기기 재생·딥링크·접근성·세션 만료와 운영 자료 검증은 별도로 필요하다. API 주소 변경 후 개발 서버를 재시작하고 export 캐시가 남으면 --clear를 사용한다.
