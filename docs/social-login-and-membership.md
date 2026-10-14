# SNS 가입과 교인 확인

2026-10-12 후속 확정: 가입/마이페이지에서 이름·연락처·직분을 입력하고 교인임을 체크하면 확인 요청을 자동 접수한다. 가입 단계는 인증 완료 후 접수하며 미가입 계정을 승인 목록에 먼저 올리지 않는다. 관리자는 승인 시 활성 소속을 복수 선택해 함께 저장한다. 확인 해제는 모든 소속 해제를 포함한다. 아래 이전의 ‘소속 해제 별도’ 설명보다 이 기준이 우선한다. 추가 migration은 20261012100000_church_contact이며 앞선 membership migration과 함께 운영 적용 전이다.

2026-10-12: 구글·카카오 연결 코드와 교인 확인 기능을 추가했다. 실제 OAuth 제공자 설정, 운영 DB migration/활성화, 새 APK 배포와 실기기 인증은 아직 진행하지 않았다.

## 구분

- 비회원: 공개 말씀·주보·공지 등을 이용한다.
- 일반 회원: 이메일 또는 SNS로 로그인하고 개인 묵상·기도를 이용한다. 가입 자체는 교인 증명이 아니다.
- 교인 확인 요청 중: 계정관리에서 이름과 전달 동의를 제출한 상태다.
- 대광교회 교인: 최고관리자가 실제 본인 여부를 확인한 뒤 승인한 상태다. 관리자 권한이나 전도회 소속을 자동 부여하지 않는다.
- 전도회·모임의 승인된 소속은 기존 GroupMembership으로 별도 관리한다. 교인 확인 해제가 모임 소속 해제를 뜻하지 않으므로 필요한 소속은 별도로 해제한다.

관리자 경로는 관리 설정 → 회원·교인 확인(/admin/members). 일반 회원과 요청/승인된 교인을 구분하며 최고관리자만 처리한다. 개인 묵상·기도는 표시하지 않는다. 최근 프로필 200명까지 표시한다. 기존 로그인만 하고 프로필 생성 화면을 이용하지 않은 계정은 이 목록에 없을 수 있다.

## 연결 절차

1. Supabase Authentication의 Google/Kakao provider 화면에서 프로젝트 고유 callback URL을 확인한다. 형태는 `https://<project-ref>.supabase.co/auth/v1/callback`이다. 프로젝트 식별자를 임의로 추측하지 않는다.
2. 기존 Google Cloud 프로젝트에서 OAuth 동의 화면(대광교회 이름·지원 연락처·개인정보 안내)과 웹 애플리케이션 OAuth 클라이언트를 생성한다. 승인된 리디렉션 URI에 위 Supabase callback URL을 넣고 Client ID/Secret을 Supabase Google provider에 저장한다. YouTube API 키와는 다른 인증정보다. 테스트 모드라면 테스트 사용자를 등록하고 실제 공개 전 게시 상태를 확인한다.
3. 사용자는 카카오 개발자 계정만 보유한 상태다. https://developers.kakao.com 에서 대광교회용 앱을 생성하고 카카오 로그인을 활성화한다. 카카오 Redirect URI에 위 Supabase callback URL을 등록하고 REST API 키와 Client Secret을 Supabase Kakao provider에 저장한다. 현재 서비스의 프로필·탈퇴 API가 이메일을 사용하므로 확인된 이메일 제공 설정/동의가 필요하다. 이메일을 제공하지 않는 계정은 명확한 안내와 함께 가입 완료를 막는다. 카카오의 이메일 동의 항목 사용 조건은 실제 앱 콘솔에서 확인한다.
4. Supabase Authentication URL Configuration에 `daegwang://auth/callback`을 허용한다. 로컬 웹 검증은 해당 개발 서버의 정확한 `/auth/callback` 주소를 별도로 허용한다. 광범위한 wildcard를 운영 주소 대신 넣지 않는다.
5. 기존 APP_ACCOUNT_POLICY/APP_ACCOUNT_ENABLED/APP_ACCOUNT_EMAIL_READY/요청 제한 salt와 탈퇴 정책·worker 준비를 마무리한다. SNS 인증 전 약관 확인과 이름 입력, 인증 후 서버 동의 저장을 거친다. 현재 화면은 재로그인 시에도 동의를 다시 확인한다. SNS 전용 계정은 앱 비밀번호 대신 이메일 recovery OTP로 탈퇴 재인증한다. SMTP와 메일의 인증번호 템플릿도 실제 테스트해야 한다.
6. 각 제공자 설정 검증 후 관리자 서버에 APP_AUTH_GOOGLE_READY=true, APP_AUTH_KAKAO_READY=true를 개별 등록한다. 비밀 OAuth Client Secret은 Supabase에만 두고 앱 EXPO_PUBLIC 변수나 Git에 넣지 않는다. options API는 가입·탈퇴 조건이 충족되지 않으면 버튼을 활성화하지 않는다. Supabase 제공자 설정 자체도 준비 전 공개하지 않는다.
7. 교인 확인은 `20261012090000_church_membership` migration 적용 후 APP_CHURCH_MEMBERSHIP_ENABLED=true로 활성화한다. 이 작업에서 운영 DB에는 적용하지 않았다. 기존 계정·모임 소속을 교인으로 자동 변환하지 않는다. 신규 테이블은 RLS/직접 접근 차단, 프로필 삭제 시 cascade 삭제다.
8. 관리자/API 배포와 expo-web-browser가 포함된 새 APK 빌드 후 구글·카카오 각각 신규/기존/취소/이메일 미제공/앱 복귀/탈퇴를 실기기로 검증한다. 이전 APK에는 새 기능이 없다.

## 기술·검증 범위

OAuth는 외부 인증 브라우저와 Supabase PKCE(S256)를 사용한다. 리디렉션 대상과 단일 인증 코드를 확인하며 토큰이 든 URL fragment는 받지 않는다. Hermes의 부족한 PKCE crypto 메서드만 Expo Crypto로 보완하고 plain challenge면 중단한다. 현재 세션은 메모리에만 있고 앱 재시작 시 로그아웃된다. autoRefreshToken은 false이며 로그인 영속화는 이번 범위가 아니다.

검증은 docs/HANDOFF.md 최신 기록을 따른다. 실제 Google/Kakao 인증 성공과 이메일 발송은 개발자 콘솔 연결 전이라 검증하지 않았다. 기존 계정 연결은 Supabase의 검증된 identity 규칙을 사용하며 이메일 문자열만으로 교인 상태나 기록을 복사하지 않는다. 서로 다른 계정의 수동 병합 UI는 없다.

참고: [Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Kakao](https://supabase.com/docs/guides/auth/social-login/auth-kakao), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Expo WebBrowser SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/webbrowser/).
