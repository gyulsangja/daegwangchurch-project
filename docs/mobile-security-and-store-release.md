# 모바일 로그인 보안 및 Android/iOS 출시 점검

검토일: 2026-10-15. 현재 소스 기준이며 기존 배포 APK에 적용됐다는 의미가 아니다. 스토어 승인 보장 또는 전체 보안 감사 결과도 아니다.

## 채택한 로그인 유지 방식

- 비밀번호나 로그인 활동 이력을 로컬에 누적하지 않는다. Supabase 세션(액세스·갱신 토큰 및 사용자 정보)을 저장한다. 토큰도 비밀번호에 준하는 비밀정보로 취급한다.
- Android는 Expo SecureStore의 Keystore 기반 암호화 저장, iOS는 Keychain을 사용한다. iOS 접근 수준은 `WHEN_UNLOCKED_THIS_DEVICE_ONLY`: 잠금 해제된 기기에서만 접근하며 다른 기기로 이전하지 않는다.
- Android 자동 백업 비활성화와 SecureStore의 클라우드 백업/기기 이전 제외 규칙을 함께 적용했다. 회원 기록의 서버 저장은 유지된다.
- 토큰은 SDK가 갱신한다. API는 매 요청마다 Supabase 사용자 검증과 삭제 접수 여부를 확인한다. 저장된 사용자 ID만으로 서버 접근 권한을 부여하지 않는다.
- 로그아웃은 즉시 개인 화면·메모리 초안을 비우고 서버 세션 해제 및 기기 푸시 해제를 시도한다. 실패하더라도 저장 세션 제거를 시도하며 실패 안내를 표시한다. 네트워크 장애 시 서버의 토큰 폐기까지 완료했다고 안내하지 않는다.
- 손상된 저장 메타데이터/누락된 청크는 복원하지 않는다. 저장소 일시 잠김 오류는 세션 손상으로 오인하여 삭제하지 않는다. 로그아웃은 메타데이터를 읽지 못해도 제거를 시도한다.
- 묵상/기도 초안은 메모리에만 유지한다. 모바일 웹 미리보기의 localStorage는 네이티브 암호화 저장과 다르며 XSS 발생 시 보호되지 않는다. 웹 정식 배포는 별도 CSP/XSS 검토가 필요하다.
- 생체인증을 매번 강제하지 않는다. 현재 개인 휴대폰에서의 로그인 유지 요구에 맞춘 결정이며, 공용 휴대폰은 사용 후 로그아웃해야 한다. 루팅/탈옥·잠금 해제된 기기 탈취까지 완전 방어하지 않는다.
- iOS Keychain은 앱 삭제 후에도 남을 수 있다. 앱 삭제와 계정 삭제는 다르다. 재설치 시 세션 복원 여부를 실제 iPhone에서 확인해야 한다.

## 이번 보완 및 검증

- 손상된 세션 때문에 로그아웃/새 로그인이 막히는 경로 보완.
- Android 녹음·연락처·현재 위치·외부 저장소·광고 ID 권한 차단. 교회 지도는 고정 주소 표시이므로 현재 위치 권한 불필요. 권한이 필요한 기능 추가 시 별도 검토한다.
- 사용하지 않는 iOS Face ID 권한 문구 제거. 기존 Keychain 기기 한정 설정 유지.
- EAS production은 production 환경과 Android AAB를 명시. iOS는 동일 production 프로필에서 App Store용 빌드 사용.
- `tests/member-session.test.ts` 5개, 모바일 type-check/lint, 워크스페이스 경계 검사 통과. Expo introspection에서 allowBackup=false, SecureStore 백업/기기 이전 제외 규칙, Face ID 문구 없음 확인. 실제 서명된 바이너리 검사는 미완료.

## 두 스토어에 제출하기 전에 반드시 완료

