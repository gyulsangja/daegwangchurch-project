# 회사 PC에서 이어갈 연결 점검표

## 현재 기준: 2026-10-06 Git 인수인계

먼저 [대화 인수인계](CONVERSATION_HANDOFF.md), [HANDOFF](HANDOFF.md) 최상단, [푸시 연결 안내](notifications.md)를 읽는다. 아래 과거 점검표의 ‘미구현/미적용’은 현재 상태가 아니다. 실제 DB는 **12개 migration 적용**, 푸시는 코드/DB 구현 후 계정·배포·실기기 연결 대기다.

### 1. 회사 PC 변경을 보존하고 최신 코드 받기

저장소 루트의 bash에서 실행한다. `git status`에 변경이 있으면 먼저 변경 내용을 확인하고 보존한 뒤 병합한다. 미커밋 변경을 지우는 reset/clean이나 강제 push를 사용하지 않는다. 정상적으로 깨끗한 main이라면:

```bash
git status --short
git branch --show-current
git fetch origin
git pull --ff-only origin main
npm ci
```

저장소가 없을 때만 `git clone https://github.com/gyulsangja/daegwangchurch-project.git`으로 가져온다. 다른 브랜치나 분기된 커밋이 있으면 Codex가 차이를 확인한 후 통합한다. 위 명령을 무조건 반복하지 않는다.

### 2. 환경변수는 별도로 복원

- `.env.local`, DB 비밀번호, Firebase/APNs 자격, `.vercel`, 로그인 세션은 Git에 포함하지 않았다. Git pull만으로 실제 로그인·DB·푸시가 연결되지는 않는다.
- `apps/admin/.env.local`, `apps/website/.env.local`, `apps/mobile/.env.local`, `packages/database/.env`를 각 `.env.example`과 비교한다. 파일이 없을 때만 복사하고 기존 값을 덮어쓰지 않는다.
- 집 PC에서 DB 비밀번호를 재설정했다. 회사 PC의 서버/DB CLI 환경에 **새 비밀번호**를 보안 수단으로 옮기거나 본인이 직접 입력해야 한다. 값을 채팅·Git·스크린샷으로 공유하지 않는다. 원격 DB 스키마/콘텐츠는 별도 파일 복사가 필요 없다.
- 앱은 공개 Supabase 값과 API 주소만 사용한다. 로컬 관리자/API `http://localhost:3001`, 앱 웹 `http://localhost:8081` 기준으로 정확한 allowed origin을 설정한다.
- 집 PC의 로컬 회원 기록/알림·공개 콘텐츠 플래그는 활성화되어 있었고, 공개 가입/복구·탈퇴·소속·상담·실제 푸시 발송은 아직 비활성이다. 회사 PC 설정을 확인 없이 전부 true로 바꾸지 않는다.
- 동일 DB의 migration은 이미 적용했다. 상태 확인 후 미적용분이 있을 때만 정상 deploy 절차를 사용한다. reset/seed로 초기화하지 않는다.

### 3. 세 서버 실행 및 확인

각각 별도 bash 터미널에서, 모두 저장소 루트 기준:

```bash
npm run dev:website
# 별도 터미널
npm run dev:admin
# 별도 터미널
npm run dev:mobile
```

홈페이지 `http://localhost:3000`, 관리자 `http://localhost:3001/admin/login`, 앱 웹 `http://localhost:8081`. 앱은 Expo 터미널에서 `w`로 웹을 열 수 있다. 서버와 브라우저 인증 상태는 PC마다 다시 준비한다. 환경값 없이 UI만 볼 때는 `npm run dev:mobile:preview`의 8088 체험을 사용하며 실제 DB 연결로 오인하지 않는다.

### 4. 다음 기능 작업

안드로이드 / Expo·Firebase 계정 없음이라는 마지막 답변부터 이어간다. [푸시 안내](notifications.md)의 계정 생성 → EAS/Firebase 연결 → HTTPS 배포/주기 작업 → APK/실기기 검증 순서를 따른다. 계정 생성·약관 동의·비밀 자격은 사용자 본인이 처리해야 하는 부분과 코드 작업을 구분한다.

