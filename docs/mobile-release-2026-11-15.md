# 대광교회 Android·iOS 출시 준비 감사

기준: 2026-11-15 KST. 실제 앱 출시만 범위로 하며 SaaS·유료화는 포함하지 않는다. 과거 문서보다 이 날짜의 관찰을 우선한다. 운영 배포·계정 생성·서명·심사 제출·공개 출시 승인은 서로 별개다.

## 현황과 출시 차단 항목

- 시작 브랜치 main, 로컬 및 원격 커밋 `53b8a610c157f7c73cbc9524a3de3ad3500e58a3`. 기존 미추적 루트 `app.json`은 사용자 파일로 보존했다. 이번 변경은 이 커밋 위의 작업 트리다.
- 앱 표시 버전 1.0.2, Android/iOS 식별자 `org.daegwangchurch.app`. package.json 1.0.0은 작업공간 패키지 버전이다.
- 과거 Android 내부 APK 1.0.2/build 3 기록과 공개 다운로드 manifest가 있다. 기존 EAS 빌드 ID `4c866c50-0146-44d9-a309-4beda7fb779c`. 이번에 새 APK/AAB/IPA를 만들거나 배포하지 않았다.
- Google/Apple 개발자 계정 없음(사용자 확인). 콘솔 등록·서명 자격·원격 빌드 번호·실제 스토어 상태는 미확인. iOS 공식 배포 기록은 확인되지 않았다.
- **운영 가입은 true이나 삭제 false, 비밀번호 복구 false**. 정식 출시 차단. 이번 수정본을 단독 배포하면 기존 운영 설정에서는 신규 가입이 닫힌다. 삭제 worker·정책·복구를 먼저 검증하고 함께 활성화하는 배포안을 승인받아야 한다. 기존 회원 로그인과 공개 콘텐츠는 유지한다.
- 운영 socialProviders는 빈 배열. Google/Kakao 코드는 있으나 실제 연결된 기능으로 홍보하지 않는다. 향후 iOS 활성화 전 Apple 4.8 검토 및 동등한 로그인 수단 준비 필요.
- 실기기·네이티브 서명 빌드·스토어 사전 검사, 최종 개인정보 고지와 삭제 종단간 검증, 리뷰 계정, 스크린샷이 남았다.

## 기능과 실제 연결

| 영역 | 코드 및 사용 흐름 | 이번에 확인한 범위 |
| --- | --- | --- |
| 공개 말씀 | 홈 첫시간/설교 → 목록·검색 → 영상 상세·저장 | 공개 worship API 200; 영상 실제 재생·음성 미실행 |
| 주보·공지·일정 | 소식 → 목록 → 상세·첨부/주보 보기 | 각 공개 API 200; 업로드/교체 실제 회원 데이터 변경 안 함 |
| 교회 안내 | 교회 → 예배·오시는 길·연락처·헌금 | contact API 200, 대표번호 02-857-0191; 지도 네이티브 실기기 미실행 |
| 이메일 로그인 | 로그인 → Supabase 세션 → MY | 영속 세션·만료 갱신·로그아웃 자동 테스트; 운영 계정 로그인 미실행 |
| 가입 | 이메일·비밀번호·14세·정책 동의 → 로그인 | 정책/삭제 준비 조건 보완; 운영 쓰기 미실행 |
| 교인 확인 | MY → 이름·전화·직분 신청 → 관리자가 승인·소속 배정 | 코드 존재, 운영 옵션 활성; 실제 승인 이번 미실행 |
| 묵상·기도 | 날짜별 기록, 묵상 연결, 계속 기도할 제목별 관리 | owner 범위 조회·갱신 및 버전 충돌 테스트; 실기기 미실행 |
| 개인 일정·저장 | 로그인 사용자 소유 일정·말씀 저장 | 코드 및 자동 테스트; OS 캘린더 연동으로 주장하지 않음 |
| 알림 | OS 권한 → 토큰 등록 → 서버 발송 → 목록·상세 | 운영 notifications true; 실제 FCM/APNs 연결·수신 미확인 |
| 상담·심방 | 요청·내 요청 조회 | 코드 있음, 운영 care false; 이용 가능 기능으로 홍보 금지 |
| 삭제·복구 | MY 삭제/복구, 웹 삭제 접수 | UI/API/worker 코드 있음, 운영 앱 기능 false; 웹 경로 200만 확인 |

