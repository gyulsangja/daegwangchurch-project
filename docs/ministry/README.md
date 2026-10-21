# 목회시스템 개발 기준

확정일: 2026-10-21. 기존 저장소 안의 `apps/ministry`, 로컬 포트 3002, 독립 배포 단위. 기존 website/admin/mobile은 유지한다. 앱은 Android 1.0.1 개발용 배포에서 당분간 유지한다.

## 현재 단계

Sprint 0 설계 및 교적 업무 검토용 개발 기반. 현재 명부 관리 방식/열 이름은 사용자도 정확히 모르는 상태다. 실제 교적 자료를 읽거나 기존 회원을 자동 이관하지 않는다. 개발본은 명시적인 로컬 실행에서만 가상 데이터를 제공한다. 로그인·운영 DB·지속 저장·실제 권한 계정은 후속 단계이며 이 개발본을 실사용 시스템으로 배포하지 않는다.

## 확인된 기존 구조

| 대상 | 근거 | 재사용 및 한계 |
|---|---|---|
| 콘텐츠 관리 | apps/admin, packages/server/src/features | 주보·설교·공지 원본 유지, 향후 메뉴 연결부터 |
| 앱 회원 | packages/database/prisma/schema.prisma의 MemberProfile/ChurchMembership | 가입 계정 중심이므로 새 교적과 별도 연결 |
| 소속 | ChurchGroup/GroupMembership | 관심 구독과 공식 소속 구분, 자동 통합 금지 |
| 인증 | apps/admin/src/lib/auth/permissions.ts | 인증 방식 참고, 기존 관리자 권한을 교적에 자동 부여하지 않음 |
| 역할 | AdminRole | ADMIN/SUPER_ADMIN만으로 새 조직·필드별 권한을 대체하지 않음 |
| 테넌트 | 현재 Prisma 모델 | 교회 스코프 없음. 새 교적 영역은 독립 설계 필요 |

## 범위와 화면

1. 홈: 전체/재적/소속 미배정, 최근 등록, 교인 찾기 바로가기.
2. 교인: 이름 검색, 상태·소속 필터, 페이지네이션. 이름으로 상세 진입. 이름/상태만 필수.
3. 교인 상세: 기본, 가족, 소속, 변경 이력 탭. 수정 후 같은 교인으로 복귀. 상세 목록 복귀는 기존 검색 조건 유지.
4. 조직: 조직별 구성원 및 담당 구조. 현재 개발본의 조직명·직분·상태는 가상 설정값이며 대광교회의 확정 조직이 아니다.
5. 후속: 가족 관계 편집, 조직 트리 편집, 명부 가져오기·내보내기, 운영 설정. 미구현 기능 버튼은 실제 동작처럼 표시하지 않는다.

일차 개발본에서 등록/수정은 서버 메모리에 저장되며 서버 재시작/개발 리로드 시 초기화된다. 브라우저 저장소에 개인정보를 저장하지 않는다.

## 데이터 설계 초안

| 엔터티 | 핵심 필드/관계 |
|---|---|
| Church | id, 이름, 활성 상태 |
| ChurchCode | churchId, category(status/position/orgType), code, label, active |
| Member | id, churchId, 이름, 상태코드, 직분코드, version, 등록/수정 시각 |
| MemberPrivateProfile | churchId, memberId, 연락처/주소. 별도 열람 권한 |
| Family | id, churchId, 가구명 |
| FamilyMember | churchId, familyId, memberId, 관계코드. 가구 소속과 친족관계는 동일하지 않음 |
| Organization | id, churchId, parentId, 이름/유형, 활성 상태 |
| OrganizationMember | churchId, organizationId, memberId, 시작/종료일 |
| UserMemberLink | churchId, userId, memberId, 확인상태. 앱 계정과 교적 ID 분리 |
| RoleGrant | churchId, userId, 역할, 조직 범위. 직분과 권한은 독립 |
| AuditEvent | churchId, actorId, 대상/행위/시간, 변경 필드명. 연락처/주소 원문 복사 금지 |
| ImportJob | churchId, actorId, 검증 결과, 확정 상태, 멱등키 |

