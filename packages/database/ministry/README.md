# 목회 PostgreSQL 적용 패키지

## 콘텐츠 전용 역할 (004, 별도 운영 승인 필요)

`004_content_operator.sql`은 CONTENT 역할 정의와 민감 권한 금지 제약만 추가한다. 사용자 계정·기존 권한·교적을 변경하지 않는다. `node scripts/provision-ministry-content-role.mjs`로 선행 조건 확인, 승인 후 `--apply`로 적용한다. 적용 후에만 목회 배포 환경의 `MINISTRY_CONTENT_ROLE_ENABLED=true`를 설정한다. 앱 코드가 먼저 배포되어도 기본 false에서는 새 역할 배정/초대가 열리지 않는다.

CMS 편집은 기존 CMS 관리자 자격을 별도로 확인한다. CONTENT 역할이 CMS의 역할까지 자동 생성하거나 변경하지 않는다. 기존 CMS 자체의 회원 관리 권한을 줄이는 기능은 후속 과제다. 운영 마이그레이션은 자동 실행하지 않는다. 복구용 함수/제약 정의는 `.local/ministry/content-role-backups`에 저장되며 Git에 올리지 않는다. 실제 CONTENT 배정 후 스키마를 되돌릴 때는 그 권한/초대의 처리부터 별도 검토한다.

`001_workspace.sql`은 CMS Prisma 마이그레이션과 분리되어 있다. 자동 실행하지 않는다. 가상 교인/기존 개발 DB를 운영으로 이관하지 않는다.

현재 저장 모델은 교회·권한·교인·조직·가구·연도·개인 기록·목회 항목·출석 회차·감사를 **개별 행**으로 저장한다. 교회와 교인의 복합 FK, 회차/계정 연결의 고유 제약을 사용하지만, 연도 편성·가구 구성·기록 본문은 버전된 JSON이다. 모든 필드가 정규화된 최종 모델로 보고하지 않는다. 실제 대규모 조회/통계·배정 참조 무결성 확장 전에 세부 정규화가 필요하다.

## 적용 전

1. 운영 DB 백업과 복구 절차 확인. 기존 CMS와 분리된 전용 DB 또는 비공개 ministry 스키마 사용. Supabase의 공개 API 스키마 목록에 ministry를 추가하지 않는다.
2. 마이그레이션 소유자 계정으로 SQL 검토·적용. 런타임은 별도 로그인으로 연결한다. SUPERUSER/BYPASSRLS는 런타임 코드에서 거부한다.
3. 런타임 역할에는 schema USAGE, churches SELECT/UPDATE, access_grants SELECT/UPDATE(잠금용), 나머지 도메인 테이블 SELECT/INSERT/UPDATE, organizations DELETE만 부여한다. access_grants는 SELECT와 잠금용 UPDATE 가시성만 허용하고 WITH CHECK(false)로 실제 UPDATE를 차단하므로 런타임이 권한을 부여/회수할 수 없다. 앱 역할과 DB 역할은 별개다.
4. 승인된 최초 관리자 auth UUID와 실제 교회 ID로 빈 교회/활성 연도/명시적 access_grants 행을 관리자 연결에서 준비한다. 가상 fixture는 사용하지 않는다. 다른 교회 또는 전체 CMS 관리자 자동 승인 금지.
5. ministry 앱의 별도 환경에 MINISTRY_DATABASE_URL, MINISTRY_CHURCH_ID, MINISTRY_ORIGIN(정확한 HTTPS 원점), Supabase 공개 URL/키 설정. 검증 후에만 MINISTRY_OPERATIONAL_ENABLED=true.

권한 조회 FOR SHARE와 교회 행 FOR UPDATE를 짧은 트랜잭션에서 잡고 최신 데이터를 읽어 도메인 검증→변경·감사 저장→COMMIT한다. 권한 회수는 진행 중 트랜잭션 종료 후 다음 호출부터 적용된다. 네트워크 인증은 트랜잭션 밖에서 진행한다. SQL 실패/권한 거부 시 전체 롤백하며 fixture로 대체하지 않는다.

## 검증과 남은 배포 조건

`npx tsx --test tests/ministry-postgres.test.ts`는 독립 PGlite PostgreSQL에서 실제 SQL/RLS/FK/트랜잭션을 검증한다. 원격 PostgreSQL 연결·풀러·동시 연결 검증을 대신하지 않는다. 실제 Supabase 계정 로그인, 쿠키 갱신/로그아웃, 운영 DB 역할과 동시 수정, 백업 복원 검증 후 공개한다.

계정 연결/접수 테이블은 준비되었지만 기존 회원·소속 승인과 상담 요청을 복제하거나 상태를 덮어쓰는 worker는 아직 활성화하지 않았다. 기존 앱은 계속 기존 CMS/API를 사용한다.