실제 서비스 API를 목업으로 교체하지 않았다. `dev:mobile:preview`는 명시적으로 가상 자료를 쓰는 별도 로컬 실행 명령이다. 미리보기 성공은 운영 인증·권한·푸시 성공으로 간주하지 않는다.

## 이번 수정

1. 내부 APK만 다운로드 업데이트 안내를 허용. EAS preview는 internal, production은 store로 지정. 미지정도 차단한다. 기존 설치 APK는 새 빌드를 설치하기 전 이 수정이 반영되지 않는다.
2. 간편 가입도 약관·개인정보 본문과 삭제 설정 준비를 요구한다. 앱 버튼과 서버를 함께 제한하며 빈 정책/공백/동의 누락을 회귀 테스트한다. 이메일 인증을 켜는 변경은 하지 않는다.
3. 앱 인증 설정에서 서버 secret 및 구형 service_role JWT를 거절. 공개 publishable/anon만 허용. 이는 JWT 서명 검증을 대체하지 않는다.
4. 추적 파일의 비밀값 후보를 값 없이 검사하는 `scripts/check-mobile-secrets.mjs` 추가. 휴리스틱 검사이며 전체 Git 이력/호스팅 설정/누락된 패턴까지 안전하다는 증명이 아니다.
5. Expo57 공식 권장 패치 적용 후 호환성 검사 통과. Zod는 기존 선언 범위 안에서 4.6.7 보안 패치 적용. SDK major 변경은 하지 않았다.

### 의존성 보안 권고와 후속 해결

2026-11-15 후속: 아래 초기 URL 파서 차단 항목은 공식 decoder0.5.1 고정과 query-string7.1.3 호환 패치로 해결했다. 실제 라우터 경로 회귀2, 패치 재적용, Android/iOS Hermes export 및 브라우저 가입/로그인/탈퇴 통과. 최종 audit에서 decoder/query-string/expo-router 권고 없음. 전체 모노레포는 moderate14/high5가 남아 있다. [패치 유지 지침](../patches/README.md). 아래는 초기 발견 기록이다.

`npm audit`는 라우터 → query-string 7.1.3 → decode-uri-component 0.2.2의 잘못된 percent 인코딩 처리 DoS를 보고했다. 수정 버전 0.5.1은 ESM이고 기존 query-string은 CommonJS에서 함수를 직접 require하므로 단순 override는 호출 형태를 깨뜨릴 수 있다. 자동 제안인 Expo Router58을 SDK57에 강제 설치하지 않았다. **출시 전 해결 필요**: SDK57 호환 upstream 패치 확인, 없으면 별도 브랜치에서 SDK58 업그레이드 또는 호환 어댑터를 비교 검증. 일반 Unicode·한글 쿼리·잘못된 인코딩·긴 입력의 시간 제한 테스트 및 웹/Android/iOS 번들 회귀가 필요하다. 공식 권고: [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f).

전체 모노레포 감사에는 Prisma 개발 도구·ESLint·source-map 등 추가 권고도 있다. npm install의 요약 수와 이후 audit의 전체 workspace 수는 범위/시점이 다르므로 같은 결과로 취급하지 않는다. `npm audit fix --force`로 숨기지 않았다. 배포 서버 의존성 영향 평가도 남아 있다.

## 보안·개인정보 확인