운영 PostgreSQL 구현은 packages/database 안에서 별도 스키마/마이그레이션 경로와 전용 접속 역할을 정한다. 기존 운영 DB migration에 자동 포함하지 않는다. `(church_id, id)` 복합키/외래키로 타 교회 연결 차단, 활성 소속 중복 방지, version 조건 UPDATE, 변경+감사 원자적 트랜잭션 필요. 공개 홈페이지 DB 역할에는 교적 스키마 접근을 주지 않는다. 이를 보장할 수 없으면 별도 DB로 분리한다. 실제 접속 권한 확인 전 같은 DB 사용을 확정하지 않는다.

## 권한 기준

| 업무 | 교회 관리자 | 행정 담당 | 담당 조직 리더 |
|---|---|---|---|
| 교적 목록/기본정보 | 교회 범위 | 교회 범위 | 담당 조직만 |
| 연락처/주소 | 명시적 교적 권한 | 명시적 교적 권한 | 기본 비공개 |
| 등록/수정 | 허용 | 허용 | 초기 불허 |
| 가족 관계 | 허용 | 허용 | 초기 비공개 |
| 명부 반출 | 후속 별도 권한 | 후속 별도 권한 | 불허 |
| 권한 설정 | 후속 전용 권한 | 불허 | 불허 |

현재 개발 액터는 서버에서 고정한 가상 관리자이며 로그인 구현이 아니다. 운영에서는 검증된 세션의 churchId/권한을 서버가 결정하고 요청 본문의 churchId/actorId를 신뢰하지 않는다. 두 가상 교회를 통한 접근 경계 테스트를 먼저 유지한다. 재정·목양 비밀 기록·개인 묵상은 자동 열람 범위에 포함하지 않는다.

## API 계약과 단계별 백로그

- GET /api/v1/members?q=&status=&organizationId=&page= : 목록, 전체 건수, 페이지 크기.
- POST /api/v1/members : 이름/상태/선택 정보. 교회·작성자·ID는 서버 지정.
- PATCH /api/v1/members/:id : 수정값과 version, 오래된 수정은 409, 범위 밖 ID는 404.
- 이번 API는 로컬 개발 전용. 운영/비활성 503, 외부 origin 403, 잘못된 입력 422. 실제 사용 전 인증 어댑터로 교체하고 조직/필드 권한을 유지한다.

다음 순서: ① 명부 항목/실제 조직 확인 ② 운영 인증·교회 역할 승인 ③ 교적 DB/트랜잭션 어댑터 ④ 가족/조직 편집 ⑤ 엑셀 미리보기·중복 후보·확정 반영 ⑥ 반출/감사/백업 복구 검증 ⑦ 실제 담당자 검증. 기존 앱·콘텐츠 연동은 그 이후.

미확정: 실제 명부 항목, 교적 상태 정의, 가족 대표 개념, 담당자 역할, 보관/파기 기준, 개발/운영 DB, 백업 정책. 지금 주민등록번호·신앙 점수·민감 목양 메모를 추가하지 않는다. 임시 기본안을 실제 교회 정책으로 취급하지 않는다.

## 실행

저장소 루트에서 `npm run dev:ministry` → http://localhost:3002 . 가상 교인으로만 등록/수정한다. 테스트 `npm run test:ministry`, 검사 `npm run type-check --workspace @daegwang/ministry`, `npm run lint --workspace @daegwang/ministry`, 빌드 `npm run build:ministry`.

브라우저 검증: 로컬 서버 실행 후 `node tests/ministry-browser.mjs`. 기본 Microsoft Edge headless, 다른 설치된 브라우저는 TEST_BROWSER_CHANNEL 지정. 테스트는 가상 교인을 추가/수정하므로 검증 후 서버를 재시작하면 초기 가상 자료로 돌아간다. production build의 실행 환경에서는 API가 503을 반환하는 것이 현재 정상이다.
