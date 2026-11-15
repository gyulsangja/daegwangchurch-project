# Supabase 실제 계정 검증 기록

2026-11-16 한국시간. main `53b8a610c157f7c73cbc9524a3de3ad3500e58a3` 위 로컬 수정본에서 실행했다.

## 환경과 적용

사용자가 무료 테스트 프로젝트 생성, 전용 자격증명의 로컬 보관, 가상 회원 검증을 승인했다. 기존 Free 조직에 `daegwang-release-test` 프로젝트를 생성했고 도쿄 지역 Nano의 Healthy 상태를 확인했다. 프로젝트 식별자는 `jaggdshwqkcygrnphkhm`이다. 신규 테이블 자동 공개를 끄고 이메일 즉시 가입을 설정했다.

public Prisma 마이그레이션 17개와 ministry SQL 001~009를 적용했다. SQL 005에 필요한 `daegwang_ministry_runtime` 역할을 NOLOGIN으로 추가했다. 실제 목회 웹 서버의 로그인 연결은 이번 테스트 범위에 포함하지 않는다.

DB 연결은 공식 Supabase CA를 `NODE_EXTRA_CA_CERTS`로 주입하여 인증서 검증을 통과했다. 서버 Secret key는 Auth 관리자 API HTTP 200으로 검증했다. 자격증명과 실행 스크립트는 Git 무시 경로 `.local/release-test/`에 보관했다. 키와 비밀번호를 문서로 옮기지 않는다.

## 실제 서비스 검증 결과

`.local/release-test/lifecycle.mjs`는 실제 accountHandler/deletionHandler, Prisma, Supabase Auth 및 삭제 worker를 호출한다. HTTP Request 객체를 서버 핸들러에 직접 전달하는 통합 검증이며 브라우저 UI나 실행 중인 Next.js HTTP 서버를 통과한 검증은 별도로 남는다.

1. 실제 신규 가입, 약관 동의 저장, 즉시 로그인 성공.
2. 틀린 비밀번호로 탈퇴 시 HTTP 422 확인.
3. 본인 비밀번호 탈퇴 접수 HTTP 202 확인.
4. 인증 계정 삭제 worker 실행 전에도 기존 토큰의 개인 API 인증 차단 확인.
5. 개인 기도, 교인 확인, 상담 요청, 목회 계정 연결과 파생 목회 일정 삭제 확인.
6. 다른 회원의 자료와 독립 교적 기록 유지 확인.
7. worker가 실제 Supabase Auth 계정을 삭제하고 관리자 조회 404 확인. 기존 비밀번호 로그인과 refresh token 갱신 거부 확인.
8. 실제 Supabase recovery OTP로 reset 핸들러 성공. 이전 비밀번호와 refresh token 거부, 새 비밀번호 로그인 성공. 이 단계의 OTP는 테스트 관리자 generateLink로 발급했다.
9. 승인받은 `gojekal@naver.com`에 기본 복구 메일 1통 발송 요청 HTTP 200. 사용자가 메일 도착을 확인했다. 해당 주소는 분리된 테스트 프로젝트의 새 계정으로만 사용했다.

첫 실행에서 테스트 DB 전용 역할 누락, 테스트 요청의 약관 버전 불일치를 확인하고 실행 스크립트를 수정했다. 최종 lifecycle 실행은 종료 코드 0으로 통과했다. 원격 결과는 `.local/release-test/lifecycle-result.json`, 메일 요청 결과는 `email-result.json`이다. 테스트용 회원과 비교 검증 자료 일부가 새 테스트 프로젝트에 남아 있다.

## 실행 명령

PowerShell, Node 24.15.0, Windows 환경에서 실행했다.

```powershell
$env:NODE_EXTRA_CA_CERTS=(Resolve-Path '.local/release-test/supabase-ca.crt').Path
node .local/release-test/provision.mjs
node --conditions=react-server --import tsx .local/release-test/lifecycle.mjs
node .local/release-test/email-check.mjs
```

위 스크립트는 외부 테스트 DB에 쓰기를 수행한다. 메일 스크립트 재실행 시 실제 메일이 발송되므로 발송 횟수 승인을 확인한다. 기본 Supabase 메일 1통과 후속 승인에 따른 Resend 복구 메일 1통, 총 2통을 발송했다. `lifecycle.mjs`는 이번 적용 상황을 위한 일회성 실행물이다. 최초 적용 도중의 임의 위치에서 재실행하는 범용 마이그레이션 도구로 사용하지 않는다.

