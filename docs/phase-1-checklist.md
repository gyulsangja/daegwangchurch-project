# Phase 1 개발 체크리스트

## 목표

기능 페이지를 대량 구현하기 전에, 이후 Phase가 안전하게 누적될 수 있는 실행·디자인·데이터·인증 기반을 만든다.

## 예상 변경 파일

실제 초기화 시 버전과 도구 출력에 따라 세부 파일명은 달라질 수 있다.

```text
package.json
package-lock.json
tsconfig.json
next.config.ts
postcss.config.mjs
components.json
.env.example
.gitignore
README.md
middleware.ts
prisma/schema.prisma
prisma/seed.ts
src/app/layout.tsx
src/app/globals.css
src/app/(site)/layout.tsx
src/app/(site)/page.tsx
src/app/admin/layout.tsx
src/app/admin/login/page.tsx
src/app/admin/dashboard/page.tsx
src/components/site/site-header.tsx
src/components/site/site-footer.tsx
src/components/admin/admin-shell.tsx
src/components/ui/*
src/lib/auth/*
src/lib/db/prisma.ts
src/lib/supabase/server.ts
src/lib/supabase/client.ts
src/lib/env.ts
```

## 세부 태스크

### 1. 프로젝트와 품질 도구

- [x] Next.js App Router + TypeScript 프로젝트 생성
- [x] Tailwind CSS와 Material UI 초기화
- [x] ESLint, type-check, build 스크립트 확정
- [x] Node/npm 버전과 lockfile 고정
- [x] import alias와 폴더 규칙 확정

### 2. 환경변수와 외부 서비스

- [ ] Supabase 프로젝트 준비 및 개발 환경 연결
- [x] 브라우저 공개 값과 서버 비밀 값을 Zod로 분리 검증
- [x] `DATABASE_URL`(pooled)과 `DIRECT_URL`(migration) 분리
- [x] `.env.example`에 값의 의미만 기록하고 실제 비밀값 제외
- [ ] `public-assets`, `private-files` 버킷 및 기본 정책 정의

### 3. 디자인 기반

- [x] Pretendard 로딩과 fallback 지정
- [x] Primary/Text/Background/Border CSS 변수 정의
- [x] 모바일 우선 container와 breakpoint 규칙 정의
- [x] focus ring, reduced motion, 기본 타이포그래피 적용
- [x] 로고 자산이 준비되기 전 접근 가능한 텍스트 로고 제공

### 4. 데이터베이스

- [x] 스키마 초안 리뷰 및 Prisma 7 형식 적용
- [ ] 첫 migration 생성
- [ ] 공개 조회와 관리자 변경에 필요한 인덱스 확인
- [x] 주요 모델 soft delete 필드와 조회 규칙 설계
- [x] 최소 seed와 최초 SUPER_ADMIN 생성 절차 작성
- [ ] RLS 정책 SQL을 migration에 포함

### 5. 인증과 권한

- [x] Supabase SSR 클라이언트 구성
- [x] 로그인/로그아웃 구현
- [x] proxy에서 관리자 세션 1차 보호
- [x] 서버 측 `requireAdmin`, `requireSuperAdmin` 구현
- [x] 비활성 관리자와 권한 없는 접근 차단
- [ ] 로그인 실패 제한 정책의 구현 위치 결정

### 6. 공통 레이아웃

- [x] 공개 사이트 루트 레이아웃과 임시 홈 구성
- [x] Header/Footer 반응형 골격 구성
- [x] 관리자 Shell과 Dashboard 골격 구성
- [x] 공통 loading, not-found 화면 정의
- [x] 기본 Metadata, canonical 기준 URL 설정

### 7. 검증과 문서

- [x] `npm run lint` 통과
- [x] `npm run type-check` 통과
- [x] `npm run build` 통과
- [ ] 모바일/태블릿/데스크톱 기본 레이아웃 수동 확인
- [x] README에 로컬 실행, migration, seed, Supabase, Vercel 설정 기록
- [ ] 다음 Phase의 변경 파일 목록과 완료 조건 합의

## Phase 1 완료 기준

- 새 개발자가 README만으로 로컬 환경을 실행할 수 있다.
- 공개 홈, 관리자 로그인, 권한이 보호된 빈 Dashboard가 정상 렌더링된다.
- DB migration과 seed 절차가 재현 가능하다.
- 클라이언트 번들에 서버 비밀값이 포함되지 않는다.
- 디자인 토큰과 공통 레이아웃이 모바일부터 정상 동작한다.
- lint, type-check, production build가 모두 통과한다.
