# Supabase 적용 순서

1. `.env.local`에 `DATABASE_URL`, `DIRECT_URL`, Supabase 공개 설정을 입력한다.
2. `npm run db:deploy`로 `prisma/migrations`를 적용한다.
3. Supabase SQL Editor에서 `supabase/rls.sql`을 한 번 실행한다.
4. Supabase Auth에서 최초 관리자를 만든다.
5. 사용자 UUID와 이메일을 seed 환경변수에 넣고 `npm run db:seed`를 실행한다.

`rls.sql`은 Supabase의 `auth`와 `storage` 스키마를 사용하므로 일반 PostgreSQL이 아니라 Supabase 프로젝트에서 실행한다.