## Resend SMTP와 실제 앱 복구 검증

2026-11-16 후속 승인으로 Resend Free 계정에 `daegwang-release-test-smtp` 키를 생성했다. Sending access와 인증된 `daegwangchurch.kr` 도메인으로 제한했다. 테스트 Supabase 프로젝트에 smtp.resend.com, 포트 465, 사용자 resend, 발신 root@daegwangchurch.kr, 표시 이름 ‘대광교회 앱 테스트’를 저장했다. 복구 메일은 한국어 제목과 `{{ .Token }}` 인증번호를 사용한다. 설정 당시 계정 화면의 무료 범위는 월 3,000통/일 100통이며 사용량 추가 과금은 꺼져 있었다.

최초 키는 모달 닫힘 전에 읽은 도구 결과에 값이 포함되어 즉시 폐기했고, 새 키를 발급해 연결했다. 폐기 확인 후 재발급했으며 비밀값은 이 문서에 기록하지 않는다. 새 키와 테스트 계정 비밀번호는 Git 무시 경로에만 저장했다.

Windows Chrome에서 Expo 웹 8089 → 실제 Next.js API 3211 → 테스트 Supabase Auth/DB → Resend로 검증했다. 모바일 번들에 테스트 URL·공개 키가 있고 운영 프로젝트 식별자는 없음을 확인했다. 앱의 복구 화면에서 승인된 네이버 주소로 메일을 요청해 HTTP 200을 확인했으며 Resend 발송 기록의 Delivered 상태를 확인했다. 해당 테스트 메일에 실제 발송된 인증번호를 사용했다.

- 앱 비밀번호 재설정 완료 화면 확인, API reset HTTP 200.
- 새 비밀번호로 앱 ‘나의 기록’ 화면 진입 성공.
- 이전 비밀번호 거부와 새 비밀번호 허용을 실제 Auth 요청으로 재확인.
- 동일 인증번호 재사용 HTTP 422 확인.
- 새로고침 후 재인증 없이 ‘나의 기록’ 화면 진입 성공. 증빙은 `recovery-login-persisted.png`.
- 기본 메일의 사용자 수신 확인은 앞서 완료했다. 이번 Resend 메일은 수신 서버 전달 완료를 확인했으며 받은편지함 직접 열람은 수행하지 않았다.

실행 중 최초 sandbox 네트워크 연결 실패는 허용된 네트워크 실행으로 해결했다. 브라우저 자동 입력 과정에서 값 반영 시점 문제가 있어 입력 상태 확인 후 다시 진행했다. 임시 진단 로그는 제거했다. 제품 코드 추가 수정 없이 실제 복구 흐름이 통과했다.

```powershell
node .local/release-test/start-real.mjs api
node .local/release-test/start-real.mjs mobile
node .local/release-test/verify-recovery.mjs
npm.cmd run test:account-release
npm.cmd run type-check --workspace @daegwang/mobile
npm.cmd run lint --workspace @daegwang/mobile
node scripts/check-mobile-secrets.mjs
```

`start-real.mjs`는 이번 작업용 로컬 실행물이며 승인된 테스트 설정을 자식 프로세스에 주입한다. `.env.local`을 편집하지 않는다. API에는 Next.js, 앱에는 Expo 웹을 사용했다. 실기기 OS 설치/재시작 검증은 별도다. 자동 후속 검증 결과는 `smtp-recovery-result.json`, 증빙은 `smtp-delivered.png`, `recovery-complete.png`에 있다. 계정 출시 회귀 테스트 4개와 모바일 타입 검사·lint 재실행이 통과했다. lint 최초 sandbox EPERM은 허용된 실행으로 해결했다. 추적 파일 1,098개 비밀값 후보 검사 결과 0건이며 전체 Git 이력과 외부 설정까지 검사한 결과는 아니다.

## 추가 실제 UI·worker 검증

