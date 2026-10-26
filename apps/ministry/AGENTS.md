# 목회시스템

- 기존 앱과 별도 실행·배포 단위. 앱 간 직접 소스 import 금지.
- 2026-10-27 운영 인증·전용 DB 연결 및 사용자 승인 배포 완료. 운영은 명시된 목회 권한을 확인한다. 가상 자료 모드는 development/localhost 전용이며 로컬 제한을 없애서 배포하지 않는다. 환경과 배포 절차는 docs/ministry/deployment.md 참조.
- 명부 및 실제 조직은 미확인. docs/ministry/README.md의 미확정 항목을 실제 정책으로 취급하지 않는다.
- Next.js 변경 전 node_modules/next/dist/docs의 해당 문서를 읽는다.
- 운영 교적 모델/마이그레이션은 packages/database에서 별도 경로로 관리하며 운영 적용은 별도 승인된 작업이다.
- 교인과 앱 계정 구분, 모든 조회/수정의 교회·조직 범위 검사, 감사 최소화, 동시 수정 충돌 처리를 유지한다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
