# 목회시스템 운영 배포

운영 프로젝트: `gyulsangjas-projects / daegwangchurch-ministry`

운영 주소: https://daegwangchurch-ministry.vercel.app

기존 홈페이지·CMS와 별도 프로젝트이며 Root Directory는 `apps/ministry`, Node.js는 24.x다. 빌드·설치·서울 함수 리전은 `apps/ministry/vercel.json`에 기록한다. 루트 npm lockfile을 사용한다. 운영 DB 마이그레이션은 빌드에 포함하지 않는다.

## 환경

Vercel Production 환경에만 다음 값을 등록한다. 값은 Git에 넣지 않는다.

- `MINISTRY_OPERATIONAL_ENABLED=true`, `MINISTRY_ACCESS_ENABLED=true`
- `MINISTRY_LOCAL_DEMO=false`, `MINISTRY_TEST_MODE=false`
- `MINISTRY_ORIGIN=https://daegwangchurch-ministry.vercel.app`
- `MINISTRY_DATABASE_URL`: 전용 최소권한 runtime 계정, Supabase transaction pooler 6543. 일반 관리자 DB 계정을 대신 사용하지 않는다.
- `MINISTRY_CHURCH_ID`: 기존 대광교회 식별자
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 홈페이지 연결은 전용 연결 자격을 준비할 때만 활성화한다. 현재 `MINISTRY_CMS_BRIDGE_ENABLED=false`이며 기존 홈페이지 자료를 자동 복사하지 않는다.

미리보기 브랜치에는 운영 연결 비밀값을 제공하지 않는다. 가상자료 모드는 개발 환경과 localhost에서만 동작한다. 운영 교적은 로그인 및 명시된 목회 권한 확인 후에만 열린다. 모든 응답은 검색 제외·캐시 금지 정책을 사용한다.

## 인증 복귀 주소

Supabase 허용 목록에 다음 두 주소를 등록했다. 기존 앱과 로컬 callback은 유지한다.

```
https://daegwangchurch-ministry.vercel.app/auth/callback?flow=invite
https://daegwangchurch-ministry.vercel.app/auth/callback?flow=recovery
```

기존 root 계정의 비밀번호는 변경하지 않았다. 일반 로그인은 이메일·비밀번호, 권한 변경은 비밀번호 재확인 또는 이미 설정한 MFA를 사용한다.

## 무료 메일 발송 준비

현재 Supabase 내장 발송 서비스만 있으므로 일반 대상에게 초대·복구 메일이 도착하는 것은 아직 검증되지 않았다. 기존 계정 로그인은 메일 발송 없이 가능하다.

1. Resend 무료 계정을 사용자가 생성한다.
2. 교회가 소유한 `daegwangchurch.kr`의 발송용 도메인/하위 도메인을 Resend에 등록한다.
3. Resend에서 제시한 SPF·DKIM DNS 값을 실제 DNS 관리 서비스에 추가하고 인증을 확인한다. 기존 홈페이지 A/CNAME 및 메일 MX 레코드를 임의로 바꾸지 않는다.
4. 도메인 인증 후 Supabase Authentication → Emails → SMTP Settings에 Resend 공식 SMTP 설정과 발급한 키를 등록한다. 키는 채팅·Git에 남기지 않는다.
5. 사용자가 지정한 수신 가능한 이메일로 초대·비밀번호 재설정 메일을 각각 확인한다. 인증 요청을 시작한 브라우저에서 링크를 연다.

2026-10-27 확인: Resend 무료 플랜 일 100건 한도. 정책은 설정 시 다시 확인한다. [요금](https://resend.com/pricing), [Supabase SMTP 문서](https://supabase.com/docs/guides/auth/auth-smtp).

## 배포 검증

`npm run test:ministry`, 목회 타입·lint·build, 운영 로그인 화면 200, 비로그인 교적/API 차단, 다른 Origin 쓰기 차단, 가상자료 API 차단을 확인한다. 실제 운영 로그인은 사용자가 기존 비밀번호로 확인하며 비밀번호를 도구에 전달하지 않는다. 배포 후 교인/상담 데이터를 시험 생성하지 않는다.

2026-10-27 배포 준비 중 npm audit에서 확인한 Next.js 보안 문제를 16.4.3으로 업데이트했다. 모노레포의 다른 도구/패키지에 남은 audit 항목까지 모두 해결했다고 간주하지 않는다.