- native 세션은 SecureStore(기기 귀속 Keychain 설정), 웹은 localStorage. 비밀번호 자체를 로그인 유지용으로 저장하지 않는다. 웹 저장소는 XSS에 대한 별도 방어가 필요하다.
- 서버 `memberIdentity.authenticate`는 Supabase `/auth/v1/user`로 토큰을 검증하고 삭제 처리 계정을 차단한다. 개인 기록 서비스는 조회·수정에 ownerId를 결합한다. 버튼 숨김만으로 권한을 구현하지 않는다.
- 인증 없는 개인 기록/설정/기기 목록 요청은 각각 401 확인. 타인의 실제 자료에 접근하거나 운영 DB 권한/RLS를 변경하지 않았다. 운영 RLS 전체·DB 직통 접근·관리자 감사 정책은 추가 점검 대상이다.
- 추적 파일 1,098개 패턴 검사에서 비밀 후보 0. 모든 비밀 노출 부재를 보장하지 않는다. Git 전체 이력 및 실제 배포 번들 정밀 검사는 남아 있다.
- 개인정보 담당자 한상은 성도, 교회 대표번호, 만 14세 미만 가입 불허, 신규 상담·심방 5년 기준을 유지(사용자 재확인). 5년은 운영자 결정이며 법정 의무라고 표현하지 않는다.
- 사용자 추가 확정: 탈퇴 시 개인 묵상·기도·교인 확인 정보·상담·심방 기록 삭제. 상담·심방 5년은 일반 보관 상한이며 탈퇴하면 먼저 삭제한다. 지원 수신 이메일은 미정이다.
- 삭제 코드 확인: `deletion-service.ts`는 해당 owner의 개인 기록·상담 요청·소속·프로필을 삭제하며, 교인 확인 정보는 프로필 FK의 `onDelete: Cascade`로 삭제된다. 이 검토는 앱 회원 데이터 경로에 대한 것으로, 목회시스템에 별도로 작성·복사한 기록과 백업까지 자동 삭제된다는 보장이 아니다. 해당 연결 자료의 추적·삭제 범위 검증은 운영 활성화 전에 필요하다.
- 종교·건강 등 민감정보 처리 근거/별도 동의, 삭제 영수증·로그·백업의 기간, 국외 이전 업체/지역/계약을 확정해야 한다. 법적 보관 예외는 구체 근거·대상·기간 확인 없이 적용하지 않는다. 현재 종단간 암호화가 아니다.
- Supabase 인증/DB/Storage, Vercel 서버, Expo push와 FCM/APNs, YouTube 영상, 외부 지도, 메일 제공자 등 실제 연결 상태별 고지가 필요하다. 앱 회원 사진 업로드와 관리자 교적 사진을 혼동하지 않는다.

## 테스트 증거

후속 추가: 격리 실제 PostgreSQL51 통과(만료 전 상담·교인 확인 삭제와 다른 회원 보존 포함). `npm run test:account-release` URL2 + 가상 lifecycle1 + 목회 cascade1 통과. 가상 브라우저에서 가입→로그인→탈퇴 완료, pageerror0. 목회 연결 삭제 SQL은 운영 미적용. 실제 Supabase 메일/인증 삭제와 백업 복원은 여전히 미실행. [검증 범위](account-deletion-verification.md).

Windows, Node 24.15.0. 기준 커밋 위 로컬 변경. 테스트 계정은 `.invalid` 등 가상값. 상세 로컬 로그는 `.local/store-*`이며 Git에 올리지 않는다.

| 검사 | 결과 |
| --- | --- |
| `npm test` | 68 + 7 + 6 + 14 = 95 통과, 실패 0 |
| `npm run test:release-features` | 30 통과, 실패 0(서버 키 차단 및 APK 배포 구분 포함) |
| mobile `type-check`, `lint` | 통과; lint 최초 EPERM은 권한을 조정해 재실행 |
| `npx tsc --project tsconfig.shared.json --noEmit` | 통과 |
| `npm run check:boundaries` | 통과 |
| `node scripts/check-mobile-secrets.mjs` | 추적 파일 후보 0 |
| `expo export --platform android --platform ios` | 양쪽 Hermes 번들 생성 통과; 처음 permission denied 후 재실행 |
| `expo install --check` | SDK57 권장 패치 적용 후 Dependencies are up to date |
| Chrome 360×800 가상 데이터 UI | 홈/가입/공지/주보/로그인 5경로에서 가로 넘침 없음·pageerror 0, 홈·가입 캡처 육안 확인. 네이티브 검증 아님 |
| Android 연결 기기 | `adb devices -l` 빈 목록 |
| AAB/IPA 서명·설치·업데이트 | 미실행; 자격/승인/기기 필요 |
| iOS Simulator·iPhone | 미실행; Windows에 Xcode 없음, 사용자 iPhone은 현재 연결 안 됨 |
| FCM/APNs/백그라운드/재부팅 수신 | 미실행 |
| 최대 글자·키보드·안전영역·스크린리더 | 코드 검토만; 실제 기기 검증 미완료 |

다음 실기기 체크: 신규 설치 → 공개 콘텐츠 → 가입/로그인 → 개인 기록 생성 → 비행기 모드 실패/재시도 → 반복 저장/뒤로 → 배경/종료/재부팅 → 만료 갱신 → 업데이트 후 데이터 유지 → 푸시 허용/거부/토큰 갱신/누르기 → 삭제 후 로그인·토큰·기록 접근 차단. 기기명·OS·앱 빌드·시각·기대/실제 결과를 기록한다. Android 16KB와 iPad(현재 supportsTablet=true)도 검증한다.

## 스토어 자료 초안