1. 운영 개인정보처리방침: 현재 홈페이지는 온라인 문의 중심이다. 앱 계정·교인 확인·기도/묵상·상담/심방·푸시, 보관/삭제 기간, 수탁 서비스, 담당자와 연락처를 실제 운영과 맞춰 게시해야 한다. 빈 약관/개인정보 문구 상태로 제출하지 않는다. 종교적 신념 및 자유 입력의 민감정보 가능성까지 검토한다.
2. 계정 삭제: 관리자 강제 삭제 기능만으로 충족되지 않는다. 사용자가 앱에서 요청하고 실제 계정·개인 데이터가 삭제돼야 한다. Google Play는 앱 외부에서 요청 가능한 공개 웹 경로도 필요하다. 현재 해당 웹 경로 미구현. 이메일·SNS 가입 각각 본인 확인, 재시도 작업, 보관 예외를 테스트 계정으로 검증한다. 실제 회원을 테스트로 삭제하지 않는다.
3. Google Play Data safety / Apple App Privacy: 이메일·이름·연락처·사용자 ID·교인 소속·사용자 작성 내용·푸시 식별자 및 사용 SDK의 수집/공유를 실제 동작 기준으로 신고한다. 광고 SDK가 없다는 이유로 모든 수집 항목을 '없음'으로 답하지 않는다. YouTube/지도 WebView도 확인한다.
4. iOS 소셜 로그인: 구글/카카오를 주요 계정 로그인으로 제공하면 Apple 4.8의 동등한 개인정보 보호 로그인 선택지 요건을 검토한다. 이 앱은 예외라고 가정하지 않으며 Apple로 로그인을 구현·설정하는 방향으로 준비한다. 아직 Apple 로그인 미구현/미설정이다. 제공자 토큰 폐기 등 탈퇴 처리도 함께 구현해야 한다.
5. 바이너리: Android AAB의 최종 권한/백업 규칙/target SDK/서명/16KB 페이지 지원, iOS archive의 Privacy Manifest/Required Reason API/ATS/암호화 수출 신고를 실제 의존성과 산출물로 검증한다. Expo 버전만으로 충족을 확정하지 않는다. 제출 시점 공식 기준을 다시 확인한다.
6. 실기기: 로그인 후 종료·재부팅·업데이트·오프라인·토큰 만료·로그아웃 후 재실행·계정 삭제·알림 해제, Android 백업 복원 및 iPhone 재설치까지 점검한다. 테스트 전용 계정과 심사자 접근 정보를 준비한다.
7. 스토어 계정 및 콘솔: Google/Apple 개발자 계정, 개인정보 URL, 지원 연락처, 연령/대상 사용자, 심사 계정, 필요한 테스트 트랙/TestFlight 절차를 완료한다. 청소년 이용과 어린이 대상 앱 여부는 실제 대상에 맞춰 결정한다.

`npm run check:release`는 현재 로컬 설정에서 10/16 통과. 로컬 HTTP 주소와 운영 설정을 혼동하지 말 것. 정책/탈퇴/실기기 WAIT가 남아 있으므로 출시 승인 상태로 해석하지 않는다. 이번 변경으로 운영 토큰 만료 시간이나 Supabase 콘솔 설정을 임의 변경하지 않았다.

## 공식 근거

- Supabase 세션: https://supabase.com/docs/guides/auth/sessions
- Expo SecureStore: https://docs.expo.dev/versions/v57.0.0/sdk/securestore/ (해당 버전 웹 문서 접근 실패로 설치된 57.0.4 플러그인/백업 XML도 확인)
- Expo 설정: https://docs.expo.dev/versions/v57.0.0/config/app/
- Google 계정 삭제: https://support.google.com/googleplay/android-developer/answer/13327111
- Google 사용자 데이터: https://support.google.com/googleplay/android-developer/answer/10144311
- Apple 심사 4.8/5.1: https://developer.apple.com/app-store/review/guidelines/
- Apple 계정 삭제: https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion
