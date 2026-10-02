# 독산대광교회 플랫폼

홈페이지, 통합 관리자/API, 모바일 앱을 같은 저장소에서 개발하고 별도로 배포한다.

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

모바일 EXPO_PUBLIC_API_BASE_URL은 **관리자/API 서버** 주소다. Android 에뮬레이터는 http://10.0.2.2:3001, 실기기는 PC LAN 주소 또는 배포한 HTTPS 주소를 사용한다. DATABASE_URL이나 서버 비밀키를 모바일에 넣지 않는다.

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

DB 작업은 루트의 db:generate, db:migrate, db:deploy, db:seed, db:studio로 통일한다. db:deploy와 db:seed는 대상 DB를 확인하고 운영 절차에 따라 명시적으로 실행한다.

## 구조와 배포

[모노레포 운영 및 전환 안내](docs/monorepo.md)를 참고한다. 교적·재정·개인 묵상/기도 기능은 이번 구조 전환에 포함하지 않는다.

## 다른 컴퓨터에서 이어가기

[집 PC 설치와 동기화](docs/DEVELOPMENT_ON_ANOTHER_PC.md), [서비스 기준](docs/PROJECT_CONTEXT.md), [현재 작업 인수인계](docs/HANDOFF.md)를 참고한다.