- 이름: 대광교회 / 기본 언어: 한국어 / 무료. 버전 1.0.2는 현재 코드 값이며 다음 후보 버전·빌드 번호는 서명 빌드 승인 전에 결정한다.
- 짧은 소개: 대광교회의 말씀과 주보, 매일의 묵상과 기도를 한곳에서 만나세요.
- 상세 소개: 대광교회와 함께 말씀을 듣고 일상의 묵상과 기도를 기록하세요. 공개된 설교와 첫시간 주님께, 주보와 교회 소식을 확인할 수 있습니다. 로그인하면 날짜별 묵상과 계속 기도하는 제목을 관리할 수 있습니다. 교인 확인과 소속 신청은 MY에서 진행하며 관리자의 확인을 거칩니다. 공개 말씀과 교회 안내는 가입 없이 이용할 수 있습니다. 알림은 이용자의 허용과 설정에 따라 제공됩니다.
- 지원 URL 후보 https://daegwangchurch.kr / 정책 https://daegwangchurch.kr/privacy / 삭제 요청 https://daegwangchurch.kr/account-deletion (모두 공개 응답 확인). 지원 수신 이메일은 미정이며 발송 전용 root 주소를 수신 가능한 지원 메일로 단정하지 않는다.
- 아이콘: 기존 `apps/mobile/assets` 앱 아이콘 사용. 제출용 해상도/투명도/최종 산출물 검수 필요. 새 로고를 만들지 않는다.
- 스크린샷 촬영안: 홈 말씀, 말씀 상세, 통합 묵상 달력, 기도 제목, 주보, MY. 실제 Android/iPhone/iPad 후보 빌드에서 가상 사용자·승인된 콘텐츠로 촬영한다. 웹 화면을 네이티브 실기기 증거로 제출하지 않는다. 아직 제출용 촬영 미완료.
- 연령 등급: 스토어 질문표 미작성. 가입 14세 제한과 IARC/Apple 콘텐츠 등급은 별개다. 종교·외부 영상·자유 입력 내용을 사실대로 답한다.
- 권리: 교회 명칭·로고·설교·사진의 스토어 공개 범위 확인 필요. 기존 공개 게시물이라는 이유만으로 제3자 사진·영상의 스토어 홍보 권리를 추정하지 않는다.
- 심사 안내 초안: 공개 콘텐츠는 무로그인 접근 가능. 개인 기록은 별도 일반 회원 심사 계정으로 확인. 교인 승인/관리자 권한은 부여하지 않고 가상 모임으로 필요한 경우만 구성. 로그인→MY/기록→기능 확인→삭제 경로를 안내. 계정 삭제 시험 후 다시 사용할 별도 계정과 재설정 절차 준비. 실제 운영 관리자/교인 계정 금지. 아직 생성하지 않음.

## Apple 개인정보 / Google Data Safety 답변 초안

최종 바이너리 및 활성 기능에 맞춰 다시 확정한다. 현재 '수집 안 함'으로 제출하면 안 된다.

| 실제 처리 | Apple 후보 분류 | Google 후보 분류 | 목적·연결 |
| --- | --- | --- | --- |
| 이메일·이름·선택 전화 | Contact Info | Personal info | 계정/선택 교인 확인, 사용자 연결 |
| 계정 ID·푸시 설치 ID | Identifiers | User IDs / Device or other IDs | 인증·알림, 사용자 연결 |
| 교인·직분·소속 | Sensitive Info | Political or religious beliefs | 선택 교인 서비스, 사용자 연결 |
| 묵상·기도·일정 텍스트 | Other User Content | Other user-generated content | 개인 기록, 사용자 연결 |
| 상담·심방 요청 | Customer Support 및 실제 요청 항목 | 실제 개인 정보/사용자 콘텐츠 | 활성화 시 추가 확인 |
| 요청/오류 로그 | Diagnostics 등 실제 필드 확인 | Diagnostics 등 실제 필드 확인 | 보안/장애 대응, 기간 미확정 |

앱 내 광고 SDK/광고 추적 구현은 이번 검토에서 확인되지 않았다. YouTube/WebView 및 외부 지도/SDK가 전송하는 정보는 별도 확인 후 추적·공유 답변을 확정한다. Google의 서비스 제공자 예외와 Apple의 linked/tracking 정의를 구분한다. 서버 HTTPS 전송 확인은 종단간 암호화가 아니다. 삭제 가능 여부는 현재 운영 false이므로 완료했다고 답하지 않는다. 사용자 개인 사진/위치 권한을 수집한다고 관리자 기능만 보고 기재하지 않는다.

