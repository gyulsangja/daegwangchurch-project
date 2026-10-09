# 대광교회 플랫폼

홈페이지, 통합 관리자/API, 모바일 앱을 같은 저장소에서 개발하고 별도로 배포한다.

회사 PC에서 이어갈 때: [대화·결정 인수인계](docs/CONVERSATION_HANDOFF.md) → [회사 PC 실행 점검표](docs/company-pc-checklist.md) → [최신 진행 상황](docs/HANDOFF.md). 회사 PC Codex에 붙여 넣을 요청도 대화 인수인계 문서 마지막에 있다. 비밀 환경변수는 Git에 포함되지 않는다.

| 위치 | 역할 | 개발 주소 |
| --- | --- | --- |
| apps/website | 교회소개·공개 콘텐츠·새가족 문의 | http://localhost:3000 |
| apps/admin | 홈페이지/앱 CMS·공개 앱 API | http://localhost:3001/admin |
| apps/mobile | Expo 모바일 앱 | Expo 개발 서버 |
| packages/contracts | DB와 무관한 DTO·입력 검증·공통 콘텐츠 타입 | — |
| packages/api-client | 공개 말씀 HTTP 클라이언트 | — |
| packages/server | 서버 조회·말씀 관리·앱 발행 로직 | — |
| packages/database | Prisma schema·생성 클라이언트·migration·seed | — |
| packages/design-tokens | 플랫폼별 색상 토큰 | — |
| packages/web-ui | 홈페이지/관리자 공통 웹 UI·테마 | — |
| packages/config | 웹 공개 환경변수 검증 | — |
| tests/integration | 임시 PostgreSQL 및 실제 HTTP 검증 | — |

## 처음 실행

Node.js 22.13 이상(현재 검증 환경 24), npm을 사용한다. **설치는 저장소 루트에서만 실행한다.** 각 앱에서 별도 lockfile을 만들지 않는다.

~~~sh
npm ci
npm run dev:website
# 다른 터미널
npm run dev:admin
# 다른 터미널: Expo Go/개발 빌드 또는 web 선택
npm run dev:mobile
~~~

각 앱의 .env.example을 참고하여 .env.local을 설정한다. DB 명령은 packages/database/.env를 사용하며, 기존 루트 .env도 호환 목적으로 읽는다. 앱은 루트 .env를 자동으로 읽지 않는다. 구조 전환 시 기존 로컬 설정 중 필요한 항목만 각 웹 앱으로 복사했다.

모바일 EXPO_PUBLIC_API_BASE_URL은 **관리자/API 서버** 주소다. Android 에뮬레이터는 http://10.0.2.2:3001, 실기기의 회원 기능은 배포한 HTTPS 주소를 사용한다. USB 개발 테스트는 `adb reverse tcp:3001 tcp:3001` 후 localhost를 사용할 수 있다. DATABASE_URL이나 서버 비밀키를 모바일에 넣지 않는다.

휴대폰 푸시는 Expo/FCM 기반으로 구현되어 있으며 현재 계정 연결·배포·실기기 검증 전이다. 무료 범위, 안드로이드 계정 생성부터 APK 설치까지는 [푸시 연결 안내](docs/notifications.md), 기능별 전송 기준은 [푸시 기능 분석](docs/push-design.md)을 따른다. `npm run maintain:push`는 읽기 전용 상태 확인이며 `--apply`는 실제 발송 명령이다.

`npm run check:push`는 외부 접속 없이 로컬 푸시 설정의 누락·프로젝트/패키지 불일치·Firebase 비밀 파일 혼동을 점검한다. 비밀값을 출력하거나 발송하지 않는다. 미완료 항목은 WAIT와 종료 코드 1로 표시하며, 계정 연결 전에는 정상이다.

## 검증

~~~sh
npm test
npm run check:boundaries
npm run type-check
npm run lint
npm run build
npm run test:integration:worship:http
~~~

통합 테스트에는 Docker가 필요하며 기존 운영 DB 대신 임시 PostgreSQL만 생성·삭제한다. API 활성화에는 앱 발행 migration과 APP_PUBLICATION_ENABLED=true가 필요하다. build/ci는 운영 migration을 실행하지 않는다.

Docker 없는 Windows의 독립 PostgreSQL 테스트는 `TEST_POSTGRES_BIN`을 지정해 `npm run test:integration:local`로 실행할 수 있다. 최신 연결·기능·출시 제한은 [출시 준비](docs/RELEASE_READINESS.md)를 참고한다. `npm run check:release`는 비밀 값을 출력하지 않고 배포 설정의 미완료 항목을 확인한다.

DB 작업은 루트의 db:generate, db:migrate, db:deploy, db:seed, db:studio로 통일한다. db:deploy와 db:seed는 대상 DB를 확인하고 운영 절차에 따라 명시적으로 실행한다.

## 구조와 배포

[모노레포 운영 및 전환 안내](docs/monorepo.md)를 참고한다. 교적·재정·개인 묵상/기도 기능은 이번 구조 전환에 포함하지 않는다.

## 다른 컴퓨터에서 이어가기

[집 PC 설치와 동기화](docs/DEVELOPMENT_ON_ANOTHER_PC.md), [서비스 기준](docs/PROJECT_CONTEXT.md), [현재 작업 인수인계](docs/HANDOFF.md)를 참고한다.
