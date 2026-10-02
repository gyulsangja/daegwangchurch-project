# 작업 인수인계

기준일: 2026-10-02. 원래 회사 PC 저장소 이름 daegwangchurch. GitHub 저장소는 gyulsangja/daegwangchurch-project.

## 완료
- Next.js 홈페이지와 CMS/API, Expo 앱을 npm workspaces 모노레포로 분리했다.
- apps/website (3000), apps/admin (3001), apps/mobile (Expo).
- contracts/api-client/server/database/design-tokens/web-ui/config 공유 패키지 구성. mobile은 공개 HTTP 클라이언트만 사용한다.
- 말씀 CRUD 서비스/감사 로그/트랜잭션, APP 발행 revision/공개 포인터, 발행·중단 CMS 패널 구현.
- GET /api/v1/worship, /api/v1/worship/:id. 발행된 APP snapshot만 반환. no-store, 404/422/503 처리.
- 공개 모바일 묵상 목록·연월 필터·페이지 이동·상세·YouTube 영역·실패 복구 구현.
- 관리자 proxy 위치 수정, 홈페이지 /admin 이동, 독립 배포 후 홈페이지 콘텐츠 갱신 구조 정리.

## 최근 검증
단위 17개, 임시 PostgreSQL 통합 15개, 실제 production HTTP 경로/인증/갱신 테스트 통과. TypeScript/lint/경계 검사와 웹 2종 production 빌드 통과. Expo Android/iOS/웹 export 통과. 홈페이지/관리자 로그인 및 모바일 fixture 브라우저 검증 통과.
테스트 결과는 이 날짜의 상태이며 변경 후 필요한 검증을 다시 한다. 실제 기기 YouTube 재생, 운영 계정 관리자 버튼 조작은 별도 검증이 필요하다.

## 아직 하지 않은 것
- 운영 DB migration, Vercel Root Directory 전환/관리자 프로젝트 배포, 운영 앱 배포.
- 회원 인증/개인 묵상·기도·일정·목회돌봄 전체 기능.
- 앱 전체 IA/화면/프로토타입 완료.
- 교적/재정, 중보기도 요청/묵상 공유.

## 이어서 할 일
1. README와 docs/DEVELOPMENT_ON_ANOTHER_PC.md대로 설치하고 실제 상태를 확인한다.
2. 앱 발행 테스트가 필요하면 운영 DB 대신 임시 Docker 통합 테스트를 먼저 사용한다.
3. 사용자와 다음 범위를 확인한다. 화면 작업이면 Screen Inventory/UX 공백부터, 배포 작업이면 docs/monorepo.md의 환경/인증/Root Directory 전환부터 진행한다.

## 대화 이어받기용 문장
“독산대광교회 프로젝트를 이어서 진행해줘. AGENTS.md, docs/PROJECT_CONTEXT.md, docs/HANDOFF.md, docs/monorepo.md를 읽고 현재 Git 상태를 확인해줘. 기존 결정과 작업을 보존하고, 완료한 내용과 남은 작업을 구분한 뒤 다음 단계를 진행해줘.”

이 문서는 작업 맥락 요약이다. 원래 대화 전문이나 Codex 세션 자체를 포함하지 않는다. 인증 파일과 .codex 폴더를 GitHub에 복사하지 않는다.