`npm test`, `npm run type-check`, `npm run lint`, `npm run check:boundaries`가 일반 검사다. `npm run test:integration:local`은 별도의 PostgreSQL 바이너리/환경이 필요하며 집 PC의 ignored `test-results` 바이너리는 Git에 없다. `maintain:push`는 읽기 전용, `--apply`는 실제 발송이므로 단순 설정 확인에 사용하지 않는다.

## 과거 점검표 — 아래는 연결 이전 경과 기록

2026-10-05 갱신: 회사 PC 대기 대신 DB 비밀번호를 재설정해 집 PC에서 연결했다. DB migration은 초기 포함 9개 완료이며, 개인 기능을 로컬에서 활성화했다. 아래 연결 전 기록은 과거 상태다. 최신 구현과 남은 사항은 [출시 준비](RELEASE_READINESS.md)와 HANDOFF 최상단을 따른다. 회사 PC의 이전 DB 비밀번호는 반드시 새 값으로 갱신한다.

기준: 2026-10-04. 화요일 10월 6일부터 확인한다. [화면별 현황](mobile-screen-audit.md)과 [실행 안내](../apps/mobile/README.md)를 함께 본다.

## 1. 기존 설정과 프로젝트 확인

- 회사 PC의 저장소 경로, 브랜치, 변경 파일을 확인한다. 집 PC 변경과 회사 PC 미커밋 변경을 먼저 비교하고 보존한다.
- 기존 `apps/admin/.env.local`, `apps/mobile/.env.local`, 과거 루트 환경 파일의 **존재와 변수명**을 확인한다. 값은 채팅·Git·스크린샷에 올리지 않는다.
- Supabase 프로젝트 URL/이름, 접근 가능한 관리자 계정, DB 연결 대상과 개발/운영 구분을 확인한다. 비밀번호를 찾지 못하면 해당 서비스의 정상 복구 절차를 사용한다.
- `.env.example`을 기존 `.env.local`에 덮어쓰지 않는다. 파일이 없을 때만 복사한다.

| 위치 | 필요한 값 | 용도 |
| --- | --- | --- |
| apps/admin/.env.local | DATABASE_URL | 서버 전용 DB 연결 |
| apps/admin/.env.local | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 관리자·회원 인증 프로젝트 |
| apps/admin/.env.local | APP_MEMBER_ALLOWED_ORIGINS | 정확한 웹 origin 목록. 예: http://localhost:8088 |
| apps/mobile/.env.local | EXPO_PUBLIC_API_BASE_URL | 관리자/API 서버 주소 |
| apps/mobile/.env.local | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 회원 로그인. public publishable key만 사용 |

DB 비밀번호/service_role/secret key는 모바일에 넣지 않는다. 기존 `INQUIRY_RETENTION_DAYS`는 홈페이지 문의 설정이며 새 상담·심방 보관 정책으로 자동 적용하지 않는다.

## 2. 기존 로그인·개인 기능 연결

- 운영 DB에 바로 적용하지 않고 별도 개발/스테이징 DB에서 기존 스키마·migration 이력을 먼저 비교한다.
- 아직 적용하지 않은 migration: `20261004120000_member_records`, `20261004130000_member_bookmarks`, `20261004140000_member_schedules`, `20261004150000_member_notifications`.
- 스테이징 적용 후 서버 DB 역할의 권한, RLS와 PUBLIC/anon/authenticated 권한 회수를 확인한다. 서로 다른 테스트 회원 두 명으로 조회·수정·삭제 격리를 검증한다.
- 검증된 개발 환경에서 `APP_MEMBER_RECORDS_ENABLED` 및 필요한 공개 플래그를 켠다. 기존 기본값은 모두 false다. 말씀은 `APP_PUBLICATION_ENABLED`, 행사 등은 `APP_PUBLIC_*_ENABLED`를 따른다.
- 실제 로그인 실패/성공, 로그아웃, 토큰 만료, 공개 해제 콘텐츠, 버전 충돌, 본인 기록 CRUD와 일정 중복 제거를 확인한다.
- 개인 묵상·기도를 관리자에게 노출하는 API는 만들지 않는다. 현재 구조는 종단간 암호화가 아니다.

## 3. 새 체험 기능을 운영 기능으로 전환