가상 신규 회원으로 실제 Expo 웹 가입 → 로그인 → 계정관리 → 탈퇴 안내/비밀번호/확인 → 탈퇴 접수 완료를 확인했다. 새 Next.js 삭제 worker endpoint는 무인증 POST 401, GET 405, 전용 비밀 인증 POST 200을 반환했다. 실제 Auth 계정 1건 삭제 완료, deferred0/pending0. DB에서 Auth 사용자 부재와 기존 비밀번호 로그인 거부를 재검증했다. `ui-deletion-result.json`과 `ui-deletion-received.png`에 로컬 결과를 보관했다.

목회 권한 보호 SQL010을 테스트 Supabase에 적용했다. 신규/재활성 권한과 삭제 접수의 상호 차단을 SQL 테스트로 확인했고, 과거 CMS 관리자 권한 해제 후 삭제 재시도 문제도 수정했다. 계정 회귀5·푸시13·PostgreSQL52, shared type·변경 파일 lint·경계 검사·관리자 production build 통과. 원격 cron의 지속 실행 검증은 운영 활성화와 별도로 남아 있다.

운영 조회 결과 삭제 대기0·고아 연결0·활성 권한 삭제 충돌0. pg_cron/pg_net/Vault 설치. Supabase Free 자동 백업 없음. 외부 수동 백업은 질문 답변 대기. 운영 백업 기간을 확인한 뒤 삭제 기록 최소 기간을 정하라는 사용자 결정을 따르며 임의 기간을 운영에 입력하지 않았다.

## 운영 반영 결과

사용자는 별도 DB 백업도 없다고 확인하고 모든 운영 반영·배포를 승인했다. 삭제 완료 기록은 1일, 미완료는 완료까지 유지한다. 운영009/010 적용, 앱·관리자 공통 보관 정책, 복구 OTP+웹 링크 메일, 개인정보 페이지 갱신, Vault 전용 삭제 worker 키 및 5분 cron 등록을 완료했다.

코드 `5191454`가 main에 반영됐으며 홈페이지·관리자/API·목회시스템 모두 Vercel READY와 운영 별칭 연결 확인. 배포 ID는 HANDOFF 참조. 실제 운영의 가상 회원 가입·즉시 로그인·탈퇴202·기존 토큰401 검증 완료. 2026-11-16 08:10 KST 실제 예약 작업이 성공했고 worker HTTP200, completed1/deferred0/pending0을 확인했다. Auth 사용자 부재와 기존 비밀번호 로그인 거부도 재확인했다. 실제 교인 계정은 삭제하지 않았다.

최종 확인 명령: `node .local/release-test/check-production-cron.mjs`, `node .local/release-test/verify-production-deleted.mjs`, `node .local/release-test/public-smoke.mjs`. 모두 종료 코드0. 결과는 무시 경로의 production-scheduled-result.json, production-lifecycle-result.json에 보관했다.

## 남은 단계

- Android/iOS 실기기와 서명 빌드가 남아 있다.
- 5분 스케줄 등록과 첫 자동 처리 검증은 완료했다. 장기 장애 관측, 향후 백업 도입 시 복원 후 재삭제 검증은 별도다. 독립 교적·수기 목회 기록은 회원 연결에서 파생된 기록과 구분하여 유지한다.
- 향후 정책이나 worker 설정을 변경할 때 가입 정책과 삭제 준비 상태를 함께 검증한다.
- 코드 `5191454`의 운영 DB 적용·main 병합·세 서비스 운영 배포를 완료했다. 스토어 제출은 미실행이다.

## Dot 전달문

테스트 환경에서 실제 앱의 가입·로그인·이메일 복구·탈퇴 및 Auth 삭제를 검증했고, 관련 수정과 정책을 main에 반영해 홈페이지·관리자/API·목회시스템 운영 배포까지 완료했습니다. 운영 DB의 목회 연결 삭제·권한 계정 보호도 적용했습니다. 실제 운영의 가상 계정 가입·탈퇴 검증을 통과했으며 5분 간격 삭제 작업의 실제 자동 실행과 인증 계정 삭제·재로그인 차단까지 확인했습니다. 자동·수동 DB 백업이 없음을 확인해 삭제 완료 기록은 1일 보관으로 정했습니다. 향후 백업 도입 시 기간과 복원 재삭제 절차를 함께 마련해야 합니다. 스토어 개발자 계정·지원 수신 이메일·실기기 검증·서명 제출 빌드와 스토어 제출은 남아 있습니다.
