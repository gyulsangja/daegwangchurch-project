# 회원탈퇴 처리 기준

2026-10-06 푸시 자료 삭제 포함. **운영 정책은 미정이며 실제 탈퇴는 비활성이다.**

## 사용자 흐름

안내 확인 → 현재 비밀번호 재확인 → 최종 확인 → 요청 접수와 개인 자료 삭제 → 로그아웃. 인증 제공자의 계정 삭제는 지속 가능한 작업 큐에서 처리한다. 접수 성공을 인증 계정 삭제 완료로 표현하지 않는다. 관리자 프로필이 있는 계정은 활성 여부와 무관하게 이 흐름에서 삭제할 수 없다.

## 삭제 범위와 동시 요청

이 구현이 지원하는 정책은 `ALL_MEMBER_DATA` 하나다. 본인 묵상·기도·저장·일정·알림·알림 설정·푸시 기기/토큰·발송 작업/영수증·프로필·가입 대기 동의·소속·관심 설정·상담/심방 요청을 모두 삭제한다. 상담 자료의 별도 보관이 필요하다면 이 정책을 활성화하면 안 된다. 회원과 연결되지 않는 홈페이지 문의·공개 콘텐츠·관리자 감사 로그는 대상이 아니다. 백업의 보관/삭제 기준은 운영 정책에서 별도 확정해야 한다.

회원 UUID별 DB 잠금과 쓰기 트리거로 탈퇴 접수와 개인 자료 저장을 직렬화한다. 삭제 접수 기록이 있으면 이후 쓰기는 거부한다. 회원 API도 접수된 계정의 접근을 차단한다. 비밀번호·이메일·토큰·개인 기록 본문을 삭제 작업에 저장하지 않는다.

## 실패 복구

개인 자료 삭제와 삭제 작업 등록은 한 DB 트랜잭션이다. 실패하면 둘 다 롤백한다. 인증 제공자 실패 시 큐가 남고 지수 간격으로 재시도한다. 제공자에서는 삭제됐으나 완료 기록 저장에 실패한 경우, 재시도에서 `user_not_found`를 삭제 완료로 처리한다. 작업 획득에는 만료 가능한 임대를 사용한다.

완료 영수증에는 UUID·정책 안내/버전·처리 시각·재시도 횟수가 남고, 승인된 `receiptRetentionDays` 경과 후 제공자 계정 부재를 다시 확인한 다음 삭제한다. 최소 보관 1일은 요청 경합 방지를 위한 구현 하한이며 운영 보관 기간을 대신 결정한 것이 아니다. 탈퇴 비밀번호 시도 제한은 UUID 기준 10분/5회이며 만료된 제한 기록은 기존 `maintain:members` 명령으로 정리한다.

## 활성화 전

정책 `{version, notice, scope: "ALL_MEMBER_DATA", receiptRetentionDays}` 승인, 서버 전용 Supabase secret/service-role 키, 작업 스케줄과 장애 관측, 백업 보관 안내, 격리된 Supabase 테스트 계정의 종단간 검증이 모두 필요하다. 키는 앱·공개 환경변수·문서에 넣지 않는다. 로컬 검증은 별도 PostgreSQL과 가짜 인증 제공자로 수행하며 실제 회원을 삭제하지 않는다.

관리자 환경 설정은 `APP_ACCOUNT_DELETION_POLICY`(한 줄 JSON), `SUPABASE_SECRET_KEY`, `APP_ACCOUNT_DELETION_ENABLED=true`, `APP_ACCOUNT_DELETION_WORKER_READY=true`다. 마지막 플래그는 실제 주기 실행과 실패 관측을 연결한 뒤에만 켠다. 가입도 이 설정이 준비되어야 열리며 비밀번호 복구는 별도로 사용할 수 있다.

저장소 루트의 Bash에서 `npm run maintain:deletions`는 상태별 개수만 확인한다. `npm run maintain:deletions -- --apply`는 이미 접수된 작업을 최대 20건 처리하고, 기간이 지난 완료 영수증도 최대 20건 정리한다. 주기 실행은 호스팅 환경 결정 후 연결한다. 대기 건수는 관리자 앱 운영 현황에 표시한다. 제공자 장애나 스토리지 소유권 때문에 삭제가 계속 실패하는 경우 대기 작업을 운영자가 확인해야 하며, 영수증을 수동으로 지워 해결하지 않는다.

검증 명령: `npm test`, `npm run test:integration:local`(로컬 PostgreSQL 경로 필요), `node apps/mobile/scripts/verify-deletion-web.mjs`(8081 앱 서버 필요). 마지막 검사는 별도 브라우저에서 인증과 개인 API를 전부 가로채며 실제 회원 요청을 보내지 않는다.

참고: [Supabase 계정 삭제 API](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser), [사용자 관리와 JWT 수명](https://supabase.com/docs/guides/auth/managing-user-data).
