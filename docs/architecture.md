# 독산대광교회 홈페이지 아키텍처 초안

상태: 검토용 초안  
기준 명세: `daegwang-church-codex-spec-v1.md` v1.0

## 1. 제품 목표와 구현 원칙

- 첫 방문자에게 교회의 정체성, 예배, 공동체, 다음세대 사역을 30초 안에 전달한다.
- 메인 콘텐츠 우선순위는 `주일 오전예배 전체 영상`과 `첫 시간 주님께` 순서로 둔다.
- 공개 사이트는 홍보·소개 경험을 중심으로 하고 영상 아카이브처럼 보이지 않게 한다.
- 관리자 CMS는 개발자 도움 없이 핵심 콘텐츠를 운영할 수 있게 한다.
- React Server Components를 기본으로 사용하고 입력 폼, 메뉴, 테이블 상호작용처럼 필요한 곳만 Client Component로 둔다.
- 공개 조회, 관리자 명령, 파일 저장소, 인증의 경계를 분리한다.

## 2. 제안 프로젝트 구조

```text
.
├─ docs/
│  ├─ architecture.md
│  ├─ routes-and-ui.md
│  └─ phase-1-checklist.md
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ public/
│  ├─ images/
│  └─ icons/
├─ src/
│  ├─ app/
│  │  ├─ (site)/                 # 공개 홈페이지
│  │  ├─ admin/                  # 관리자 로그인 및 CMS
│  │  ├─ api/                    # 외부 연동/업로드가 필요한 Route Handler
│  │  ├─ sitemap.ts
│  │  └─ robots.ts
│  ├─ components/
│  │  ├─ site/                   # 공개 사이트 전용
│  │  ├─ admin/                  # 관리자 전용
│  │  ├─ content/                # 영상·공지·주보 등 도메인 UI
│  │  └─ ui/                     # Material UI 기반 공통 래퍼
│  ├─ features/                  # 도메인별 폼 스키마, 명령, 조회
│  ├─ lib/
│  │  ├─ auth/
│  │  ├─ db/
│  │  ├─ storage/
│  │  ├─ youtube/
│  │  └─ validation/
│  ├─ styles/
│  └─ types/
├─ middleware.ts                # 관리자 세션의 빠른 1차 검사
├─ .env.example
├─ components.json
├─ next.config.ts
└─ README.md
```

`middleware.ts`는 로그인 유무를 빠르게 확인하는 역할만 맡는다. 실제 권한 검사는 각 관리자 레이아웃, Server Action 또는 Route Handler에서 다시 수행한다.

## 3. 계층과 데이터 흐름

### 공개 조회

`Server Component → feature query → Prisma → Supabase PostgreSQL`

- 기본 조회 조건은 `status = PUBLISHED`, `publishedAt <= now`, `deletedAt IS NULL`이다.
- 최신 콘텐츠는 `isPinned DESC, contentDate DESC, publishedAt DESC` 순으로 결정한다.
- 공개 페이지는 Next.js 캐시 태그를 사용하고 관리자 변경 성공 후 관련 태그를 무효화한다.

### 관리자 변경

`Client form → Server Action → Zod → 권한 검사 → Prisma transaction → cache revalidation`

- 파일 업로드처럼 요청 본문과 응답 제어가 중요한 경우에만 Route Handler를 사용한다.
- 관리자 변경은 `ActivityLog`에 행위자, 대상, 작업, 변경 요약을 기록한다.
- 삭제는 주요 콘텐츠에 대해 soft delete를 기본으로 한다.

### 인증

- 로그인과 세션은 Supabase Auth가 담당한다.
- `AdminProfile.authUserId`는 Supabase Auth의 사용자 UUID를 문자열로 저장한다.
- 앱 권한은 `AdminProfile.role`과 `isActive`로 판정한다.
- `/admin` 보호는 middleware의 세션 검사와 서버의 권한 검사를 함께 적용한다.
- 문의 상세와 관리자 계정 관리는 기본적으로 `SUPER_ADMIN`만 접근한다.

### 파일

- `public-assets`: 로고, 인물, 예배, 주보, 앨범, 사역, 페이지 이미지처럼 공개 가능한 파일.
- `private-files`: 문의 첨부와 관리자 내부 파일.
- DB에는 버킷, 객체 경로, 원본 파일명, MIME, 크기, 대체 텍스트를 보존한다.
- 공개 URL을 DB의 유일한 식별자로 삼지 않고 객체 경로를 기준으로 URL을 생성한다.