기존 본문 초안 [privacy-policy-draft.md](privacy-policy-draft.md)에 이번 운영 관찰을 함께 적용한다. 초안을 운영 방침으로 자동 게시하지 않는다.

## 계정·비용·정책 (공식 자료 확인 2026-11-15)

| 항목 | 확인·추천 |
| --- | --- |
| 명의 | 교회 조직 소유 우선. 사용자 답변: 증빙 확인 필요. 고유번호증만으로 Apple 법적 실체 요건 충족을 보장할 수 없다. 법적 명칭/주소, 대표의 계약 권한, D-U-N-S, 교회 관리 이메일 확인 |
| 개인 명의 | Apple 판매자에 개인 법적 이름 표시. Play도 검증된 정보의 공개 범위를 확인. 담당자 교체 시 소유 이전 절차 부담이 있어 교회 장기 운영에는 조직 권장 |
| 조직 명의 | 법적 조직명/주소·연락처 공개 및 증빙 검토. 계정 소유자는 교회 권한 있는 사람, 작업자는 최소 권한으로 초대. 공유 비밀번호 금지, 2FA 복구/인수인계 문서 필요 |
| Apple | 연 US$99(지역 통화·세금 별도). 적격 비영리 단체 수수료 면제 신청 가능하나 자동 적용 아님. Enterprise 가입은 교인 일반 배포의 대안으로 추천하지 않음 |
| Google Play | 일회 US$25. 새 개인 계정은 12명 연속 14일 비공개 테스트 후 production 접근 신청. 조직이라도 품질 검증 생략하지 않음 |
| Expo/EAS | Free $0, Android 15/iOS 15 build 포함 안내, 낮은 우선순위. Starter $19/월+초과 비용, build credit $45. 현재 계정 잔여량 미확인. 자동 유료 전환/결제 안 함 |
| 기타 | 기존 Supabase/Vercel/Firebase/메일의 실제 요금제·쿼터 미확인. 추가 유료 서비스 신청 안 함 |

현재 제출 기준은 Android API36 이상, Apple Xcode26+/iOS26 SDK다. 실제 AAB manifest와 IPA build metadata로 검증해야 하며 Expo 버전만 보고 충족했다고 표시하지 않는다. 16KB 지원 및 SDK privacy manifest/required-reason API는 네이티브 산출물 단계에서 검사한다.

공식 근거:
- [Google target API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [Apple SDK 최소 요건](https://developer.apple.com/news/upcoming-requirements/?id=04282026a)
- [Google 개인 계정 테스트](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Google 계정 비용](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)
- [Google 조직·개인 증빙](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en)
- [Apple 등록](https://developer.apple.com/help/account/membership/program-enrollment/), [면제](https://developer.apple.com/help/account/membership/fee-waivers)
- [Expo 비용](https://expo.dev/pricing.md)
- [Apple 심사 4.8·5.1 등](https://developer.apple.com/app-store/review/guidelines/)
- [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/), [Google Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Google 삭제 요건](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en), [Apple 삭제](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)
- [Android 16KB 검증](https://developer.android.com/guide/practices/page-sizes)

## 승인 전에 준비할 다음 실행안

1. 운영 삭제 정책/worker 및 복구 설정 점검 → 가상 계정 검증 계획 → 변경값을 비밀 제외하고 제시 → 운영 적용 승인. 삭제 정책은 기존 5년 자료와 충돌하지 않게 명시한다.
2. 조직 증빙 확인, 지원 수신 이메일·백업/로그 보관·심사 자료 권리 범위를 묶어서 확정. iOS 첫 버전은 현재 실제 설정대로 이메일 로그인 유지 권장. 소셜 추가는 Apple 요건과 함께 별도 진행.
3. 계정 생성/비용 승인 → 인증 → 기존 Android 서명 연속성 확인 → 빌드 후보 버전·번호·비용·잔여 위험 제시 → 서명/빌드 승인.
4. 실기기 및 사전 보고서 통과 → 테스트 배포 승인 → 필요한 테스트 수행 → 제출 승인 → 심사 통과 후 공개 승인.

Git push도 자동 운영 배포를 유발할 수 있으므로 이번 작업에서는 하지 않는다. 로컬 수정 완료를 배포 완료나 스토어 제출 준비 완료로 표시하지 않는다.
