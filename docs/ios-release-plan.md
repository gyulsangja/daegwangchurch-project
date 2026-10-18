# 대광교회 iOS 개발과 출시 준비

기준일: 2026년 10월 18일. 현재 Expo 앱은 Android와 iOS에서 공통 소스를 사용한다. iOS 앱을 처음부터 다시 만드는 작업보다, Apple 서명·푸시·로그인·심사 요구사항과 실제 iPhone 동작을 연결하는 작업이 중심이다. 사용자는 테스트용 iPhone을 보유하고 Apple 개발자 계정은 없다. 가입·결제·자격 생성은 아직 하지 않았다.

다음 순서: 교회 명의 조직 등록 가능 여부와 D-U-N-S 확인 → Apple 계정 2단계 인증 및 Developer Program 등록 → App Store Connect 앱 생성 → EAS iOS 서명·APNs 연결 → TestFlight 설치 → 실제 로그인 유지·탈퇴·푸시·영상·주보 점검 → 개인정보 신고와 심사 제출. 개인 명의 등록 시 판매자에 개인 실명이 표시되므로 조직 등록 가능 여부를 먼저 확인한다.

## 지금 준비할 수 있는 작업

- 공통 화면과 iOS 분기의 정적 검사, iOS용 JavaScript 번들·자산 생성.
- 개인정보 초안, 앱 내부 탈퇴 및 웹 삭제 요청 경로, 스토어 소개 문구와 심사 테스트 목록.
- 현재 bundleIdentifier `org.daegwangchurch.app`, 버전 `1.0.0`, 딥링크 scheme `daegwang`, SecureStore 및 알림 플러그인 설정 검토.
- Windows에서 EAS 클라우드 빌드를 요청할 수 있다. 로컬 Xcode 빌드와 iOS Simulator 사용에는 Mac이 필요하다. 실제 수신·로그인·키보드·영상·주보 검증에는 iPhone을 준비한다. [Expo iOS 빌드](https://docs.expo.dev/build-reference/ios-builds/)

번들 생성 성공은 서명된 IPA 생성, Apple SDK·Privacy Manifest 적합성, 실제 화면 정상 동작 또는 App Store 승인과 다르다. 현재 production EAS 환경과 Apple 자격 검증은 남아 있다.

2026년 10월 18일 확인: `expo export --platform ios` 성공(1,487개 모듈, iOS 번들 및 자산). 산출물은 Git 제외된 `test-results/ios-release-readiness`에 있다. 로컬 개발 환경의 공개 설정을 사용한 컴파일 검사이며 배포용 IPA로 제출할 수 없다.

## 계정과 소유 주체

Apple Developer Program은 기본 연간 99 USD이며 현지 결제 금액은 등록 화면을 따른다. 개인 계정은 개인의 법적 이름이 판매자로 표시된다. 교회 명의 조직 등록은 계약 가능한 법적 실체, D-U-N-S, 계약 권한, 조직 도메인의 업무 이메일과 공개 홈페이지 등을 확인한다. 고유번호증만으로 등록이 보장되는 것은 아니다. [Apple 가입 요건](https://developer.apple.com/programs/enroll/)

요건을 충족하는 비영리 조직은 연회비 면제를 신청할 수 있다. 교회라는 명칭만으로 자동 면제되지 않으며 Apple의 자격 검토가 필요하다. 개인 계정에는 이 면제 경로를 적용하지 않는다. [면제 요건](https://developer.apple.com/help/account/membership/fee-waivers/)

계정 소유자가 Apple 계정의 2단계 인증, 계약, 결제 및 신원 확인을 진행한다. 비밀번호·인증번호·개인 키를 채팅이나 Git에 기록하지 않는다. Expo에는 필요한 권한으로 서명 자격을 연결한다.

## 권장 순서

1. 개인 또는 교회 조직 소유를 확정하고 Apple Developer 가입을 완료한다. 유료 등록 전 비영리 면제 대상인지 확인한다.
2. Apple의 App ID와 App Store Connect 앱을 만든다. 기존 `org.daegwangchurch.app`의 사용 가능 여부를 확인하고 등록 후 식별자를 임의로 변경하지 않는다.
3. EAS production 환경의 운영 API·공개 인증 설정·프로젝트 ID를 확인한다. 배포 인증서와 provisioning profile을 연결한다.
4. APNs 자격과 Push Notifications capability를 연결한다. 기존 Android FCM 연결만으로 iPhone 푸시가 완성되지는 않는다. Expo를 통해 iOS는 APNs로 전달한다. [Expo 푸시 설정](https://docs.expo.dev/push-notifications/push-notifications-setup/)
5. 로그인 제공자와 탈퇴 흐름을 결정한 뒤 iOS 빌드를 만든다. `eas build --platform ios --profile production`은 자격과 환경 준비 후 실행한다.
6. App Store Connect에 업로드하고 TestFlight에서 실제 iPhone 테스트를 한다. 외부 테스터 배포에는 베타 심사가 필요할 수 있다. [TestFlight 안내](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
7. 정책·App Privacy 신고·연령등급·스크린샷·지원 URL·심사자 계정과 사용 안내를 제출한다. 심사 통과 후 공개 시점을 정해 출시한다.

## 이 앱에서 특히 확인할 부분

| 부분 | 현재 상태와 해야 할 일 |
| --- | --- |
| 로그인 | 구글·카카오를 기본 회원 로그인으로 제공하면 Apple 4.8의 동등한 개인정보 보호 로그인 선택지가 필요할 수 있다. Apple로 로그인을 추가하는 방향으로 검토하며 교회 앱이 예외라고 가정하지 않는다. 이메일 로그인만으로 이 요건을 충족한다고 단정하지 않는다. |
| Apple 로그인 탈퇴 | 도입 시 제공자 토큰 폐기와 연결 해제를 구현한다. 한국 개발자의 새 Services ID는 서버 간 알림 엔드포인트 요건도 확인한다. |
| 계정 삭제 | 기존 앱 내부 삭제를 유지하고 실제로 시험한다. 홈페이지 문의 경로만으로 iOS 앱 내부 삭제 기능을 대체하지 않는다. |
| 푸시 | APNs 연결 후 앱 실행 중·종료·잠금·거부·다시 허용·로그아웃·계정 전환에서 테스트한다. 알림 허용을 앱 이용의 필수 조건으로 하지 않는다. |
| 민감정보 | 교인 여부·종교적 기록·상담이 있으므로 App Privacy 및 동의 문구를 실제 처리와 맞춘다. 공개 알림과 비공개 기록의 잠금화면 표시를 구분한다. |
| 영상·지도 | YouTube 재생·외부 앱 전환·지도 링크·쿠키/SDK 처리를 점검한다. 위치 권한 없이 교회 위치 안내가 가능해야 한다. |
| 헌금 안내 | 계좌 안내·복사 기능이 있다는 이유만으로 모금 심사를 통과한다고 가정하지 않는다. 앱 내 모금은 Apple 비영리 승인·결제 요건 검토가 필요하다. 현 단계에서 결제 기능을 추가하지 말고, 필요하면 Safari 외부 안내 방식과 심사 설명을 준비한다. |
| iPad | 현재 supportsTablet=true. 이를 유지하면 iPad 화면·회전/큰 화면 구성·제출 자료를 검증한다. 검증 없이 지원을 선언하지 않는다. |
| SDK·암호화 | 실제 IPA의 SDK/Privacy Manifest/Required Reason API와 App Store 요구 버전을 확인한다. 암호화 수출 신고는 사용 라이브러리를 검토한 뒤 답하고 자동으로 비면제 암호화 없음이라고 설정하지 않는다. |

로그인·개인정보·모금 심사 근거: [Apple 심사 지침 4.8, 5.1, 3.2](https://developer.apple.com/app-store/review/guidelines/). 계정 삭제와 Apple 토큰 폐기는 [Apple 삭제 안내](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)를 따른다.

## 실기기 확인 목록

처음 실행과 로그인 유지 → 앱 종료·재실행·재부팅 → 공개 말씀·YouTube → 주보 전체화면 → 지도 → 시·분 선택창·종일 일정 → 날짜별 묵상·기도 → 교인 확인 → 알림 허용·거부·종료 상태 수신 → 로그아웃·다른 계정 → 테스트 계정 탈퇴와 서버 삭제 완료 순서로 확인한다. iOS Keychain은 앱 삭제 후에도 남을 수 있으므로 재설치 시 세션 처리도 확인한다.

심사자는 실제 교인의 개인정보 없이 기능을 볼 수 있어야 한다. 테스트 전용 계정과 콘텐츠를 준비하고, 소속·교인 승인에 제한이 있는 기능은 심사 메모에 접근 방법을 설명한다. 실제 회원의 계정을 심사 계정으로 제공하지 않는다.
