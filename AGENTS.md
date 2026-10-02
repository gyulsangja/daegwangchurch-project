# 독산대광교회 작업 지침

작업 시작 시 docs/PROJECT_CONTEXT.md, docs/HANDOFF.md, docs/monorepo.md를 읽고 실제 Git/파일 상태를 확인한다. 다른 컴퓨터에서는 절대경로가 달라질 수 있으므로 저장소 루트를 기준으로 작업한다.

- 사용자와 한국어로 소통한다. 확정된 기획을 임의로 크게 바꾸지 않는다.
- 미확정 UX는 구현 전에 구조부터 정리한다. 기존 Figma와 홈페이지 수정사항을 보존한다.
- apps/website는 홈페이지, apps/admin은 CMS/API, apps/mobile은 Expo다. 앱 간 직접 소스 import를 금지하고 packages를 사용한다.
- 모바일에 server/database/config/web-ui 패키지나 비밀키를 넣지 않는다.
- 설치는 루트 npm ci, 단일 package-lock.json을 사용한다. Windows에서는 npm.cmd/npx.cmd를 사용할 수 있다.
- Prisma schema/migration은 packages/database에서만 관리한다. 운영 migration/seed/배포는 별도 사용자 요청이 있을 때 진행한다.
- .env, .vercel, node_modules, 생성 클라이언트, 빌드 산출물은 커밋하지 않는다.
- 작업 완료 후 변경 내용, 검증 결과, 남은 제한을 보고하고 diff를 안내한다. 다른 PC에서도 이어갈 수 있도록 docs/HANDOFF.md의 완료/다음 작업을 갱신한다.
- 프로젝트의 관련 검증 명령은 README.md에 있다. mobile 수정 시 apps/mobile/AGENTS.md도 따른다.
