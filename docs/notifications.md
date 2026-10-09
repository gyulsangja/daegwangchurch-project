# 휴대폰 푸시 알림

2026-10-09 FCM 후속: Firebase 서비스 계정의 프로젝트/키 구조를 확인한 후 EAS Credentials에서 Android `org.daegwangchurch.app`에 FCM V1 키 업로드·할당 성공을 확인했다. 클라우드 빌드 환경변수/HTTPS API/크론/APK 수신은 아직 남았고 실제 발송은 비활성이다. 비밀 서비스 계정 파일은 저장소에 복사하지 않았다.

2026-10-09 후속: Expo `@gyulsangjabox/daegwang-church` 생성과 CLI 인증 완료. 앱·서버 로컬 EAS UUID를 연결해 check:push 10/12 통과. Firebase 앱 파일 연결도 완료했다. 다음은 FCM V1 서비스 계정 등록, HTTPS API/원격 환경/크론/APK 검증이다. 실제 발송은 계속 꺼져 있다. 아래 생성 안내의 완료 단계는 반복하지 않는다.

2026-10-09 갱신: Firebase와 Expo 모두 사용자의 같은 Google 계정을 사용한다. Firebase 프로젝트/Android 앱 등록 및 google-services.json 로컬 연결은 완료했고 Expo config 반영을 확인했다. Expo EAS 프로젝트 생성과 FCM V1 전송 자격 등록은 아직 남았다. 아래 10월 6일의 계정 없음 기록보다 이 상태를 우선한다. 실제 자격 연결·배포·휴대폰 수신은 아직 확인되지 않았다.

2026-10-06 사용자 요청으로 **앱을 열 때만 생성하던 방식에서 서버 주기 발송으로 전환**했다. 정책은 [푸시 기능 분석](push-design.md)을 따른다. 네이티브 Android/iOS 코드와 서버·DB·스케줄 템플릿을 구현했다. **실제 Expo/FCM 계정, 배포 URL, 크론과 기기 연결은 아직 없다. 실제 OS 수신을 검증한 상태가 아니다.** 사용자는 안드로이드이며 Expo/Firebase 계정이 없다고 답했다.

## 구현 동작

- 기본 수신은 모두 꺼짐. 앱 설정에서 기기 권한/등록과 계정별 다섯 수신 항목을 구분한다. 브라우저 미리보기·Expo Go·서버 미연결은 활성 상태로 표시하지 않는다.
- 첫시간: 당일 APP 공개 말씀만 선택한 한국 시각 이후 하루 1회. 새 설교: 원본당 1회. 중요 공지: 공개/중요 표시/기간 조건을 모두 만족. 행사 소식은 선택한 회원에게 새 공개 행사만 전한다.
- 본인이 작성·저장한 일정: 시간 지정은 당일 시작 30분 전, 종일은 08:00. 00:00~00:30 시작 일정은 당일 00:00 이후 확인하며 00:00 정각 시작은 사전 전송할 수 없다. 이미 시작한 시간 지정 일정은 뒤늦게 보내지 않는다. 시간/날짜 변경, 삭제, 공개 회수를 발송 전에 다시 검사한다.
- 일반 소식은 22~08시 보류, 기기당 하루 최대 5건. 초과는 다음날 몰아서 보내지 않는다. 등록/수신 시작 이전과 24시간 지난 소식은 제외한다. 첫시간·일정은 직접 선택한 시각을 따른다.
- 잠금 화면은 `대광교회 / 새 알림이 있습니다. 앱에서 확인해 주세요.`와 불투명한 알림 ID만 전달한다. 이름·개인 일정·기도·묵상·상담 본문/장소/소속·외부 URL은 넣지 않는다. 탭하면 인증된 본인 알림을 조회하고 현재 원본 공개 상태를 재검사한다.
- 푸시 권한은 버튼을 눌렀을 때만 요청한다. 기기는 계정당 최대 5대, 마지막 로그인 갱신 후 30일 유효. 설치 ID·난수 해제 자격·토큰은 SecureStore, 서버에는 해제 자격의 SHA-256 해시를 저장한다. Supabase 로그인 세션을 새로 영구 저장하지 않는다.
- 로그아웃/OS 권한 해제/계정 전환 시 등록 해제. 오프라인 해제는 SecureStore에 대기 상태를 남기고 다음 실행/복귀에 재시도한다. 이미 전송된 알림은 회수를 보장하지 못하며, 오프라인 해제 완료 전 일반 안내가 도착할 수 있다. 앱 설정에서 직접 OS 설정을 열 수 있다.
- 토큰 변경 갱신, `DeviceNotRegistered` 폐기, 작업별 고유 키·소유자 잠금, 전송 재시도 상한, 제공자 영수증 확인을 구현했다. 명시적 전송 제한(429/MessageRateExceeded)만 최대 4회 시도한다. 통신 단절/5xx/중단된 발송은 결과 미확인으로 남기고 자동 중복 발송하지 않는다. 이는 누락 가능성과 중복 방지 사이의 선택이며 정확히 한 번 수신을 보장하지 않는다.
- 영수증의 `DELIVERED`는 FCM/APNs 제공자 전달 확인이다. 실제 휴대폰 표시나 교인의 읽음 확인이 아니다. 읽음은 앱에서 별도로 기록한다. 결과 확인은 최초 전송 15분 후부터, 24시간 후에도 미확인이면 UNKNOWN으로 남긴다. 발송 작업은 30일 후, 만료 기기는 주기 작업에서 삭제한다. 알림센터 자료 보관은 기존 회원 자료 정책과 별개다.
- 발송 직전까지 동의·기기·공개 상태를 검사하지만 외부 제공자에 전달된 이후 변경을 취소할 수는 없다. 탈퇴 접수 시 기기와 발송 작업을 원자적으로 삭제하고 재등록도 DB에서 차단한다.
- 알림센터는 내역/연결 화면이다. 운영 조회 API는 열람을 이유로 알림을 새로 만들지 않는다. 내역에는 대기·실패한 알림도 남을 수 있으므로 목록 존재를 기기 수신 성공으로 해석하지 않는다.

