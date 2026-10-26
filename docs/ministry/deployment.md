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

Supabase custom SMTP를 Resend로 연결했다. 발신자는 `대광교회 <root@daegwangchurch.kr>`. 도메인 인증 완료, 발송 전용 키는 해당 교회 도메인으로 범위를 제한했으며 Supabase에만 저장했다. 키는 로컬 파일·Git·문서에 저장하지 않았다. 사용자가 승인한 `gojekal@naver.com`으로 운영 비밀번호 찾기 메일 1통을 요청했고 실제 수신을 확인했다. 비밀번호는 변경하지 않았다. 신규 초대의 수락까지는 실제 초대 대상이 준비될 때 별도 확인한다.

1. Resend 무료 계정을 사용자가 생성했다.
2. 사용자 지정 발신자는 `root@daegwangchurch.kr`, 발신 이름은 대광교회. Resend에 `daegwangchurch.kr`을 등록했다. 수신함 생성과는 별개다.
3. Resend에서 제시한 SPF·DKIM DNS 값을 닷홈에 추가하고 인증을 확인했다. 기존 홈페이지 A/CNAME 및 수신용 MX 레코드는 변경하지 않았다.
4. Supabase Authentication → Emails → SMTP Settings에 host `smtp.resend.com`, port `465`, username `resend`, 도메인 한정 발송 키를 저장했다. 키 이름 `daegwang-supabase-auth`, 권한 Sending access. 메일 링크/열람 추적은 설정하지 않았다. Supabase 저장 후 재조회하여 활성·저장 상태를 확인했다.
5. 사용자가 지정한 수신 가능한 이메일로 초대·비밀번호 재설정 메일을 각각 확인한다. 인증 요청을 시작한 브라우저에서 링크를 연다.

닷홈에서 TXT `resend._domainkey`, CNAME `rsend`→`rsend-apne1.forge.rmta.net`, CNAME `send`→`send.forge.rmta.net`을 사용자 승인 후 등록했고 권한 네임서버에서 반영을 확인했다. 기존 홈페이지 A/CNAME은 유지했다. `auth.daegwangchurch.kr`은 발신 주소 결정 전에 만든 미사용 미인증 도메인이며 DNS를 등록하지 않았다.

`root@daegwangchurch.kr` 수신 메일함은 이번 작업에서 만들지 않았다. root 계정 자체의 이메일 복구를 사용하려면 별도로 수신함/수신 라우팅을 준비해야 한다. SMTP는 같은 Supabase 프로젝트의 인증 이메일 전체에 적용되며 기존 가입 허용/이메일 확인 정책은 바꾸지 않았다. 기본 인증 메일 제목·본문은 영문 템플릿 상태다.

2026-10-27 확인: Resend 무료 플랜 일 100건 한도. 정책은 설정 시 다시 확인한다. [요금](https://resend.com/pricing), [Supabase SMTP 문서](https://supabase.com/docs/guides/auth/auth-smtp).

## 배포 검증

`npm run test:ministry` 32개, 목회 타입·build 통과. lint 오류 0개(인증 화면의 전체 페이지 이동 관련 권고 3개). `node scripts/check-ministry-deployment.mjs`에서 공개 접근 경계 10개 검증을 통과했다. 사용자가 기존 root 비밀번호로 운영 홈과 사용자 권한 화면이 열린다고 확인했다. 전용 transaction pooler 연결/비관리자 DB 역할/RLS 비로그인 명부 차단도 확인했다. 배포 후 교인/상담 데이터를 시험 생성하지 않았다.

배포본 `dpl_GUmhtfZeLkRGfkNP2Y9VKcva9Fdc`, 소스 `0abc02c`. GitHub `gyulsangja/daegwangchurch-project` main에 자동 배포 연결 완료. 최초 운영 승격 전에는 `--prod --skip-domain` 후보의 로그인 응답을 확인한 후 promote했다.

2026-10-27 배포 준비 중 npm audit에서 확인한 Next.js 보안 문제를 16.4.3으로 업데이트했다. 모노레포의 다른 도구/패키지에 남은 audit 항목까지 모두 해결했다고 간주하지 않는다.