## 4. 기술 선택에서 확정할 사항

| 주제 | 제안 결정 | 이유 및 주의점 |
|---|---|---|
| Next.js/React 버전 | Phase 1 시작 시 최신 안정 버전을 고정 | 명세에 버전이 없으므로 생성 시점의 버전을 lockfile과 README에 기록한다. |
| UI 시스템 | Material UI + Tailwind CSS 레이아웃 병행 | 공통 인터랙션은 MUI, 페이지 레이아웃은 Tailwind 유틸리티를 사용하며 점진적으로 전환한다. |
| Prisma + Supabase | 런타임용 pooled URL과 migration용 direct URL 분리 | 서버리스 연결 수와 migration 안정성을 함께 확보한다. |
| RLS + Prisma | 공개 브라우저 접근은 anon 정책, Prisma 관리자 작업은 서버 전용 연결 | service role 또는 DB 비밀정보를 클라이언트에 노출하지 않는다. 실제 정책 SQL은 migration과 함께 관리한다. |
| Auth 외래키 | Prisma에서 Auth 스키마에 직접 FK를 만들지 않고 UUID를 논리적으로 연결 | Supabase 관리 스키마와 앱 migration의 결합을 줄인다. |
| 관리자 역할 | `SUPER_ADMIN`, `ADMIN` 두 역할만 시작 | 문의와 관리자 관리처럼 민감한 기능은 `SUPER_ADMIN`으로 제한한다. |
| 콘텐츠 본문 | 1차에서는 Markdown 또는 제한된 JSON 구조 중 하나를 선택 | 자유 HTML 저장은 XSS 정화 부담이 크다. 리치 텍스트 에디터 선정 전 임의 HTML을 허용하지 않는다. |
| 페이지 관리 | 템플릿은 코드, 내용은 DB | 명세대로 자유형 페이지 빌더는 만들지 않는다. |
| 이미지 변환 | Phase 1에서는 업로드 검증과 Next/Image 최적화를 우선 | 서버리스 환경의 WebP 원본 변환은 별도 파이프라인 결정이 필요하다. |
| YouTube | URL 파싱과 표준 썸네일 생성만 우선 | Data API 자동 동기화는 후순위다. 영상 ID는 서버에서 다시 검증한다. |
| 반복 일정 | 1차 범위에서 제외 | 단일 Event 모델로 시작하고 반복 규칙은 추후 별도 모델로 확장한다. |

## 5. 결정이 필요한 열린 항목

구현을 막지는 않지만 실제 콘텐츠 작업 전 확정이 필요하다.

1. 교회 로고 원본(SVG 또는 고해상도 이미지)과 코레일 둥근고딕 사용 권한/파일.
2. Hero, 교회 소개, 담임목사, 사역에 사용할 실제 사진.
3. 예배 시간, 주소, 대표 연락처, 이메일, 지도 좌표의 최종 값.
4. Supabase 프로젝트 리전과 운영/미리보기 환경 분리 여부.
5. 관리자 초대 방식: SUPER_ADMIN이 계정을 만드는 방식 또는 초대 메일 방식.
6. 고정 페이지 본문 형식: 제한된 Markdown 또는 선정된 리치 텍스트 JSON.
7. 문의 보존 기간과 개인정보 파기 정책.

## 6. 단계별 구현 계획

### Phase 1 — 기반

프로젝트 초기화, 디자인 토큰, DB 스키마와 migration, Supabase 연결, 관리자 인증/권한 보호, 공개·관리자 공통 레이아웃을 구축한다.

### Phase 2 — 핵심 공개 화면

Header/Footer, 메인, 교회 소개, 예배 안내, 다시 오실 길, 새가족 안내를 샘플 데이터로 완성한다.

### Phase 3 — 핵심 CMS

예배 콘텐츠, 공지, 주보, 일정을 실제 DB와 연결하고 공개 목록·상세 및 관리자 CRUD를 제공한다.

### Phase 4 — 공동체 콘텐츠

섬기는 사람들, 교회학교·사역, 앨범, 문의 접수와 관리자 처리를 연결한다.

### Phase 5 — 품질 및 운영

SEO 구조화 데이터, 접근성, 반응형, 보안, 로딩, 오류·빈 상태, 테스트, seed, 배포 및 운영 문서를 마무리한다.

각 Phase 시작 전에 변경 파일 목록을 확정하고, 종료 시 `lint`, `type-check`, `build`를 모두 통과시킨다.