소속 공지·상담 상태 푸시는 소속/담당자/동의 정책 미정으로 활성 대상에서 제외했다. 일반 주보·사진·개인 기록마다 푸시를 늘리지 않는다. 중요한 주보 안내는 중요 공지로 제공한다.

## 무료 범위와 선택 이유

현재 Expo 앱이므로 **Expo Push Service → FCM(Android) / APNs(iOS)** 를 사용한다. 별도 유료 푸시 업체나 Firebase Functions 유료 요금제를 추가하지 않는다. Expo 푸시 전송은 무료이고 FCM도 무료 제품이다. [Expo 비용 안내](https://docs.expo.dev/push-notifications/faq/), [Firebase 요금제](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

주기 호출은 기존 Supabase의 pg_cron + pg_net으로 배포 API를 호출한다. 5분 주기면 하루 288회이며 API 호스팅·DB 무료 사용량에 포함된다. 실제 플랜 한도/서버 실행 시간/운영 적합성은 배포 때 확인해야 한다. Free DB는 비활성 프로젝트 중지 등 제한이 있어 무중단 보장으로 안내하지 않는다. [Supabase Cron](https://supabase.com/docs/guides/cron), [주기 HTTP 호출](https://supabase.com/docs/guides/functions/schedule-functions), [요금·한도](https://supabase.com/pricing).

안드로이드는 APK로 먼저 직접 설치해 검증할 수 있다. EAS 클라우드 빌드의 무료 한도는 푸시 전송과 별개다. Play Store 출시는 별도 절차다. iOS는 Apple 앱 서명/APNs 자격이 필요하며 Firebase만으로 이를 대체할 수 없다. Apple 비영리기관 개발자 연회비 면제를 신청할 수 있지만 승인 보장은 없다. [Expo APK 빌드](https://docs.expo.dev/build-reference/apk/), [Apple 면제](https://developer.apple.com/help/account/membership/fee-waivers/).

## 안드로이드 연결 순서 — bash

준비 중에는 저장소 루트에서 `npm run check:push`를 실행한다. `apps/mobile/.env.local`과 `apps/admin/.env.local`만 읽고 EAS ID 일치, HTTPS API origin, 인증 공개키, Android 패키지와 Firebase 앱 설정, 서버 비밀값 유무를 **값 출력 없이** 확인한다. `GOOGLE_SERVICES_JSON` 상대 경로는 `apps/mobile` 기준이다. 서비스 계정 JSON을 앱 설정으로 잘못 지정하면 WAIT로 표시한다. 이 명령은 네트워크·DB·발송·설정 변경을 하지 않는다. 미완료 항목이 있으면 종료 코드 1이며 현재 연결 전 상태에서는 정상이다.

이 점검은 로컬 파일 기준이다. EAS에 등록한 환경변수/FCM 자격이나 배포 서버를 검사하지 않으며, 모두 PASS여도 실제 수신 성공은 아니다. 발송 플래그는 준비 완료까지 꺼두고, 아래 7~10단계로 외부 연결을 확인한다. 공개 앱 설정과 비밀 서비스 계정의 구분은 [Expo 공식 FCM 안내](https://docs.expo.dev/push-notifications/fcm-credentials/)를 따른다.

1. [Expo](https://expo.dev/signup) 무료 계정과 [Firebase 콘솔](https://console.firebase.google.com/) 프로젝트를 만든다. 교회 운영자가 소유한 계정으로 준비한다. FCM만을 위해 Blaze로 업그레이드할 필요는 없다.
2. `apps/mobile`에서 아래 명령으로 로그인하고 EAS 프로젝트를 연결한다. 생성된 EAS UUID를 앱 환경의 `EXPO_PUBLIC_EAS_PROJECT_ID`, 관리자 서버의 `EXPO_PUSH_PROJECT_ID`에 동일하게 넣는다. 비밀번호/키를 채팅에 붙이지 않는다.

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init
```

3. Firebase 프로젝트에 Android 앱을 등록한다. 현재 기본 패키지 이름은 `org.daegwangchurch.app`이다. 바꾸려면 등록 **전에** `APP_ANDROID_PACKAGE`를 정하고 이후 동일하게 유지한다. Firebase의 `google-services.json`을 `apps/mobile/google-services.json`에 두고 로컬 `GOOGLE_SERVICES_JSON=./google-services.json`을 설정한다. 클라우드 빌드는 EAS 환경에 같은 이름의 **파일 변수**로 업로드한다. 이 파일은 클라이언트 식별 설정이며 다음 단계의 비밀 서비스 계정 JSON과 다르다.
4. Firebase의 프로젝트 설정 → 서비스 계정에서 FCM 전송용 자격을 만들고 EAS Credentials의 Android → FCM V1에 등록한다. 비밀 서비스 계정 JSON을 앱 환경/번들/Git에 넣지 않는다. [공식 설정 순서](https://docs.expo.dev/push-notifications/fcm-credentials/).

```bash
npx eas-cli@latest credentials --platform android
```

5. HTTPS 관리자/API를 배포하고 원본 콘텐츠와 회원 로그인을 확인한다. `apps/mobile/.env.example`의 공개 값들을 EAS preview 환경에도 설정한다. 로컬 `.env.local`은 업로드되지 않으므로 클라우드 빌드에서 자동 전달된다고 가정하지 않는다. `EXPO_PUBLIC_API_BASE_URL`은 휴대폰에서 접근 가능한 HTTPS 주소여야 한다. USB 개발 테스트만 `adb reverse tcp:3001 tcp:3001` 후 localhost API를 사용할 수 있으며 운영에서는 사용하지 않는다.
6. `20261006020000_member_push` migration 적용 후 API 서버를 재시작한다. 관리자 환경에 `APP_MEMBER_NOTIFICATIONS_ENABLED=true`, 올바른 `EXPO_PUSH_PROJECT_ID`, 32자 이상 난수 `APP_PUSH_WORKER_SECRET`을 등록한다. Expo Enhanced Push Security를 켰다면 `EXPO_PUSH_ACCESS_TOKEN`은 서버에만 넣는다. `APP_PUSH_ENABLED`, `APP_PUSH_WORKER_READY`는 아직 false로 둔다.
7. Supabase에서 pg_cron/pg_net을 켜고 Vault에 `daegwang_push_url`(배포된 `/api/internal/push` HTTPS 주소), `daegwang_push_secret`(동일 난수)을 등록한다. [SQL 템플릿](../scripts/supabase-push-cron.sql)을 적용한다. 크론 설치 직후 API 503은 발송 플래그가 아직 꺼져 있기 때문이다. 작업 자체 실행 성공과 HTTP 결과를 둘 다 확인한다. 배포 API가 60초 작업 실행을 허용하는지도 확인한다.
8. 준비가 끝나면 `APP_PUSH_ENABLED=true`, `APP_PUSH_WORKER_READY=true`로 켠 뒤 서버를 반영한다. 다음 5분 주기 HTTP 200과 관리자 운영 현황을 확인한다. 기기가 없으면 전송은 발생하지 않는다.
9. 아래 APK를 빌드해 본인 안드로이드에 설치한다. Expo Go와 웹 미리보기는 실기기 푸시 검증을 대신하지 못한다.

```bash
npx eas-cli@latest build --platform android --profile preview
```

10. 테스트용 본인 회원 로그인 → 알림 설정 → ‘이 휴대폰에서 알림 받기’ → 중요 공지 항목 켜기 → 저장. 다른 교인에게 영향을 주지 않는 스테이징 콘텐츠로 앱을 닫은 상태의 수신을 검사한다. 이후 앱 열림/배경/종료·잠금 화면·알림 탭·로그아웃·권한 거부/재허용·토큰 변경·예약/회수·계정 전환을 확인한다. 실제 교인 대상 일괄 시험 발송은 하지 않는다.

## 운영 명령과 파일

```bash
# 저장소 루트, 읽기 전용 준비/건수 확인
npm run maintain:push
# 실제 수신 동의 기기에 발송하므로 검토된 운영/스테이징에서만 실행
npm run maintain:push -- --apply
# 자동 검사 — 제공자는 가짜 응답이며 실제 푸시 없음
npm test
npm run test:integration:local
```

API: 인증된 `GET/POST /api/v1/me/push-devices`, 설치 해제 자격만 허용하는 `POST /api/v1/push/revoke`, 서버 비밀로 보호된 `POST /api/internal/push`. 원본 기능 플래그도 함께 적용한다. 활성 중지는 `APP_PUSH_ENABLED=false` 반영 및 `cron.unschedule('daegwang-push')`로 처리한다. 강제 재발송 버튼은 중복 위험 때문에 제공하지 않는다.

코드: `push-device-service.ts`, `push-worker.ts`, `push-policy.ts`, `push-provider.ts`, 앱 `device-push.native.ts`, `push-notifications.tsx`. 공개 접근 차단/RLS·탈퇴 가드는 신규 두 테이블 모두 적용한다. 보안 키·토큰·원문 오류는 로그에 남기지 않는다.
