# 독산대광교회 공식 홈페이지 및 관리자 CMS

독산대광교회를 처음 방문하는 분에게 교회의 정체성, 예배, 공동체와 다음세대 사역을 소개하고, 기존 성도에게 예배 영상과 소식을 제공하는 공식 홈페이지입니다.

## 기술 구성

- Next.js 16 App Router, React 19, TypeScript
- Material UI 9, Tailwind CSS 4 레이아웃, Pretendard
- Supabase Auth, PostgreSQL, Storage
- Prisma ORM 7, PostgreSQL driver adapter
- React Hook Form, Zod

## 로컬 실행

Node.js 20.9 이상이 필요합니다. 현재 lockfile은 Node.js 24와 npm 11에서 생성했습니다.

```bash
npm install
copy .env.example .env.local
npm run db:generate
npm run dev
```

Supabase 없이도 공개 홈과 관리자 로그인 데모 화면을 확인할 수 있습니다. 실제 로그인과 관리자 대시보드 접근에는 아래 환경설정과 DB migration이 필요합니다.

## 환경변수

`.env.example`을 `.env.local`로 복사한 뒤 실제 값을 입력합니다.

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 브라우저 공개용 publishable key
- `DATABASE_URL`: 애플리케이션 런타임용 Transaction Pooler URL(6543)
- `DIRECT_URL`: Prisma migration용 Direct 또는 Session Pooler URL(5432)
- `NEXT_PUBLIC_SITE_URL`: 로컬 또는 운영 사이트 URL
- `SEED_SUPER_ADMIN_*`: 최초 최고 관리자 seed 정보

비밀키, DB 비밀번호, service role key는 커밋하거나 `NEXT_PUBLIC_` 접두사로 노출하지 않습니다.

## 데이터베이스 준비

1. Supabase에서 프로젝트를 만들고 `.env.local`의 연결 문자열을 입력합니다.
2. Supabase Auth에서 최초 관리자 사용자를 생성합니다.
3. 해당 사용자의 UUID와 이메일을 `SEED_SUPER_ADMIN_*`에 입력합니다.
4. migration과 seed를 실행합니다.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Supabase SQL Editor에서 `supabase/rls.sql`을 실행해 Data API와 Storage 정책을 적용합니다.

자세한 순서는 `supabase/README.md`를 참고합니다.

운영 배포에서는 개발 migration 대신 다음 명령을 사용합니다.

```bash
npm run db:deploy
```

## 품질 검사

```bash
npm run lint
npm run type-check
npm run build
npm audit
```

## Vercel 배포

1. 저장소를 Vercel 프로젝트에 연결합니다.
2. Preview와 Production에 필요한 환경변수를 각각 등록합니다.
3. Production의 `NEXT_PUBLIC_SITE_URL`을 `https://daegwangchurch.kr`로 설정합니다.
4. 배포 전에 `npm run db:deploy`로 migration을 적용합니다.
5. 도메인을 연결하고 Supabase Auth의 Site URL과 Redirect URL도 운영 도메인으로 설정합니다.

DB migration은 Vercel의 여러 빌드 인스턴스에서 자동 실행하지 않고 별도 배포 단계에서 한 번만 실행하는 것을 권장합니다.

## 설계 문서

- [프로젝트 아키텍처와 구현 계획](docs/architecture.md)
- [공개·관리자 라우트와 재사용 UI](docs/routes-and-ui.md)
- [Phase 1 개발 체크리스트](docs/phase-1-checklist.md)
- [Prisma 데이터 모델](prisma/schema.prisma)
- [원본 제작 명세](daegwang-church-codex-spec-v1.md)

## 현재 범위

Phase 1 기반, Phase 2 핵심 공개 화면과 명세의 전체 페이지 샘플 구현이 완료되었습니다.

- 실행 가능한 공개 홈과 반응형 Header/Footer
- 디자인 토큰, Pretendard, 접근성 기본값
- Prisma 7 스키마와 seed
- Supabase SSR 클라이언트와 세션 갱신 proxy
- 서버 측 ADMIN/SUPER_ADMIN 권한 검사
- 관리자 로그인과 Dashboard 골격
- Metadata, robots.txt, sitemap.xml
- 교회소개, 비전과 사명, 섬기는 사람들, 교회연혁, 예배안내
- 새가족 안내·교육·등록 안내·문의 안내
- 다시 오실 길과 개인정보처리방침 준비 화면
- 예배 6개 목록과 영상 상세 화면
- 공지, 주보, 일정, 앨범의 목록·상세 화면
- 유초등부, 중고등부, 청년부, 축복축구교실 화면
- 관리자 전 메뉴의 목록·등록·수정 화면 골격
- 예배 콘텐츠 실제 등록·수정·소프트 삭제 Server Action
- YouTube URL 파싱, 영상 ID·썸네일 자동 생성, 상세 임베드
- 공개 홈과 예배 목록의 Prisma 조회 및 샘플 fallback
- 최초 Prisma migration과 Supabase RLS·Storage 정책

실제 Supabase 프로젝트 연결, migration 생성, Storage bucket/RLS 정책 적용은 프로젝트 접속 정보가 준비되면 완료할 수 있습니다. 예배 시간, 주소, 연락처, 인물 소개와 실제 사진은 교회 확정 자료를 받은 뒤 CMS 데이터로 교체합니다.