모임 소식 후속: [전도회·소속 설계](groups-and-brand.md)를 먼저 확인한다. 실제 모임명, 중복 소속, 승인 담당자/절차, 모임별 발행 권한, 공개·비공개 첨부, 수신 동의와 탈퇴/소속 해제 시 처리를 정한다. 현재 `/api/v1/groups`와 `/api/v1/me/groups`는 운영에서 503이고 로컬 체험만 동작한다. 공개 피드와 소속 전용 저장소를 분리해 연결해야 하며 관심 구독만으로 소속 권한을 주지 않는다. 사이트 설정에 저장된 기존 이름도 ‘대광교회’로 확인한다.

현재 `/api/v1/account/options`는 기본적으로 신규 기능을 비활성으로 반환한다. `/account/[operation]`와 `/me/requests`, `/profile`은 503이다. 알림 `/me/notifications`와 `/me/preferences`는 운영 저장 서비스를 준비했지만 `APP_MEMBER_NOTIFICATIONS_ENABLED=false`가 기본이며 실제 DB 적용/통합 검증은 하지 않았다. 스테이징에서 알림 저장소·소유자 격리·설정 충돌을 검사한 뒤 해당 플래그를 따로 켠다. **환경 값만 입력해도 아래 기능 전체가 자동 완성되는 상태는 아니다.**

| 기능 | 먼저 결정/확인 | 이후 구현·검증 |
| --- | --- | --- |
| 가입·인증·복구 | 이메일 가입 방식, 비밀번호 기준, 필수 수집 항목, 약관/개인정보 문구·버전 | 실제 Supabase 가입/인증/복구, SMTP, 허용 redirect/deep link, 만료·재전송 제한, 동의 원장 저장 |
| 계정 수정·탈퇴 | 변경 허용 항목, 삭제/보관 대상·기간, 재인증 기준 | 서버 인증·재인증, 데이터 삭제/보관 처리, 세션 폐기, 실패 복구·감사 처리 |
| 상담·심방 | 지정 담당자만 또는 전체 관리자 중 누가 읽는지, 접수 필수 정보, 민감 내용 보관 기준 | 서버 소유자 조건·담당자 권한, 동의 버전/시각, 중복 요청 키, 상태 전이·취소·감사, 담당자 화면 |
| 알림·푸시 | 발송 주체/조건, 수신 동의, Expo 프로젝트·기기 설정 | 준비된 알림 DB/수신 설정 검증, 기기 토큰·OS 권한·예약 발송/중복 방지/재시도, 토큰 회수, 실제 기기 수신·탭 이동 |

탈퇴/보관 처리에는 기존 기록·저장 말씀·일정뿐 아니라 새 `member_notifications`, `member_notification_preferences`도 포함해 정책을 정한다. 개발 체험의 `123456`, `preview-only-v1`, 8자 비밀번호 기준, 가상 로그인 키/계정은 운영 설정이나 정책이 아니다. 테스트 서버 코드를 운영 앱/API에 import하거나 배포하지 않는다. 중보기도 요청과 묵상 공유는 기존 결정대로 보류한다.

## 4. 실기기와 출시 전 확인

- Android/iOS에서 키보드, 큰 글씨, 스크린리더, 뒤로가기·이탈 확인, PDF/지도/전화/영상 외부 열기를 확인한다.
- 실제 메일 인증/복구 딥링크와 앱 재시작, 잠금/백그라운드 전환, 네트워크 단절, 세션 만료를 검사한다. 현재 세션은 메모리 전용이고 종료 후 다시 로그인한다.
- 홈 작성 후 상태·월 달력 표시는 구현했다. 실제 데이터·한국 시간 자정·다중 월 일정·같은 계정 재로그인 초안 복원을 확인한다. 시청 완료 기준, 일정 변경/취소 표시와 공동기도 기간 분류는 별도 확정한다.
- 실제 공개 자료·연락처·약관을 확인하고 개발 체험 표시/가상 자료가 출시 빌드에 들어가지 않는지 확인한다.
- 운영 migration/seed/배포는 AGENTS.md에 따라 별도 사용자 요청 시 진행한다. 이 문서는 실행 승인이나 운영 적용 기록이 아니다.

완료 기준: 실제 환경에서 두 회원의 격리, 가입/복구/탈퇴, 담당자 권한, 기기 알림을 검증하고 그 결과를 HANDOFF에 남긴다.
