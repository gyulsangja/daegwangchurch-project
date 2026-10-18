# 작업 인수인계
## 아이폰 홈페이지 QR 및 홈 화면 추가 안내 (2026-10-19)

- 사용자가 Apple 개발자 계정 없이 홈페이지 QR·홈 화면 추가 안내부터 배포하는 대안을 선택했다. iOS 설치 앱/IPA/TestFlight 배포가 아니며 개인 묵상·기도 기록과 푸시는 제공하지 않는다는 점을 안내한다.
- /app에서 Android APK와 아이폰 홈페이지 바로가기를 구분하고 아이폰 전용 QR을 추가. QR 목적지는 https://daegwangchurch.kr/app/iphone . scripts/generate-app-qr.mjs로 기존 공통 QR과 함께 재생성 가능.
- /app/iphone에 Safari → 홈페이지 첫 화면 열기 → 공유 → 홈 화면에 추가 절차를 제공한다. 안내 페이지 자체를 홈 화면에 저장하지 않도록 설명. 기존 앱의 교회 아이콘 파일을 apple-icon.png로 재사용하여 홈 화면 아이콘 제공. 첫 화면/하단 공통 안내 카드도 두 기종의 이용 방법을 구분했다.
- iPhone 실제 홈 화면 추가는 사용자 기기에서 확인 필요. 설치 앱은 향후 Apple Developer 등록·서명·기기 또는 TestFlight 배포를 준비해야 한다. 공식 기준: https://support.apple.com/en-mide/guide/iphone/iphea86e5236/27/ios/27 , https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases .

## 가입 연령과 개인정보 운영 기준 확정 (2026-10-18)

- 사용자 확정: 만 14세 미만 가입 불허 / 개인정보 담당자 한상은 성도 / 연락처 기존 교회 전화 02-857-0191 / 상담·심방 신규 요청 5년 보관. iPhone 보유, Apple 개발자 계정 없음.
- 운영 site_settings의 개인정보 담당자와 연락처 반영 완료. 다른 연락처·설정 유지. care_settings 행이 없어 실제 상담 접수는 비활성 상태이며 열람 담당자를 임의 지정하지 않았다. 관리자 접수 설정 신규 기본값은 달력 기준 5년. 기존 요청 만료일을 소급 연장하지 않고 회원탈퇴 시 먼저 삭제한다.
- 이메일 가입과 소셜 동의에 ageConfirmed=true 필수, 체크되지 않으면 UI/API 모두 거절. 생년월일/신분증 수집 없이 본인 선언을 받으며 동의 snapshot에 저장. 실제 나이 검증이나 Supabase 직접 가입 자체를 차단하는 Auth hook은 아님. 직접 인증 API로 생성한 계정에 대한 전체 회원 API 가입 완료 강제 정책은 정식 출시 전 추가 검토 필요.
- 앱 정책에 연령 기준·담당자·처리 항목·삭제 경로 안내를 보완하고 버전을 변경. 개인정보 초안의 국외 이전·수탁 법인·백업/로그 기간·민감정보 별도 동의는 아직 미확정이며 최종 스토어 적합성 완료로 간주하지 않는다.
- 기존 APK에 연령 확인 필드가 없어 새 서버 배포 뒤 기존 앱의 신규 가입은 업데이트가 필요하다. 기존 로그인 자체는 변경하지 않는다. 새 preview APK와 관리자/API를 함께 제공해야 한다.
- 전체 type-check, 세 앱 lint 통과. 가입/복구·소셜·상담 윤년/기간 및 미리보기 회귀 테스트 20개 통과. 운영 실제 가입·계정 삭제·상담 요청 생성은 시험하지 않았다.
- 배포 완료: 관리자/API dpl_55xD9AceuxhoWnQPgPPnKgo3KHLZ, 홈페이지 최종 dpl_yeKN4wMi2S66tBHqvKjYNLGfx4RL. 홈페이지 개인정보 안내 담당자·전화·14세·5년·삭제 경로 확인, 관리자/API 10경로 및 연령 미확인/false 요청 422 확인. 개인정보 선행 홈페이지 배포 dpl_9y8nnWecmuWy5NqV2v9wiwUQGTPM은 최종 다운로드 반영 배포로 대체됐다.
- Android preview APK 9623925f-2b45-451c-9414-8de2f8f1fb0d 완료. https://daegwangchurch.kr/app 에서 새 파일로 업데이트. 직접 링크 https://expo.dev/artifacts/eas/4eQtlZ6lqg7ri-S1il57LADqp6rUGQZdYJ919k_hz-0.apk . 다운로드 응답/크기 및 홈페이지 링크 검증. 실제 휴대폰 설치·가입 확인은 별도 필요. Play AAB나 iOS IPA/스토어 제출은 하지 않았다.

## 개인정보 초안과 웹 계정 삭제 및 iOS 준비 (2026-10-18)

- docs/privacy-policy-draft.md 작성. 앱/홈페이지의 실제 수집 항목·민감정보·보관/삭제·수탁 서비스·국외 이전·권리 행사와 확인이 필요한 운영값을 분리했다. 확정 전 정식 방침으로 게시하거나 앱 정책 API를 임의 변경하지 않았다. 담당자/연락처·상담 보관 기간·만14세 미만 가입 및 Apple 계정/iPhone 보유를 사용자에게 질문한 상태다.
- /account-deletion 공개 웹 요청 페이지 추가. 비로그인 요청을 기존 관리자 문의함 GENERAL/고정 제목으로 접수, 동일 rate limit/개인정보 동의/검증 적용, 성공 뒤 삭제 완료가 아닌 접수 상태로 안내. returnPath는 고정 허용 목록만 사용. 본인 확인 전 계정을 삭제하지 않는다. 홈페이지 /privacy에 요청 항목·목적과 해당 경로 링크를 보완했다. 기존 앱 내부 탈퇴를 대체하지 않는다.
- 웹 요청 처리 운영자는 입력 이메일/전화만 믿고 삭제하지 말고 기존 계정의 연락 수단으로 소유 확인 후 관리자 회원관리의 삭제 흐름을 이용한다. 실제 사용자 계정 삭제 시험은 하지 않았다. 삭제 처리 기간·영수증/백업 보관 확정 및 실접수 확인은 아직 남음.
- docs/ios-release-plan.md에 Apple 가입·D-U-N-S·연회비 면제·Windows/EAS·APNs·TestFlight·Apple 로그인/토큰 폐기·iPad·헌금 심사 검토를 정리했다. Expo iOS export 1,487모듈 성공. IPA 서명·Apple 자격 생성·실기기/스토어 제출은 하지 않았다.
- 홈페이지 type-check/lint 통과. 신규 요청 경로는 운영 배포 및 공개 응답 검증 후 아래에 기록한다.
- 운영 배포 dpl_2Y759JdVeQgPU5Pe5R8dsiYZgsjm 완료. /account-deletion 및 /privacy HTTP 200, 개인정보 안내의 삭제 링크 확인. 실제 Next 폼 action 필드를 사용한 잘못된 요청(type INVALID/필수 정보 미입력)이 입력 오류로 반환되고 리다이렉트되지 않음을 확인했다. 유효한 운영 문의 생성·계정 삭제는 시험하지 않았다. 초기 dpl_5vYVupVKXRF14HvwEoeJy6pCxRFA 대신 방문 전용 안내까지 수정한 최종 배포만 운영 승격했다.

## Google Play 정식 출시 준비 시작 (2026-10-18)

- 사용자 요청으로 출시 설정과 최신 Google 정책을 검토. 사용자는 Play Console 계정이 없다고 답변했다. 교회 명의 조직 계정/본인 개인 계정 선택은 미확정. 결제·콘솔 앱 생성·스토어 업로드는 하지 않았다.
- docs/mobile-security-and-store-release.md 상단에 등록정보 초안, 계정 절차, 현재 출시 전 보완 항목을 정리했다. production AAB 설정은 있지만 실제 빌드 및 원격 환경 검증은 아직 안 했다.
- 우선 확정할 사항: 교회 명의 조직 등록을 위한 증빙/D-U-N-S 준비 여부, 공개 지원 이메일 및 개인정보 담당자/보관 정책, 실제 대상 연령. 병행 개발할 사항: 앱 범위 개인정보 안내, 웹 계정 삭제 요청 경로, 실제 삭제 종단간 시험, 푸시 작업 오류 및 수신 검증, 스토어 화면 자료.

## Google HTML 파일 소유 확인 준비 (2026-10-18)

- 사용자가 내려받은 google8dcde8b9ac77055d.html 원본을 apps/website/public에 바이트 변경 없이 복사했고 SHA256 일치를 확인했다. 공개 소유 확인 파일이며 인증 후에도 삭제하지 않는다.
- Google은 메타 태그 대신 파일 방식으로 진행한다. URL https://daegwangchurch.kr/google8dcde8b9ac77055d.html . 배포 dpl_fVsF612D2eSUY7tZKXch2ibCDqKb 검증 후 사용자에게 Search Console 확인 버튼을 안내할 것. 파일 배포와 Google 대시보드 확인 완료는 구분한다.
- 운영 배포 완료. 도메인 전환 직후 404 후 재검증에서 리다이렉트 없이 HTTP 200 및 원본과 바이트 일치를 확인했다. 사용자 Search Console의 ‘확인’ 클릭과 사이트맵 제출은 아직 응답 대기.

## 검색 등록 및 SEO·AI 검색 준비 (2026-10-18)

- 사용자는 네이버/구글 모두 미등록으로 확인. 네이버 HTML 소유확인 태그를 제공하여 공개 메타 태그에 반영했다. 구글 태그는 대기 중. GOOGLE_SITE_VERIFICATION / NAVER_SITE_VERIFICATION / BING_SITE_VERIFICATION 환경변수도 지원한다(공개 확인값).
- 홈 검색 제목·설명에 서울 금천구 독산동 및 예배/설교/주보/새가족 안내를 명시. Church/WebSite 구조화 데이터를 고유 ID로 연결하고 공개 좌표를 반영. 사이트맵 정적 페이지에 매 요청 현재 시각을 lastmod로 내보내던 부정확한 표시를 제거했다.
- 새가족 안내에 보이는 질문·답변을 추가. 주소·전화·예배시간은 기존 관리자 데이터에서 읽으며 비공개 회원 정보는 사용하지 않는다. AI 인용이나 검색 순위, FAQ 검색 특수표시를 보장하지 않는다.
- 운영 사전 점검: 홈/robots.txt/sitemap.xml HTTP 200, canonical https://daegwangchurch.kr, 사이트맵 약 1,982개 URL. 홈페이지 type-check/lint 통과. 현재 작업 배포 완료 여부는 다음 기록 확인.
- 배포 dpl_GMo1FEifEPEnQc9yosfGouSBHauM 운영 승격 완료. Yeti 사용자 에이전트로 홈 head의 네이버 확인 태그, 새 검색 제목, Church/WebSite JSON-LD, 새가족 질문·답변, robots 및 1,982개 sitemap URL/정적 lastmod 제거를 HTTP 200으로 검증했다. 사용자에게 네이버 소유확인 및 사이트맵 제출을 안내했으며 실제 대시보드 완료 여부는 응답 대기다.
- 등록 절차: 네이버 https://searchadvisor.naver.com → 웹마스터 도구 → https://daegwangchurch.kr → 소유확인 → 요청/사이트맵 제출에 https://daegwangchurch.kr/sitemap.xml. 구글 https://search.google.com/search-console → URL 접두어 https://daegwangchurch.kr/ → HTML 태그 확인 → Sitemaps에 sitemap.xml → 홈 URL 검사/색인 생성 요청. 실제 대시보드 소유 확인/제출은 아직 미완료.
- 다음 https://register.search.daum.net/index.daum → 사이트 검색 신규등록. 이름 ‘대광교회’, URL https://daegwangchurch.kr/, 소개 ‘서울 금천구 독산동 대한예수교장로회 대광교회. 예배시간, 설교, 주보, 새가족 안내.’를 사용하고 등록자 정보와 약관은 사용자가 확인한다. 카카오맵 지역정보는 https://mystore.kakao.com/ 에서 별도 확인/등록하며 기존 장소를 먼저 검색해 중복 생성을 피한다. 기존 홈페이지/유튜브·지도 공식 링크도 새 도메인으로 통일할 필요가 있다.
- 공식 근거: https://searchadvisor.naver.com/guide/seo-basic-intro , https://support.google.com/webmasters/answer/9008080?hl=ko , https://developers.google.com/search/docs/appearance/ai-features , https://register.search.daum.net/index.daum . GEO/AEO용 특수 파일이나 숨김 키워드 대신 수집 가능성·공개 정보의 명료함을 개선했다.

## 헌금안내 공통 제목 영역 (2026-10-18)

- 헌금안내에 다른 서브페이지와 동일한 PageHero를 추가했다. 교회소개 표제·헌금 안내 제목·소개 문장을 표시하고 본문 중복 제목은 제거했다. 앞서 추가한 2차 메뉴와 계좌 정보는 유지한다.
- 홈페이지 type-check 및 lint 통과. Vercel 배포 dpl_DhmN9K8cfxEZULuh1WZPnPUSouoj 운영 승격 완료. 주요 경로 4개 검증 및 https://daegwangchurch.kr/offering HTTP 200, 공통 제목 영역, h1 1개, 2차 메뉴 현재 페이지 표시 확인.

## 시간 선택 APK 및 헌금안내 운영 배포 완료 (2026-10-18)

- Android preview APK d3ea2b01-53db-4751-8e7f-a0c233359c7c 완료. 시·분 선택창, 묵상 알림 스위치와 시간 배치 개선 포함. 다운로드 파일 HTTP/크기 확인 완료.
- APK: https://expo.dev/artifacts/eas/NDCR3zfjixTVCA5pRd2hMuKdr3ZEj9N3EIf8VGP48xQ.apk
- 홈페이지 배포 dpl_CvbxrGr6S3grxAeKVAnKekJwCtcY 운영 승격 완료. https://daegwangchurch.kr/app 새 APK 링크 확인, /offering HTTP 200 및 교회소개 2차 메뉴·헌금안내 aria-current 선택 상태 확인. 홈페이지 type-check/lint 통과.
- 이번 빌드는 테스트용 직접 설치 APK이며 스토어 출시는 아님. 실제 휴대폰 화면 및 푸시 수신 검증은 별도로 남아 있다. 아래 진행 중 기록보다 이 완료 기록이 우선한다.

## 헌금안내 2차 메뉴 및 임시 배포 진행 (2026-10-18)

- /offering이 /about 바깥 경로여서 교회소개 하위 메뉴가 누락되어 있었다. offering/layout.tsx에 기존 SectionNavigation과 aboutNavigation을 적용하여 동일 메뉴와 현재 페이지 강조를 제공한다. 기존 URL과 헌금 정보는 유지한다.
- 홈페이지 type-check 및 lint 통과. 시간 선택 개선 APK d3ea2b01-53db-4751-8e7f-a0c233359c7c 빌드와 함께 홈페이지 배포 예정. 후속 결과는 test-results/deploy/time-final-app.json에서 확인하며 완료 전까지 운영 반영으로 간주하지 않는다.

## 앱 시간 선택 및 묵상 알림 사용성 (2026-10-18)

- 묵상 알림 시간과 개인 일정 시작·종료 시간을 키보드 입력 대신 시/분 스크롤 선택 팝업으로 통일. 1분 단위의 기존 저장 시간을 유지하며 적용/취소를 구분한다. 날짜·월 필터 및 기록 날짜는 기존 달력 선택을 사용한다. 상담의 ‘연락 가능한 시간’은 자유로운 요청 설명이므로 텍스트로 유지.
- ‘묵상 알림 · 첫시간 주님께’ 스위치 바로 아래에 시간을 배치하고 켜짐/꺼짐 설명, 꺼졌을 때 시간 비활성화, 저장 안내를 추가했다. 기존 devotional 설정 및 API를 그대로 사용한다.
- 검증: 모바일 type-check 및 lint 통과, git diff --check 통과. lint는 샌드박스 경로 탐색 EPERM 후 승인된 재실행에서 통과.
- 일정 화면의 오래된 ‘푸시 미제공’ 안내 및 날짜 직접 입력 형식 안내를 수정했다. 이번 변경은 소스에 반영했으며 이전 배포 APK에는 포함되지 않는다. 실기기 화면 검증 및 새 APK 배포는 미실시.
- 앞선 사용자 기기 연결 후 운영 DB에서 Android 1대 확인. 최근 크론 응답 1회 503(Push worker failed), 이전 응답은 checked 0이며 실제 발송 기록 없음. 연결 완료를 수신 성공으로 간주하지 말고 서버 작업 원인 및 실기기 수신을 계속 확인해야 한다.

## FCM 원격 자격 읽기 전용 확인 (2026-10-18)

- 사용자가 preview 프로필 FCM 연결 상태 조회만 승인하여 EAS credentials를 확인했다. FCM V1 서비스 계정이 Firebase 프로젝트 daegwang-church / Android org.daegwangchurch.app에 등록되어 있다. 키 생성·교체·삭제 없이 조회 후 종료했다. Legacy 키 미등록은 V1 등록 누락을 의미하지 않는다.
- 이 확인은 Expo 자격 등록 상태만 검증하며, Google 측 키 유효성·권한이나 실제 휴대폰 수신을 입증하지 않는다.
- 사용자 답변: 내용 미표시는 OS 알림창과 앱 목록 모두 해당, 기기 연결 시도는 ‘알림이 안돼’로 보고. 구체적 오류는 미확인이다. 최신 APK를 https://daegwangchurch.kr/app 에서 업데이트하고 연결 버튼의 정확한 안내 문구를 요청했다.
- 아래 FCM 조회 승인 대기 기록은 해소됨. 실제 기기 등록 및 수신 검증은 여전히 미완료이며, 오류 확인 전 Firebase 키 교체나 시험 알림 일괄 발송을 하지 않는다.

## 알림 개선 APK·홈페이지·Git 후속 완료 (2026-10-18)

- Android APK b52d1270-c149-47e8-8c7f-b279ca851196 완료, 파일 다운로드 및 운영 /app 링크 검증 완료.
- APK: https://expo.dev/artifacts/eas/B4YQ01wzctmj058EClJ9S_vTgIlrxxfuwu5m3UXtVQI.apk
- 홈페이지 최종 배포: dpl_CBcp6oNDiEAYSPmhffuETN7pBUzT / https://daegwangchurch-jxe8b34c7-gyulsangjas-projects.vercel.app
- 앱 알림 본문 표시·기기 미등록 경고·연결 상태 재확인 포함. 서버 알림 내용 개선 운영 배포 완료. 실제 휴대폰 수신은 사용자의 기기 등록/확인 응답을 기다리는 상태이며 FCM 자격 조회 승인도 별도로 필요.
- 최종 Git 결과는 로컬 test-results/deploy/push-final-git.json. 아래 이전 빌드 대기 기록보다 이 완료 기록 우선.

## 알림 내용·수신 연결 점검 (2026-10-18)

- 사용자 요청: 푸시 불규칙 수신/Firebase 전체 확인, 알림창에 실제 내용 표시. 기존 Git 업로드·배포 요청 유지.
- 읽기 전용 운영 점검: 등록 기기 0대, 발송 이력 0건, 알림센터 공지 3건. 5분 크론 최근 6회 정상, 보관된 HTTP 응답 72회 200. 수신 설정은 켜진 회원 2명이나 기기 등록은 별개. 원인으로 Firebase 장애를 단정하지 말 것. 사용자에게 설치 앱에서 연결 버튼을 누른 결과와 ‘알람 1’ 표시 위치를 질문한 상태.
- 10월 18일 오전 공개 API 확인: 현재 공개 공지 0개, 최신 첫시간 10월 16일자·주일 오전예배 10월 11일자. 첫시간은 당일 영상이 있어야 발송되므로 이날 점검 시점에는 당일 첫시간 발송 대상도 없음. 최근 10월 18일 08:05 KST 크론/HTTP 정상, 기기 여전히 0대.
- 공개 콘텐츠 푸시에 제목·요약 적용, 날짜/성경 본문 포함 말씀 안내, 비공개 모임/개인 일정 잠금 화면 비노출 유지. 발송 직전 공개·권한 재검사 결과만 사용하며 화면에 표시하는 푸시는 high priority. 앱 목록에 본문 표시, 설정 저장 후 기기 미등록 경고, 연결 상태 재확인 및 OS 설정 진입 보완.
- 검증: 전체 type-check, 모바일 및 변경 서버 파일 lint, 푸시 단위 7개/설정 준비 6개, 격리 PostgreSQL 통합 51개 통과. 실제 운영 회원에 시험 알림 발송하지 않았음. 실제 폰 수신 및 UI 시각 검증은 미완료.
- Firebase 로컬 파일/패키지/Expo 설정 12/12 일치. 브라우저 새 창 제어가 불가했고 EAS credentials preview 프로필 선택은 자동 승인 검토가 ‘이후 자격 변경 가능성’을 이유로 차단. 키 생성·교체·삭제 없이 FCM 연결 조회만 사용자에게 추가 확인 요청. 이 승인 전 프로필 선택을 우회하지 말 것.
- 관리자 API 배포 dpl_7bxrkZ7h67TS2sqBs2z3XoHFpamj (https://daegwangchurch-admin-9oskkz1x7-gyulsangjas-projects.vercel.app) HTTP/API 10개 검증 후 운영 승격 완료. 코드 Git main a779ad5. 새 preview APK b52d1270-c149-47e8-8c7f-b279ca851196 빌드 중. test-results/deploy/finish-push-app.mjs 세션 71550은 APK 완료→다운로드 확인→홈페이지 링크 교체/배포/운영 검증을 수행하며 push-final-app.json에 결과 기록. 완료 후 Git에 새 링크를 커밋할 것. 이전 review-final-app.json은 10월 15일 결과로 이번 빌드와 다름.
- APK Git 후속 감시: test-results/deploy/commit-push-app.mjs 세션 49780, push-final-app.json 성공 후 다운로드 링크와 이 문서만 커밋·main push. 결과 push-final-git.json. 기기 등록 확인/FCM 조회 승인 질문에는 아직 응답이 없으므로 실제 수신 완료로 기록하지 말 것.

## 새 통합 기록 APK 및 Git 후속 완료 (2026-10-15)

- Android APK 빌드 5ac10a59-1b88-4d4b-938d-f9f48bd76f4f 완료. 파일 다운로드/크기 확인, 홈페이지 링크 운영 검증 완료.
- APK: https://expo.dev/artifacts/eas/5AuDU0ti3D1F81I39O8QQl8LhtvhxiNuzv7akOQgRQQ.apk
- 홈페이지 다운로드 최종 배포: dpl_2cLAW2ANq1iaSA8ckZxXr7Pae4YZ / https://daegwangchurch-g2prsn9d7-gyulsangjas-projects.vercel.app
- 로그인 유지·통합 말씀/묵상/기도·기도제목별 기록 포함. 실제 휴대폰 설치/재부팅 및 Google Play/iOS 스토어 제출은 미실시.
- Git 후속 결과: 로컬 test-results/deploy/review-final-git.json 확인. 이전 대기 기록보다 이 항목 우선.

## 회원 직분·소속 수정 보완 (2026-10-15)

- 사용자 추가 요청: 관리자 회원 관리에서 소속·직분을 수정하고 모든 변경을 Git main에 업로드.
- 회원 관리 팝업에 직분·소속 수정 폼 추가. 교인 미확인 회원도 직분 저장 가능(프로필 없는 기존 Auth 회원 포함), 승인된 교인은 복수 소속 교체/해제 가능. 직분 변경이 교인 승인이나 관리자 권한을 바꾸지 않음. 소속 전체 해제도 교인 승인 유지.
- 최고관리자 권한·삭제 처리·수정 버전 충돌·비활성 소속 검사 및 트랜잭션 적용. 앱은 기존 교인 확인 화면 재진입 시 같은 저장소의 최신 정보를 조회하므로 이번 관리자 기능 때문에 APK 재빌드 불필요.
- 관리자 타입 검사·린트, 회원 관리 테스트 3개 통과. 로컬 회원 관리 팝업에서 직분 입력 확인. 실제 회원의 소속/직분/권한은 테스트 목적으로 변경하지 않음.
- 최종 관리자 배포: dpl_8xHt5HZwa81tSymGLdGZZfSRfEZd / https://daegwangchurch-admin-hs3rik0mp-gyulsangjas-projects.vercel.app. HTTP/API 검사 10개 통과 후 기존 운영 주소로 승격 완료. 운영 브라우저에서 회원 관리 팝업의 직분 입력 확인. 코드 Git main 커밋 0f3986d.
- APK 후속 배포 감시 세션 58587 유지. Git 자동 커밋 감시 22622는 동시 stage 충돌을 피하려고 중단 후 세션 29700으로 재개. 최상단 APK 후속 완료 기록과 로컬 review-final-app.json/review-final-git.json의 FINISHED 결과가 있으면 더 이상 감시 재실행 불필요.

## 통합 사용성 검토 및 배포 진행 (2026-10-15)

- 사용자 요청: 사이트·관리자·앱의 전체 사용성을 검토하고 Git main 업로드 및 배포. 기존 미커밋 기능(주보 전체화면·헌금·지도·자료 이관·소셜 준비 등)도 보존해 함께 검증.
- 앱 MY의 말씀·묵상·기도를 하나의 날짜 캘린더로 통합. 해당 날짜의 말씀과 묵상·기도 표시, 기존 묵상 이어 쓰기, 기도제목별 날짜 기록 및 응답/감사 연결. 기도제목 검색 선택은 팝업, 로딩 실패는 재시도 가능. 서버 소유자별 트랜잭션 잠금으로 동시 중복 묵상 방지, 날짜 변경 중복도 거부. 기존 기록 삭제 없음.
- 관리자 전체 Auth 회원(프로필 미생성 포함)을 검색/분류/20명 페이지로 조회. 교인 승인·소속·권한·삭제를 관리 팝업으로 통합. 자신의 최고관리자 권한/계정 변경 차단, 활성 관리자 삭제는 먼저 권한 해제 필요. 삭제는 명시적 이메일·체크 확인, 개인 내용 미열람, 인증 서버 실패 시 재시도 가능. 기존 관리자 경로는 회원 관리로 이동. 모임 공지 20건 페이지, 모임/담당자/상담 설정 팝업 적용.
- 저장된 서버 전용 키는 읽기 전용 Auth 관리자 API로 검증 후 Vercel 관리자 production 비밀 설정에 등록. 실제 회원 역할 변경/삭제 테스트는 하지 않음.
- 검증: 전체 type-check 및 각 앱 lint, 기존 npm test, 신규 세션/소셜/캐시/헌금/관리자 테스트 14개, 기록·세션·관리자 집중 테스트 14개, 격리 PostgreSQL 통합 51개 통과. 동시 묵상 테스트에서 발견한 트랜잭션 중첩 문제 수정 후 통과. 운영 DB에는 테스트 데이터 생성 안 함.
- 화면: 로컬 홈페이지 메인/주요 탐색, 실제 회원 목록 및 관리 팝업, 가상 계정의 묵상 작성→선택 날짜 복귀→이어 쓰기/기도제목 저장 확인. Android/iPhone 실기기 재부팅 검증은 미실시.
- 관리자 운영 배포 완료: `dpl_83pS3DwgHbg8vT5VRbTAxeUBn5Qk`, URL `https://daegwangchurch-admin-4p0qtsfyy-gyulsangjas-projects.vercel.app`; HTTP/API 검사 10개 통과 후 기존 운영 주소 승격.
- 홈페이지 운영 배포 완료: `dpl_53mJgpeDmgZnYYQmHYWAqV1yPBDb`, URL `https://daegwangchurch-3rx75iusw-gyulsangjas-projects.vercel.app`; 공개 경로 검사 4개 통과 후 기존 운영 도메인 승격.
- Android 새 APK: `5ac10a59-1b88-4d4b-938d-f9f48bd76f4f` Expo 무료 대기열. 이전 APK에는 통합 기록/로그인 유지 보완 미포함. 완료 후 `/app` 다운로드 주소를 교체하고 홈페이지 재배포할 것. 상태 확인: `node test-results/deploy/review-app-status.mjs` (로컬 도구). Google Play/iOS 스토어 제출은 아직 하지 않음; `mobile-security-and-store-release.md`의 남은 요건 유지.
- 자동 후속 실행 중: `test-results/deploy/finish-review-app.mjs`(세션 58587)는 APK 완료→파일 검증→홈페이지 링크 교체/배포/승격/운영 링크 검증을 수행. `commit-review-app.mjs`(세션 22622)는 성공 결과 확인 후 링크와 HANDOFF만 추가 커밋·main push. 결과는 `review-final-app.json`, `review-final-git.json`에 기록. PC/프로세스 종료 시 후속 실행이 중단되므로 다음 턴에 결과를 먼저 확인할 것. 다운로드 파일을 동시에 수정하거나 다른 변경을 stage하지 말 것.
- 운영 도메인 최종 HTTP 5개 확인, 운영 관리자 회원/상담 화면 직접 확인. 가상 앱에서 제목 연결 기도 저장 및 새로고침 후 로그인 복원 추가 확인. Git `0633b39` 기능 묶음과 `3100029` 가상 기록 규칙 보완 업로드 완료.

## Android/iOS 로그인 보안·스토어 준비 검토 (2026-10-15)

- 사용자 요청: 로그인 유지 보안을 검토·보완하고 Google Play 및 향후 iOS 배포를 함께 고려. [상세 검토](mobile-security-and-store-release.md)에 채택 방식/검증/출시 필수 후속 항목 기록.
- SecureStore 세션 손상/누락 시 복원 차단 및 로그아웃 제거 경로 보완. Android allowBackup=false 및 SecureStore 백업/기기 이전 제외 명시, 사용하지 않는 녹음/연락처/위치/외부 저장소/광고 ID 권한 차단. iOS Keychain 기기 한정 유지, 미사용 Face ID 권한 문구 제거. production EAS는 production 환경·Android AAB 명시.
- 세션 테스트 5개, 모바일 type-check/lint, 경계 검사, 네이티브 설정 introspection 통과. check:release 로컬 10/16이며 아직 출시 가능 판정 아님. 앱용 개인정보 방침/사용자 실제 탈퇴·웹 삭제 경로/iOS Apple 로그인/양 플랫폼 실기기 및 최종 바이너리 확인 미완료. 새 APK/AAB/IPA 빌드·배포 안 함.

## Prisma 이력 테이블 보안 수정 (2026-10-15)

- Supabase 경고 `RLS Disabled in Public: public._prisma_migrations` 대응. 운영 확인 결과 RLS 비활성 및 anon/authenticated SELECT 권한이 존재했음.
- `20261015090000_protect_prisma_migrations` 운영 적용 완료: RLS 활성화, PUBLIC/anon/authenticated 모든 테이블 권한 제거. 공개 정책을 추가하지 않으며 Prisma 소유자 연결을 유지하기 위해 FORCE RLS는 사용하지 않음. `supabase/rls.sql`에도 동일 보호 추가.
- 적용 후 RLS=true, anon/authenticated SELECT=false, Prisma 연결 소유자·접근 권한 유지 확인. `npm run db:deploy` 재실행 성공, 미적용 마이그레이션 없음. 데이터 삭제 없음. Supabase 대시보드 경고 표시 자체는 재검사하지 않음.
- 진행 중 작업: 하루 말씀·묵상·기도 통합 캘린더 및 회원 전체 목록/관리 팝업/권한 해제/회원 삭제는 작업 파일에 있으나 최종 검증·배포 전. 사용자 서버 전용 Secret key 저장 확인했으며 실제 회원 삭제 테스트는 하지 말 것. 기존 설치 APK에는 로그인 유지 및 통합 기록 수정이 아직 포함되지 않음.

## 로그인 유지 수정 (2026-10-15)

- 사용자 보고: 앱을 다시 열 때 로그인이 반복 해제됨. 원인은 `createMemberAuth`의 `persistSession:false`, `autoRefreshToken:false`와 메모리 전용 인증 저장이었다.
- 앱 기본 인증 클라이언트에 영구 저장·자동 갱신 적용. native는 기존 Expo SecureStore를 사용하며 500자 암호화 청크와 마지막 manifest 갱신으로 큰 세션/저장 실패를 처리. 비밀번호 저장 없음. 웹 미리보기는 localStorage. 임시 OAuth 교환 클라이언트는 기존 메모리 전용 유지.
- 앱 재실행 초기 인증 이벤트까지 로그인 확인 화면 표시, native AppState 활성/비활성에 맞춰 토큰 갱신 시작/정지, 로그아웃 시 디스크 세션 제거 및 개인 초안 초기화. 로그인 안내 문구도 유지 방식으로 수정.
- `tests/member-session.test.ts`: 저장소 재생성/큰 Unicode 세션/실패한 쓰기 보존/실제 Supabase SDK의 로그인 복원·만료 토큰 갱신·로그아웃 후 재실행 테스트 3개 통과. 모바일 type-check/lint 확인. 실제 휴대폰 재부팅 검증 및 수정본 APK 빌드/배포는 아직 하지 않음. 아래 기존 APK에는 이 수정 미포함.

## APK 및 다운로드 링크 후속 배포 완료 (2026-10-14)

- Android build: af9026d2-c576-4bf3-b3f4-281909cfb2c5 FINISHED. 다운로드 파일 HTTP/크기 확인 완료. 실제 휴대폰 설치 확인은 미실시.
- APK: https://expo.dev/artifacts/eas/GVmQrr9RxjPPtmYJpKiZszFeX41aKMxCejmCZjKMRsM.apk
- 홈페이지 최종 배포: dpl_7E12dxE3miQP67NU2wmYM2BKxFvV / https://daegwangchurch-eihdnf9vv-gyulsangjas-projects.vercel.app. 운영 승격 및 https://daegwangchurch.kr/app 의 새 APK 링크 확인 완료.
- 상세 결과: test-results/deploy/final-app-download-result.json. 아래 대기 기록보다 이 항목이 우선함.

## 최신 검증: 자료 이관·홈페이지/관리자 배포 완료, APK 대기 (2026-10-14)

- 기존 홈페이지 공개 사진 **248장 전부** 현재 Supabase 미디어에 저장: 인물 사진 4개 연결, 앨범 사진 244개 연결, 누락 0. 아래 기록의 임시 `/admin/import-legacy` 파일 2개는 삭제 완료했으며 최종 관리자 배포에는 포함하지 않음.
- 유튜브 **신규 1,933개 등록 완료**. 운영 공개 API 전체 커서 순회 결과 1,937개(첫시간 1,349 / 주일오전 249 / 수요 195 / 주일오후 144), 중복 없음. 기존 삭제된 영상 1개는 복구하지 않음. 가져온 영상의 APP 발행 누락 0.
- 홈페이지·관리자 영상 목록에 검색, 월별 조회, 페이지 이동 추가. 홈페이지 12개/관리자 30개 단위로 과거 영상 전체 접근 가능. 운영 첫시간 113쪽의 2022년 영상, 로컬 관리자 수요기도회 7쪽까지 검증.
- 홈페이지 운영 배포 `dpl_23RYNZwKJgHwm4JTzpiNYozYiGuC` / `https://daegwangchurch-htjaal9ak-gyulsangjas-projects.vercel.app` 승격 완료. 운영 주소 https://daegwangchurch.kr.
- 관리자/API 운영 배포 `dpl_HVBRbG84Uphwr9UaPFCe7ctEqsAd` / `https://daegwangchurch-admin-2phsecmib-gyulsangjas-projects.vercel.app` 승격 완료. 헌금 안내·계좌 관리 포함. 운영 contact API 계좌 응답 검증 완료.
- 전체 type-check/lint, workspace 경계, 헌금 계약/교회 API 테스트 6개 통과. 홈페이지 배포 HTTP 4개, 관리자 배포 HTTP 10개 통과. 앱 헌금 화면의 불필요한 경로 헤더 제거 확인. 실제 휴대폰 설치 확인은 미실시.
- **새 Android APK 빌드 `af9026d2-c576-4bf3-b3f4-281909cfb2c5` 제출 완료, Expo 무료 대기열.** 주보 전체 화면+헌금 안내 포함. `test-results/deploy/watch-app-build.mjs`로 상태 확인 중. 완료하면 `apps/website/src/lib/app-download.ts`의 APK 주소를 새 artifact로 교체하고 홈페이지 재배포/승격해야 함. 현재 `/app`은 이전 APK 링크 유지 중.
- 자동 후속 작업 `test-results/deploy/finish-app-download.mjs` 실행 중(세션 53384), 빌드 감시 세션 60524. 빌드 완료 후 APK HEAD/크기 검증 → 주소 교체 → 홈페이지 배포 → HTTP 검증 → 승격 → 운영 링크 검증을 수행하며 `test-results/deploy/final-app-download-result.json`에 결과 기록. 새 턴에서 반드시 이 결과를 먼저 확인할 것. 빌드 대기 중에는 APK 주소 파일을 동시에 수정하지 말 것. PC/프로세스가 종료되면 감시와 후속 스크립트를 다시 실행해야 함.
- 검증 스크립트 `test-results/content-import/verify-import.mjs`, 원문 수집/백업/사진 목록 및 화면 검증 자료는 Git 제외 test-results에 보관. 스크린샷 `worship-archive-production.png` 및 `people-imported.png`.

## 진행 중: 기존 홈페이지·유튜브 자료 이관 및 헌금 안내 (2026-10-14)

- 사용자 추가 요청: https://daegwangchurch.smartchurch.net/ 의 부서/예배/인물 정보와 사진 이관, 홈페이지·앱 헌금 안내, ‘교역자와 사역자’ 대신 ‘섬기는 사람들’, 유튜브의 수요기도회·첫시간 주님께·주일오전예배·주일오후 성경공부 모임 전체 영상 게시물 등록.
- `scripts/import-church-legacy.mjs --apply` 실행: 운영 DB에 예배/모임 9개, 부서 3개, 인물 4명, 공개 앨범 12개 추가. 기존 행은 보존. 대표 전화 및 공개 헌금 계좌를 contactOptions에 추가. 원본 공개 계좌는 국민은행 435001-01-444419 / 대한예수교장로회 대광교회. 새가족부의 요일은 원문에 없어 ‘요일 문의’, 버스 번호의 명백히 불확실한 항목은 가져오지 않고 정류장명만 반영. 기존 상세 주소/개인정보 담당자 등 보존.
- 인물 사진 4장 + 행사사진 244장 총 248개 작업. Supabase CLI/서버 비밀키 없으므로 로그인된 로컬 관리자 세션의 정상 Supabase 업로드 권한 사용. **임시 개발 전용 `/admin/import-legacy` 페이지/액션을 생성해 일괄 이관 중. 완료 후 이 경로의 파일 2개를 반드시 삭제하고 배포/빌드할 것.** CUA 탭 `importTab`(64640361, Chrome 2)이 남은 사진 자동 등록을 진행한다. 진행 상태 UI/DB를 확인할 것. 20장 단위, 재실행 시 이미 등록된 미디어는 건너뛰며 연결은 idempotent.
- 수집 원문/사진 URL/백업은 Git 제외 `test-results/content-import/`, 사람 사진 연결 `test-results/legacy-people.json`. 임시 HTML parser는 test-results/import-tools. 비밀값 없음.
- YouTube 채널 UC1tP9iJvaJpr63dIU608WcQ의 지정 4개 재생목록 수집: 목록 1,939항목 / 고유 공개영상 1,938개(주일오전 목록 내 동일 ID 1개 중복). `scripts/collect-youtube-archive.mjs` 및 `scripts/import-youtube-archive.mjs --apply`로 기존 5개 보존, **신규 1,933개 실제 등록 완료**. APP revision/publication까지 같은 트랜잭션으로 생성. 신규 분류: 오후144/수요195/첫시간1346/오전248. 날짜는 제목의 명시 날짜 우선, 35개는 방송 시작/게시일의 KST 날짜 사용. 설명에 명시된 인용 제목·설교자·본문만 추출, 원문 제목/설명 보존(폼 길이 제한 내). 아직 최종 공개 목록 전체 검증 필요.
- 헌금: `offering.ts` 공통 계약, 관리자 기본정보 ‘헌금 계좌’ 탭, website `/offering`, app `/church-info/offering` 구현. contact API에 공개 offering 객체만 추가. Expo57 Clipboard 설치. 로컬 홈페이지/앱에서 실제 계좌·예금주 표시, 복사한 숫자 일치 검증 통과. 타입·3개 앱 lint·church API 기존 테스트4개·경계 검사 통과. **신규 코드 운영 배포는 아직 안 함.**
- 기존 대기 APK `9254606d-c800-457b-8edc-ac396d0b194d`는 추가 헌금 화면을 포함하기 위해 **CANCELED** 처리. 전체 변경 확정 후 새 APK 빌드 필요. 모니터 프로세스52206도 취소 상태 확인 후 종료. 홈페이지 QR/다운로드 `/app`은 아래 배포로 이미 운영 중이나 이전 APK 링크를 사용한다.

## 최신: 앱 주보 전체 화면·홈페이지 앱 다운로드 (2026-10-14)

- 앱 주보 PDF에 전체 화면 버튼 추가. 공통 BulletinFrame의 Modal 안에서 PDF 페이지 이동/확대/축소/닫기 및 원본 열기 제공. 모바일 안전 영역 반영, Android 뒤로가기는 onRequestClose 처리. 실제 주보 PDF를 브라우저 앱에서 열어 390px 전체 화면 크기, 확대, 닫기/Escape 검증. 네이티브 휴대폰 설치 검증은 별도 필요.
- 홈페이지 `/app` 다운로드 안내 페이지, 홈 상단 다운로드 바로가기, 공통 하단 다운로드 카드/QR 추가. Android APK와 iPhone 준비 중 안내를 명확히 구분. QR은 고정 주소 `https://daegwangchurch.kr/app`을 사용하므로 이후 APK/스토어 주소 변경에도 유지 가능. 다운로드 파일 주소는 `apps/website/src/lib/app-download.ts`에서 관리.
- QR 재생성: `node --import tsx scripts/generate-app-qr.mjs`. SVG 100px/184px에서 실제 해독 결과 일치 확인. `scripts/verify-app-download.mjs`로 앱 전체 화면과 홈페이지 다운로드 링크·320/390/1440px 배치 검사 통과. 모바일·홈페이지 타입/lint 및 경계 검사 통과. 배포 파일 651개 중 환경파일/비밀파일/테스트 산출물 0.
- Android 새 빌드 `9254606d-c800-457b-8edc-ac396d0b194d` 제출, 무료 빌드 대기 중. 완료 후 새 APK 주소를 위 상수에 반영하고 홈페이지 운영 배포 예정. 기존 운영 APK 링크는 아직 이전 빌드를 가리킴. DB 변경·관리자 변경 없음.
- 홈페이지 QR/다운로드 안내를 먼저 운영 배포 완료: `dpl_2a41jAt5pTsB2t8JGd1bV3EGgxXh`. READY·홈/주보/공지/관리자 연결/신규 `/app`·SVG 6개 HTTP 검사 후 승격. `https://daegwangchurch.kr/app`에서 실제 QR 이미지·버튼 링크 확인, 기존 APK HEAD 200(108409909 bytes). 새로운 전체 화면 APK가 완료되기 전에는 기존 정상 APK 링크를 유지 중.

## 최신: 사용성 수정본 운영 배포 (2026-10-13)

- 사용자 ‘모두 배포해줘’ 요청으로 이전 로컬 유지 지침을 변경하여 홈페이지·관리자/API 배포 및 새 Android APK 빌드 진행.
- 관리자/API `dpl_J1zbJiBsJKGciYarA5jzLDxdGtdV` READY → 로그인/공개 API/개인 기능·푸시 내부 API 인증 보호 10개 검사 통과 후 운영 승격 완료. `APP_ACCOUNT_SIMPLE_SIGNUP=true`와 서버 전용 rate salt 등록(값 미출력). 운영 가입 options에서 registration=true, 빈 약관, 교인 확인 활성 확인. Supabase 이메일 인증 해제 설정 유지. 실제 신규 계정 생성·로그인까지는 사용자 확인이 필요.
- 홈페이지 `dpl_88Jc1Yr38xWdXqyxBGU6BhYvpXVj` READY → 홈/공지/주보/관리자 연결과 라이브 API 검사 후 운영 승격 완료. 기존 daegwangchurch.kr 및 daegwangchurch.vercel.app 사용. 지도 및 주보 전체 화면 등 최근 로컬 변경 포함.
- 운영 실화면에서 로컬과 달리 기존 Kakao JS 키가 설정돼 있으나 로딩 실패하는 것을 발견. Kakao 오류/8초 타임아웃 시 OpenStreetMap 대체 지도를 표시하도록 보완. 최종 홈페이지 배포는 **`dpl_5y8m9D12dpWeE79A6Bpq5rLqV4KJ`**이며 READY·사전 HTTP 검사 후 운영 승격 완료. 실제 daegwangchurch.kr에서 지도 캔버스, 주보 전체 화면 열기/닫기, 운영 가입 옵션, 개인 API 401 검증 모두 통과(`test-results/deploy/verify-current.mjs`).
- 업로드 검사 644개 파일, 환경파일/Firebase 비밀파일/테스트 산출물 포함 0. 새 DB 마이그레이션 없음. Git 커밋·푸시는 수행하지 않음.
- Android 빌드 `8754b1fe-ba12-4881-b127-719429d2d545` 제출. 기존 preview APK/원격 서명 사용, 환경 API=https://daegwangchurch-admin.vercel.app 및 DEMO=false 확인. 빌드 완료 결과는 후속 기록 참조. 앱스토어 제출 없음.
- 위 Android 빌드 **FINISHED** 확인. [최신 APK 다운로드](https://expo.dev/artifacts/eas/_Qy9r3xKNJY85_ejeCZLQVg6LEY0wemDYZY3WpWF4_o.apk). 무료 Android 대기열 지연 후 정상 빌드 완료. 날짜 선택기·지도·주보 PDF·간단 가입·앱 홈 개선 포함. 실제 휴대폰 설치/가입/푸시 수신은 사용자 확인 전이며 완료로 간주하지 않음.

## 최신: 주보 전체 화면·날짜 선택 UI (2026-10-13)

- 홈페이지 주보 상세에 ‘전체 화면’ 버튼 추가. 화면 전체 크기의 접근 가능한 Dialog에 PDF 표시, 닫기/Escape/포커스 복원 및 원본 열기·다운로드 유지. PC 1440px·모바일 390px에서 화면 크기와 열기/닫기 확인.
- 앱 주보·묵상·기록 목록의 YYYY-MM 직접 입력을 공통 MonthPicker(연도 이동, 12개월 버튼, 전체 기간, 취소)로 변경. 말씀 필터의 시작/종료일과 기록·일정 작성 날짜는 공통 DatePicker 달력으로 변경. 임시 선택 후 확정하며 취소는 기존 값을 유지, 선택 날짜 해제 가능. 날짜 범위 검증 유지.
- 사용자가 지도가 안 보인다고 한 대상은 ‘설치한 앱 또는 배포된 홈페이지’였음. 지도 변경은 아직 로컬에만 있으므로 기존 APK/운영에는 없다고 설명. 실제 localhost 앱·홈페이지 모두 지도 캔버스 재확인. 사용자 요청대로 배포/APK 생성하지 않음.
- 홈페이지 및 모바일 타입/lint, `scripts/verify-date-and-bulletin.mjs`로 월 선택/연도 이동/취소/초기화, 날짜 선택/확정, 320px 배치, 주보 전체 화면, 로컬 지도 검증. 운영 자료 변경 없음. 브라우저 테스트는 2026-10 기준 날짜를 사용하므로 다른 시점에는 테스트 날짜를 갱신할 것.

## 최신: 로컬 사용성 수정 · APK/배포 보류 (2026-10-13 저녁)

- 후속 확인: 사용자가 Supabase 설정을 처리했다고 답한 뒤 실제 settings API에서 `mailer_autoconfirm=true`, `disable_signup=false` 확인. 이메일 인증 없이 가입 가능한 제공자 설정이 반영됐다. 로컬 앱 8081 / 계정 options API 모두 HTTP 200, `registration=true`, 빈 약관으로 필수 동의 없음 확인. 아래 기록의 Supabase 설정 차단은 해소됨. 실제 신규 계정 생성·로그인까지는 아직 미검증이며 사용자가 로컬 앱에서 확인할 차례. 이번 후속에서도 운영 배포/APK 생성 없음.

- 사용자 요청: 새 APK를 만들지 않고 npm 개발 서버에서 피드백하며 수정. 앱 가입 단순화, 첫시간 날짜/제목 강조, 스크롤 축소, 지도/주보 실제 표시, 콘텐츠별 관리자 목록, 홈페이지 정보 밀도 개선. 이번 변경은 **로컬만 반영**, 운영 배포·APK 빌드·Git 푸시는 하지 않았다.
- 개발 서버: 홈페이지 `http://localhost:3000`, 관리자/API `http://localhost:3001/admin`, 앱 `http://localhost:8081`. 앱은 로컬 API와 실제 Supabase에 연결하며 데모 모드가 아니다. 실행: 루트에서 `npm run dev:website`, `npm run dev:admin`; Bash 앱은 `EXPO_PUBLIC_API_BASE_URL=http://localhost:3001 npm run web --workspace @daegwang/mobile -- --port 8081`.
- 가입 UI를 이메일/비밀번호 2개로 축소. 교인 확인은 가입 후 MY에서 기존 실제 절차를 이용. 빈 약관은 가입을 막지 않으며 실제 동의로 저장하지 않음(프로필 동의 버전/시간/스냅샷 null). 정책 본문이 있으면 동의 검증 유지. 로컬 `APP_ACCOUNT_SIMPLE_SIGNUP=true` 및 비공개 rate-limit salt 설정. OTP 복구 설정과 분리. 즉시 가입 세션은 서버에서 정리한 후 로그인 화면으로 안내.
- **실제 무인증 가입은 아직 미완료:** Supabase 공개 settings 조회는 `mailer_autoconfirm=false`, `disable_signup=false`. 사용자가 ‘수정해’라고 승인했지만 Computer Use가 Windows 브라우저 URL을 검증하지 못해 종료됐고 Supabase 관리 토큰/CLI 연결도 없다. Supabase → Authentication → Sign In / Providers → Email → Confirm email OFF 저장이 필요하다. 서버는 이 설정이 켜져 있으면 신규 미인증 계정을 생성하기 전에 503으로 중지한다. 설정 변경 완료/실제 가입 성공으로 보고하지 말 것. 서버 설정 변경 시 코드 수정 없이 다음 가입 요청에 반영됨.
- 앱 홈: 첫시간 날짜·오늘/최근 묵상 표시, 설교 제목 강조, 16:9 썸네일, 말씀 CTA, 주보/설교/기도/기록 2×2 바로가기, 소식·지도 간결한 행. 390×844에서 주요 메뉴가 첫 화면 안에 표시됨. 320px 가로 넘침 없음.
- 앱 지도: 기존 안내문만 있던 화면에 OpenStreetMap embed 실제 지도/마커 추가. 홈페이지는 Kakao key 없는 경우 같은 지도 fallback. 기존 CMS 좌표를 이용하고 주소·좌표를 임의 수정하지 않음. 실제 지도 캔버스와 타일 시각 확인 완료. OSM은 현재 MapLibre 사용으로 검증 선택자를 `#map canvas`로 사용.
- 주보: Android/iOS WebView 및 브라우저 iframe에서 PDF.js 5.4.624 렌더러 사용(공개 CDN). 페이지 전환·확대/축소·실패 안내, 원본 링크 유지. 현재 공개 PDF 실제 2페이지 로딩/확대 검증. 휴대폰에서 새 버전 실행은 아직 미검증. 목록은 포커스 시/열려 있는 동안 30초 갱신, 수동 새로고침 추가. 임시저장은 공개되지 않는다는 설명을 관리자 상태 선택에 명시. 기존 비공개 자료를 임의 공개하지 않음.
- 관리자 공지/일정/앨범/주보: 공통 공개상태·분류·날짜/제목 정렬, 월 필터(일정/앨범/주보), 초기화/표시건수. 공지 고정 우선, 일정 날짜/시간/장소, 앨범 썸네일 그리드·사진수, 주보 예배일·PDF 링크. 검색은 기존 서버 검색, 필터는 가져온 최대 100건 내이며 화면에 ‘불러온 N개’로 명시. 날짜는 Asia/Seoul. 기존 수정·삭제 확인·권한·미저장 보호 유지.
- 홈페이지: 상단 이미지와 섹션/제목/본문 여백 축소, 첫시간/주보/교회소식/오시는길 바로가기. 기존 콘텐츠/사진과 의미 있는 구분 유지. 검증 시 홈 전체 높이 1440px 폭 2771px, 390px 폭 3725px. 최종 디자인 평가는 사용자 피드백으로 이어갈 것.
- 검증: 전체 type-check/lint, import 경계, diff whitespace 검사 통과. 가입/주보 테스트 8개 통과. `scripts/verify-local-review.mjs` 실제 공개 API로 앱 홈/지도/PDF/홈페이지/관리자 로그인 보호 검사; 가입 완료 화면은 테스트 응답 대체로 확인(실제 회원 생성 0건). 관리자 가상 자료 로컬 임시 페이지에서 필터·정렬·초기화 및 1440/390/320px 검사 후 임시 페이지 삭제. 이미지 결과 `apps/mobile/test-results/local-review`(Git 제외). 실제 관리자의 로그인 세션을 가져오거나 운영 게시물을 수정하지 않았다.

## 최신: 전체 운영 반영 및 새 Android APK (2026-10-13)

- 사용자 ‘모두 배포하고 앱도 만들어줘’ 요청. 홈페이지 최신 소스 배포 `dpl_8zPvQdfAj1LsuG42X76Sa8WpAhGf` READY, 홈/공지/주보/관리자 연결 검사 후 운영 승격. daegwangchurch.kr 및 daegwangchurch.vercel.app HTTP 200 확인.
- 관리자/API는 최신 `dpl_Cr3UANt4PUgGhGMxUJje4bxUsNxh`가 운영 대상임을 재확인. 관리자 로그인과 공동기도 API HTTP 200. 이전 관리자 사용성·상담 설정·공동기도 수정 포함.
- 모바일 타입/lint 통과 후 기존 preview APK 프로필, Expo 원격 Android 서명으로 신규 빌드 `ca200a3e-1e94-46cb-ac2d-928860185534` FINISHED. [새 APK 다운로드](https://expo.dev/artifacts/eas/6vdtiF7HGgZNREZ7cPPOsdrLWRKehL_wK-dhOKXc1AE.apk). 앱스토어 제출은 하지 않았으며 실제 휴대폰 설치·푸시 수신 확인은 사용자가 나중에 진행한다.

## 최신: 관리자 게시물 동선·상담/심방 직접 설정 (2026-10-13)

- 사용자 추가 요청: 관리자 로고는 관리 홈으로, 목록/등록/수정/삭제를 편리하게, 상담·심방을 관리자에서 확인하고 담당자/보관 기간도 직접 조절. 웹·앱 기능이 애매하게 중단된 곳도 점검.
- 좌측 대광교회 로고 → `/admin/dashboard`. 편집 화면 공통 ‘목록으로/새로 등록’, 주요 5종(말씀·공지·주보·일정·앨범) 하단 저장/목록 버튼, 6종 목록의 텍스트 ‘수정’ 버튼, 삭제 중 중복 클릭 방지. 기존 삭제 확인과 미저장 이동 방지 유지.
- 상담·심방 메뉴는 비활성 상태여도 숨기지 않음. 최고관리자는 `/admin/care`에서 접수 여부·활성 담당자·보관 일수·전달 동의 안내를 설정. 최고관리자라도 담당자로 지정되지 않으면 요청 내용 열람 불가. 처리할 요청/상태/이름·연락처 검색 및 상세 펼침, 가능한 다음 상태만 선택. 관리 홈에 담당자의 미처리 건수 표시.
- `20261013010000_care_settings` 운영 적용 완료(총 15개). 설정은 별도 비공개 `care_settings` 테이블, anon/authenticated 권한 차단. 환경 변수 정책은 DB 설정이 없을 때만 이전 버전 호환용으로 읽는다. 정책 저장마다 버전 갱신, 앱의 오래된 동의 요청은 거절. 접수 중지 후에도 기존 요청 조회/취소/담당 처리 유지.
- 만료일은 접수 시 확정하며 설정 변경으로 소급 연장하지 않음. `daegwang-care-expiry` cron 5분 주기로 만료 요청만 정리하도록 등록. 등록 당시 운영 요청 전체 0/만료 0건. scripts/supabase-care-expiry.sql에 재현 SQL 기록. maintain-member-data도 접수 중지와 무관하게 만료 요청 정리.
- 관리 도구 하단 접기 영역에서 기능별 서버 설정 상태/조치 경로 확인. 독립적인 앱 운영 게시판을 다시 만들지 않았다. 운영 조회 결과 말씀·공지·주보·일정·모임 API HTTP 200. 이메일 신규 가입/복구/탈퇴와 구글·카카오 가입은 외부 이메일/인증/탈퇴 운영 연결이 미완료라 여전히 비활성. 설정만 억지로 켜지 않음.
- 격리 PostgreSQL 통합 테스트 50개 통과: 설정 권한·실제 접수·담당자 접근·중지 후 기존 요청 처리·RLS 포함. 관리자 type/lint, 공유 타입 검사, import 경계 검사 통과. UI는 1440/390/320px에서 로고 링크·상담 메뉴·저장/목록·미저장 확인 검증, 스크린샷 확인. 실제 데이터 제출 없는 localhost 전용 임시 검사 페이지는 삭제.
- 추가 운영 점검: 공동기도 API가 별도 APP_PUBLIC_PRAYERS_ENABLED 때문에 503이었다. 공지 CMS의 공개 분류이므로 APP_PUBLIC_NOTICES_ENABLED로 통합하고 예제/문서를 수정. 카테고리 우회 방지 포함 공지 테스트 5개 통과, 로컬 실제 DB 공동기도 API 200 확인. 교회 연락처·예배 시간은 200, 교회소개·새가족교육·담임목사 소개는 현재 공개 자료가 없어 404. 임의로 소개 내용이나 개인정보를 생성·공개하지 않았다.
- 운영 관리자 최종 배포 `dpl_Cr3UANt4PUgGhGMxUJje4bxUsNxh` READY, 로그인/공개 API/인증 보호 10개 및 공동기도 200 확인 후 운영 승격 완료. 직전 `dpl_3crXnRatPTPcyfA9AXV76knxxm4Y` 및 이전 메뉴 개편 `dpl_4sUVEXv3iNKMuTMMN43ZpaxXzH1x`는 단독 승격하지 않고 이번 배포에 함께 포함. 만료 정리 cron 최초 자동 실행 succeeded 확인. 상담 접수는 관리자가 실제 담당자/기간을 선택해 저장하고 활성화하면 열린다.
- 휴대폰 검증은 사용자 요청으로 나중에 진행. 이번 서버 설정은 기존 APK에도 적용되며 새 APK는 불필요. Git 커밋/푸시는 아직 하지 않음.

## 최신: 관리자 사용성 개편 (2026-10-13)

- 사용자가 관리자 메뉴와 설정 화면이 길게 늘어진다고 지적하여 탐색 구조를 개편했다. 기본 메뉴는 관리 홈 + 말씀·주보 / 교회 소식 / 교인·모임 / 교회·설정 네 업무 묶음. 한 묶음만 열리고 현재 페이지의 묶음이 자동으로 열린다. 모바일과 PC의 접힘 상태는 서로 간섭하지 않도록 고유 details 그룹 ID를 사용한다. 최고관리자 전용 항목과 기능 플래그를 메뉴에도 적용했다.
- 관리 설정은 ‘관리 도구’로 정리하여 교회 정보·교인과 모임·운영 도구의 짧은 행 목록과 메뉴 검색을 제공한다. 교회 안내도 예배와 첫 방문·교회 소개·사람과 사역·홈페이지 구성으로 묶고 검색을 추가했다. 기존 URL과 기능은 유지한다.
- 모임 관리는 공지 / 소속 회원 / 모임·담당자 탭과 모임 선택으로 분리. 공지 쓰기·공지 수정·소속 변경·모임 수정·담당자 지정 폼을 필요한 때 펼친다. 회원 목록에는 교인 확인 이름을 우선 표시한다. 회원·교인 확인은 확인 요청 / 승인 교인 / 전체 회원 분류 및 검색, 개인별 접기 폼으로 정리했다.
- 교회 기본 정보는 기본 / 주소·연락처 / 채널·담당자 전환 및 하단 저장 버튼으로 변경. 모든 필드는 유지한 채 화면만 전환하므로 입력/저장 값 유실 없음. 서버 검증 오류 발생 시 해당 항목을 표시하고, 휴대폰 저장 바는 한 줄 버튼으로 축소했다.
- 관리자 타입/lint 통과. localhost 한정 임시 검사 페이지에서 실제 컴포넌트의 PC/모바일 메뉴, 단일 섹션 열기, 검색, 탭 입력 유지, 390/320px 넘침 없음 검사·스크린샷 시각 확인 완료. 최초 테스트가 sr-only 텍스트를 클릭해 실패하여 실제 summary 버튼 대상으로 보정 후 통과. 임시 검사 페이지는 삭제했고 일반 로컬 서버 재시작 완료. 실제 자료 저장 없음.
- 운영 배포 dpl_4sUVEXv3iNKMuTMMN43ZpaxXzH1x 제출, 최종 승격 결과는 후속 기록 참조. 사용자에게 실제 운영 메뉴·제목 입력 정상 확인을 받았던 것은 직전 모임 활성화 배포이며 이번 개편의 실사용 확인과 구분한다.
- 앞선 Android 빌드 86e755bc-efe3-465f-b76e-fd44f135a7db FINISHED. [APK 다운로드](https://expo.dev/artifacts/eas/qVju5PDSz-We5bcBhVNmNRqfdjsM3uRw8ydwG9EBeb0.apk), HTTP 200 / 110663177 bytes 확인. 교인 확인·모임 푸시·말씀 로딩 개선 포함. 사용자는 휴대폰 확인은 나중에 한다고 답했으며 실제 푸시 수신 성공으로 기록하지 않는다. 서버 cron 5분 자동 HTTP 200 확인은 완료. 이 관리자 UI 변경은 APK 재빌드가 필요 없다.

## 최신: 모임 공지·푸시 활성화와 예배 제목 통합 (2026-10-13)

- 사용자 ‘모두 진행’에 따라 APP_GROUPS_ENABLED=true를 로컬 및 Vercel preview/production에 적용했다. 관리 설정 → 모임·소속 관리 메뉴 노출, 운영 /api/v1/groups HTTP 200 확인. 브라우저 앱은 실제 DB 로컬 API를 계속 사용한다.
- 소속 공지 푸시는 GroupPreference.notifications를 명시적으로 켜고 저장한 회원만 대상이다. MEMBERS는 현재 승인된 소속, PUBLIC은 관심 모임 또는 승인된 소속에 전달. 소속 승인·수신 설정 저장 이전 공지 제외, 동일 공지 ID 재발송 방지, 24시간 만료, 22~08시 보류, 기존 일반 소식과 기기당 하루 합산 5회 제한. 소속 해제·비공개·비활성·수신 거절을 발송 직전에 재검사한다. 모임 설정 변경 시 기준 시각도 갱신되어 설정 저장 이후의 공지만 대상이 된다.
- 알림 target에 groups 추가, 인증된 알림 상세에서 현재 접근 권한 재검사, 앱 관련 내용 버튼은 해당 공지를 모임 페이지에 표시한다. 잠금 화면에는 기존 일반 문구·불투명 알림 ID만 보내며 소속명·공지 내용은 보내지 않는다. 관심만으로 소속 전용 공지 열람/푸시 불가.
- 운영 Supabase에 pg_cron/pg_net 설치, Vault에 daegwang_push_url/daegwang_push_secret 구성. 난수 키는 관리자 로컬 환경/Vercel sensitive/Vault만 저장했고 출력·Git·앱 포함 없음. 운영 push 플래그 true, preview 발송 false. 작업 API 인증 호출 HTTP 200, 기기 0/발송 0 확인 후 daegwang-push job 1을 */5 * * * *로 등록. 2026-10-13 00:35 KST 첫 자동 실행 succeeded 및 HTTP 200/timeout false 확인. 실제 휴대폰 수신은 후속 확인.
- 관리자 배포 dpl_68YKPc8qT2Sx5dBWmN5miaJNTL2b READY, 기존 로그인/공개 API/보호 경로 10개 검증 후 운영 승격. 신규 가입/카카오 설정 상태는 그대로이며 운영 CORS는 변경하지 않았다.
- 추가 요청: 예배 콘텐츠의 title은 실제 웹/앱 표시, sermonTitle은 별도 화면 표시가 없어 관리자 입력을 제목 하나로 통일했다. 폼 저장 시 두 필드에 같은 제목을 전달해 이전 계약 호환 유지. 기존 두 제목이 다르면 이전 별도 설교제목을 수정 화면 참고 안내로 보여주며, 관리자가 저장하기 전 기존 DB 값을 일괄 덮어쓰지 않는다.
- 검증: 관리자·모바일 타입/lint, 경계, npm test, 격리 PostgreSQL 통합 49개(소속 해제/수신 거절/비공개/중복/공개 관심/전역 알림 설정 미존재 포함) 통과. 실제 모임 페이지 390/320px 넘침 없음.
- Android 빌드 86e755bc-efe3-465f-b76e-fd44f135a7db 제출. 앱 환경은 기존 EAS preview의 HTTPS 운영 API이며 로컬 주소를 빌드에 넣지 않았다. 업로드 사전 검사 657파일, 서버 환경/비밀키 제외. 완료 URL과 수신 검증은 후속 기록 참조. 아직 Git 커밋/푸시하지 않았다.

## 최신: 교인 확인 실제 연결 및 브라우저 앱 (2026-10-13)

- 사용자는 가상 미리보기가 아닌 실제 계정·실제 DB 사용을 요구했다. 운영 DB 변경·배포를 명시 승인했으며 `20261012090000_church_membership`, `20261012100000_church_contact` 적용 완료(총 14 migration). 기존 데이터 삭제/seed 없음.
- Vercel 관리자 preview/production에 APP_CHURCH_MEMBERSHIP_ENABLED=true 등록. 배포 `dpl_2hjHCvirdcv1LjsXL1QcXJivxxfv` READY, 로그인/공개 API/비인증 차단 10개 검사 통과 후 운영 승격 완료. 운영 options 교인 확인 true, 신규 가입 false; 교인 API 비인증 401 확인.
- 자동 승인 검토가 운영 API에 localhost CORS 영구 허용을 차단하여 해당 설정은 변경하지 않았다. 대신 기존 localhost 허용을 사용하는 로컬 관리자/API(3001)가 실제 운영 DB·Supabase에 연결되고, 브라우저 앱(8081)은 이 로컬 API를 사용한다. 이는 데모가 아니며 요청은 실제 운영 관리자에서도 보인다.
- 실행: 루트 Bash 터미널 1 `npm run dev:admin`, 터미널 2 `EXPO_PUBLIC_API_BASE_URL=http://localhost:3001 npm run web --workspace @daegwang/mobile -- --port 8081 --max-workers 2`. 로컬 관리자 .env.local에 교인 플래그 true 저장. 모바일 .env.local의 운영 API 주소는 유지하여 APK에 로컬 주소가 들어가지 않도록 했다.
- 사용자가 실제 기존 계정으로 요청 후 ‘교인 확인 요청 중’ 표시를 확인했다. 운영 관리자 /admin/members에서 승인·소속 지정 후 앱 화면 재진입까지 수행하고 ‘관리자 승인·앱 표시 모두 정상’이라고 확인했다. 실제 요청 → 운영 관리자 승인 → 앱 승인 상태·소속 표시의 사용자 검증 완료.
- 브라우저 실로그인 화면/데모 버튼 없음, 로컬 options 200/교인 true, OPTIONS 204 및 허용 origin, 비인증 401 확인. 앱 타입/lint 통과. 신규 가입은 메일·탈퇴 운영 준비 전이라 false 유지, 카카오 설정 보류. 새 APK 생성·Git 커밋/푸시 없음.

## 최신: 가입·마이 교인 요청 및 말씀 로딩 개선 (2026-10-12)

- 사용자 확정: 가입 또는 마이페이지에서 본인이 교인임을 체크하면 관리자가 확인 요청을 받고, 승인하면서 소속을 지정한다. 확인용 이름·연락처·직분을 수집한다. 카카오 콘솔 진행은 사용자가 설정한 뒤 재개하며 현재 중단 상태다(앱 생성은 완료, 이메일 동의 권한 없음 확인).
- 이메일/SNS 가입에 선택 churchRequest 입력 연결. 체크하지 않으면 연락처·직분을 전송하지 않는다. 가입 체크 시 인증 완료 후 PENDING 저장, 마이 → 교인 확인 및 소속에서는 정보 입력 후 체크 즉시 요청. 부족한 정보는 전송 전 안내. 직분 없는 청소년 등은 ‘없음’ 입력 가능. 입력 연락처는 SMS 인증된 번호가 아니며 관리자가 실제 본인 여부를 확인해야 한다.
- 관리자 목록에서 이름·연락처·직분 확인, 활성 소속 복수 선택 후 승인과 소속 upsert를 동일 transaction에서 처리한다. 비활성/없는 소속이면 승인도 실패한다. 개인 기록은 미노출, 일반 회원 이용은 유지. 확인 해제는 모든 모임 소속도 해제하며 UI에 명시했다(이전 독립 해제 정책을 대체). 회원 화면에서 승인 상태와 소속 이름 확인 가능. 새 migration 20261012100000_church_contact 추가, 운영 미적용.
- 말씀 로딩: 앱 시작 시 첫시간/주일설교 선조회, 데이터 준비 대기는 최대 1.8초이며 폰트 준비와 병렬. 느리면 홈·목록에 skeleton으로 콘텐츠 공간 표시. 공개 말씀 목록만 60초·최대 20개 메모리 캐시/동일 요청 합치기. 탭 복귀·재조회에서 기존 목록을 지우지 않으며 필터 변경은 분리, 수동 새로고침은 캐시 우회. 개인 데이터·라이브 상태는 이 캐시에 넣지 않는다. 앱 재시작까지 유지되는 디스크 캐시는 추가하지 않았다.
- 검증: 타입 검사 통과, 모바일 lint 통과. 가상 API 브라우저 390/320px에서 SNS 동의·이메일 로그인·마이 교인 자동 요청·대기 상태, 느린 응답에서 로딩 자리 표시·탭 왕복 중복조회/초기화 없음 확인. 첫 로딩 테스트는 실제 탭 label의 ‘탭’ 접미사를 빠뜨려 실패 후 수정 통과. 최종 단위 14개·격리 PostgreSQL 통합 47개 모두 통과. 모바일·관리자 타입/lint, 워크스페이스 경계 검사 통과. 운영 DB는 테스트에 사용하지 않았다.
- 이 수정은 아직 로컬 코드이며 운영 migration·배포·신규 APK 빌드 전이다. 기존 배포 APK에 새 UI가 있는 것으로 안내하지 않는다. 약관에는 선택 교인 확인의 수집 목적/항목/보관·삭제 기준 반영 후 개통한다.

## 최신: 구글·카카오 가입 및 교인 확인 구현 (2026-10-12)

- 사용자 요청: 구글·카카오 가입을 추가하고 앱 가입자와 실제 교인을 구분. 카카오 개발자 계정만 있고 대광교회용 앱은 아직 없다. 기존 코드는 모임 소속 승인만 있고 교인 상태는 없었다.
- 교인 확인을 UNCONFIRMED/PENDING/CONFIRMED로 분리. 앱 계정관리에서 이름/전달 동의 후 요청, 관리 설정 → 회원·교인 확인에서 최고관리자 승인·해제. 일반 회원의 개인 기록 이용은 그대로이며 교인 상태로 관리자/모임 권한을 자동 부여하지 않는다. 버전 충돌·탈퇴 잠금·감사 기록·RLS·프로필 삭제 cascade를 포함했다.
- 구글·카카오 버튼/약관 동의/외부 브라우저/PKCE S256/앱 callback/서버 동의 저장 구현. SNS 전용 계정의 탈퇴는 이메일 OTP 재인증 추가. 현재 이메일을 제공하지 않는 SNS 계정은 가입 완료 불가. 로그인 세션은 여전히 메모리 한정이다. 이전 대화에서 자동 갱신으로 유지된다는 설명은 코드와 달라 사용자에게 정정했다.
- 운영 미반영: migration 파일만 작성, 운영 flag/Google·Kakao 콘솔/Supabase provider 변경·새 APK 빌드·배포 없음. 두 SNS 버튼은 서버 준비 조건이 충족될 때만 표시한다. 준비 중인 기능을 작동하는 것처럼 노출하지 않는다. [설정·권한·실기기 확인 절차](social-login-and-membership.md).
- 검증: 격리 PostgreSQL migration 및 기존 기능 포함 통합 테스트 46개, OAuth callback·설정 gate·가입/탈퇴 어댑터 테스트 12개, 관리자/모바일 타입 및 lint, 경계 검사 통과. 로컬 가상 API 브라우저에서 SNS 필수 동의 전후 버튼 상태·390/320px 넘침 없음·기존 이메일 로그인·교인 요청 후 대기 상태 확인. 최초 mobile 타입 검사에서 transport 리소스 허용 목록 누락을 보완했고 lint는 Windows 경로 읽기 권한으로 실패한 뒤 권한을 갖춰 재실행 통과했다. 실제 제공자 로그인·메일 수신은 미검증.

## 최신: 앱 홈에도 공통 라이브 연결 (2026-10-11)

- 사용자가 홈페이지 미리보기를 승인하고 운영 배포·앱 적용을 요청했다. 홈페이지 운영 /api/live HTTP 200 offline 확인(39aff1f 배포). 현재 실제 방송은 없다.
- 앱 홈 인사말보다 앞에 라이브 카드·영상·외부 YouTube 버튼을 배치했다. API 키 없이 공개 EXPO_PUBLIC_WEBSITE_URL=https://daegwangchurch.kr만 로컬과 EAS preview에 등록했다. 홈페이지 /api/live 결과를 공유해 모바일 사용자가 늘어도 별도 Google 조회를 만들지 않는다. 비인증 공개 상태 API에만 CORS *를 추가했다.
- 앱은 홈이 보이고 앱이 활성일 때 1분 갱신, 화면 복귀 시 즉시 갱신한다. 홈 이탈/백그라운드에서는 요청을 취소하고 플레이어를 내린다. 오류/종료/3분 넘은 상태는 숨긴다. 계약 형식을 Zod로 검증하며 회원 인증정보를 전송하지 않는다.
- 검증: 서버/클라이언트 테스트 총 6개, 모바일 타입·린트, 홈페이지 운영 빌드, 패키지 경계 통과. 가상 API로 앱 390/320px 라이브·외부 시청·방송 없음 화면 확인. 최초 화면 검증은 새 환경변수 미반영·테스트 CORS 설정 누락으로 실패했으며 Metro 재시작 및 실제 응답 형태를 맞춘 뒤 통과했다. 네이티브 영상 재생은 새 APK 설치 후 실제 휴대폰 확인이 필요하다.
- 홈페이지 6cdf2e4 운영 배포 dpl_BWkKkbkkaew4HoR2cMLPQiLZBUei READY 확인. 실제 daegwangchurch.kr 홈과 /api/live 모두 HTTP 200, 라이브 상태 offline, 공개 API CORS * 확인.
- 새 APK는 이전 영상/썸네일·가입 안내·투명 아이콘 수정과 이번 라이브 기능을 모두 포함한다. 빌드 ID 8e43197a-c2dc-4270-adeb-7c1cba2c87bb, https://expo.dev/accounts/gyulsangjabox/projects/daegwang-church/builds/8e43197a-c2dc-4270-adeb-7c1cba2c87bb . 소스 6cdf2e4, 기존 서명키 사용. EAS FINISHED 및 다운로드 HEAD HTTP 200(110,535,542바이트) 확인. [최신 APK 다운로드](https://expo.dev/artifacts/eas/pojAGeMGC2QyfL5G8-iz79hRs3jZMC4x5fxnrCRRk-g.apk). 푸시 발송은 계속 별도 미완료·비활성이다.
- 추가 브라우저 검증: 홈에서 말씀 탭으로 이동하면 라이브 플레이어가 제거되고, 홈 복귀 시 다시 조회하며, 가상 시간 60초 뒤 방송 종료 응답이면 카드가 자동으로 숨겨지는 것을 확인했다. 다음 확인은 실제 Android에 최신 APK 업데이트 설치 후 영상 재생과 다음 예배의 실제 라이브 노출·종료 전환이다. 앱용 YouTube API 키를 추가할 필요는 없다.

## 최신: 홈페이지 자동 라이브 영역 (2026-10-11)

- 사용자 요청으로 홈페이지 홈 최상단에 방송 중인 교회 라이브를 우선 표시하는 기능을 구현했다. 방송 없음/설정 없음/조회 실패 시 기존 홈을 유지한다. 기존 통합 관리자 교회 설정의 youtubeUrl을 사용하며 별도 등록 게시판을 만들지 않았다.
- 홈페이지 /api/live는 서버 전용 YOUTUBE_DATA_API_KEY가 있을 때만 공식 API를 호출한다. 사용자가 Google Cloud 키를 발급해 apps/website/.env.local에 저장했고 실제 channels/search/videos HTTP 200 확인. 채널 ID UC1tP9iJvaJpr63dIU608WcQ, 이름 ‘서울 독산동 대광교회(고신)’ 일치. 현재 라이브/예정 방송은 0건이었다. 로컬 통합 /api/live도 HTTP 200 offline을 반환했다. Vercel 홈페이지 preview/production에 sensitive 서버 변수로 등록했으며 키 값은 Git/로그/채팅에 출력하지 않았다.
- 채널 해석 1시간, 최신 업로드 후보 2분, 검색 후보 30분, 영상의 실제 라이브 상태 1분 캐시. 공개·같은 채널·actualStartTime 있음·actualEndTime 없음·liveBroadcastContent=live를 모두 요구한다. 최근 후보에 없는 새 방송은 검색 보완까지 최대 약 30분+캐시 갱신 지연이 있을 수 있다. API 데이터 반영 지연도 있으므로 즉시 탐지를 보장하지 않는다. 조회는 방문 시 동작하며 별도 유료 크론 없음. 검색은 지속 사용 시 약 48회/일이며 실제 무료 한도는 Google Cloud에서 확인한다.
- 브라우저도 1분 간격/다시 보일 때 상태를 확인한다. 3분 초과 오래된 상태는 숨긴다. 클릭 전 썸네일, 클릭 후 유튜브 플레이어, 임베드 금지 시 외부 링크. 가상 라이브로 1440/390/320px 최상단 배치·넘침 없음·재생 전환·미방송/실패 숨김을 확인했다. 서버 판별 테스트 3개·타입 포함 운영 빌드·경계 검증 통과. 최종 배포 상태는 작업 응답을 확인한다.
- 코드 4e13e36의 첫 미리보기는 READY 및 홈/공지/주보/관리자 연결 검증 통과 후 main에 반영했다. 키 연결 후 미리보기 dpl_J4u6suTM1faUchaCpvoLaFop6TLu도 READY 및 /api/live HTTP 200 offline 검증 통과. 이 기록을 main에 반영해 새 서버 키를 포함한 운영 재배포를 진행한다. 최종 운영 READY/API 확인은 작업 응답을 따른다. 향후 앱은 공통 LiveStatus 계약과 동일 판별기를 활용한다. 실제 방송 중 홈 노출/종료 전환은 다음 예배 때 실서비스에서 재확인한다(로컬 가상 응답에서는 자동 표시·숨김 검증 완료).
- 사용자가 화면을 먼저 보고 싶다고 요청해 로컬 Playwright 응답에서만 라이브 상태를 가정하고 실제 공개 유튜브 제목/썸네일을 사용한 PC·모바일 미리보기를 보여줬다. 실제 홈페이지/유튜브 방송 상태를 가짜 라이브로 바꾸지 않았다. 미리보기 스크린샷은 ignored test-results/home-live/preview-1440.png, preview-390.png에 있다.
- 앞선 수정 APK도 FINISHED: https://expo.dev/artifacts/eas/DEdghQbAcsDPKpx038qRNiZMLWlC83AzSDhrcVO5qUA.apk . 기존 로그인은 사용자 확인 완료, 수정본 유튜브 재생은 휴대폰 재확인 전이다.

## 최신: Android 실사용 피드백 수정 (2026-10-11)

- 사용자가 첫 APK 설치 후 기존 계정 로그인이 정상이라고 확인했다. 영상/썸네일 미표시, 가입 약관 체크 불가, 홈 기도 아이콘의 흰 배경을 보고했다.
- 운영 공개 account/options를 확인하니 registration=false, policy=null이었다. 의도된 가입 제한을 유지하며 가입 준비 중에는 입력/동의 폼 대신 비회원 이용·기존 로그인 동선을 먼저 표시하도록 수정했다. 운영 약관이나 가입 플래그를 임의로 활성화하지 않았다.
- 네이티브 유튜브가 식별 Referer 없이 embed URL을 직접 로드하던 부분을 앱 ID 기반 HTTPS baseUrl의 HTML/IFrame API로 변경했다. Google 공식 WebView 식별 기준에 따른 수정이며 실제 기기 오류 코드가 수집되지 않았으므로 원인을 확정하거나 재생 성공을 단정하지 않는다. 썸네일은 WebView와 독립적으로 표시하며, 플레이어 오류/20초 준비 시간 초과 시 썸네일·재시도와 기존 외부 유튜브 동선을 제공한다. 설교/묵상 목록에도 16:9 썸네일을 추가했다.
- 홈 바로가기의 배경 포함 Figma PNG를 기존 투명 tab-icons 원본으로 교체했다. 새 이미지 생성이나 종전 원본 삭제는 하지 않았다.
- 검증: 모바일 타입/린트와 패키지 경계 통과. 로컬 가상 API+Edge에서 가입 비활성 시 입력/체크박스 없음, 약관이 제공될 때 두 체크박스 동작 및 다음 버튼 활성화 확인. 홈 스크린샷으로 기도 아이콘 투명 배경 확인. 실제 Android 유튜브 재생은 수정 APK 재설치 후 사용자 확인이 필요하다.
- 수정 APK: https://expo.dev/accounts/gyulsangjabox/projects/daegwang-church/builds/f6882e16-a34c-4b1c-a47e-25d5a2c8ab51 (소스 399c95a). 기존 서명키로 빌드 요청했으며 최종 상태는 EAS를 확인한다. 이전 APK 링크는 수정 전 버전이다. 실제 푸시는 계속 비활성이다. 운영 공개 말씀 2건의 mqdefault 썸네일 HTTP 200도 확인했다.

## 최신: Android 내부 설치 APK 빌드 완료 (2026-10-10)

- 사용자가 다음 단계를 요청해 실제 Android 설치 확인으로 진행했다. 기존 Expo gyulsangjabox 인증·프로젝트를 그대로 사용했다. 계정/프로젝트를 다시 만들지 않았다.
- EAS preview 환경에 앱 전용 EXPO_PUBLIC_API_BASE_URL(운영 관리자 HTTPS), Supabase 공개 URL/키, EAS 프로젝트 UUID, EXPO_PUBLIC_DEMO_MODE=false를 등록했다. GOOGLE_SERVICES_JSON은 Firebase 클라이언트 파일을 secret/file 변수로 등록했다. Firebase 서비스 계정·서버 DB/비밀키는 업로드하지 않았다.
- eas.json preview에 environment=preview를 명시했다. 원격 Android versionCode 1 초기화와 Expo 서버의 신규 앱 서명 keystore 생성이 완료됐다. 기존 FCM V1 자격을 유지한다. 스토어 게시·유료 플랜 변경은 하지 않았다.
- 업로드 전 build:inspect archive로 620개 파일을 확인했다. 실제 환경 파일/키 파일 없음. 내용 검사에 잡힌 2개는 격리 테스트 DB URL을 런타임에 조합하는 테스트 스크립트였으며 실제 접속정보가 아니다. 6.4MB 아카이브 업로드 완료. 로컬 타입/lint 통과.
- 빌드 ID: 2ec937ae-0a04-4b14-b8af-ec92c4f250f6. https://expo.dev/accounts/gyulsangjabox/projects/daegwang-church/builds/2ec937ae-0a04-4b14-b8af-ec92c4f250f6 . EAS FINISHED와 APK 다운로드 HEAD HTTP 200(110,527,046바이트)을 확인했다. [APK 설치 파일](https://expo.dev/artifacts/eas/S24zpFfGfo1QDnz24_0ynTmGV9slyEvHAJInDCUtDEY.apk). 실제 휴대폰 설치·로그인·푸시 수신은 아직 사용자 확인 전이다.
- 푸시 후속 읽기 점검: Supabase Vault 설치됨, pg_cron/pg_net 미설치. 작업 비밀값도 아직 없으며 APP_PUSH_ENABLED/APP_PUSH_WORKER_READY는 비활성 유지. 이번 작업에서는 운영 DB 스키마/크론/실제 알림 발송을 변경하지 않았다.
- 다음: APK 설치 → 공개 말씀/주보/공지·기존 계정 로그인 확인 → 서버 작업 비밀값·주기 작업 연결 → 본인 기기 등록/수신 동의·종료 상태 푸시 수신 확인. 등록 API는 서버 준비 전 setup을 표시하므로 APK 빌드 완료를 푸시 수신 성공으로 보고하지 않는다.

## 최신: 관리자 교회 안내 렌더링 오류 수정 (2026-10-10)

- 사용자 보고: 관리자 ‘교회 안내’에서 This page couldn’t load 서버 오류. 정적 안내 페이지를 개발 전용 경로에서 직접 렌더링해 HTTP 500 및 Functions cannot be passed directly / Client Component 오류를 재현했다.
- 원인: Server Component에서 MUI Paper의 component 속성에 Next Link 함수를 전달했다. Paper를 제거하고 스타일을 적용한 Next Link 자체로 8개 안내 카드를 구성해 직렬화 경계 오류를 해결했다. 앱·홈페이지의 동일 패턴 검색에서 이 페이지만 발견했다. DB·회원·인증 설정 변경 없음.
- 회귀 검증: 개발 전용 /preview/church-guide에서 실제 AdminPagesPage를 렌더링한다. localhost:3001·development·ADMIN_DEMO_MODE 조건을 모두 요구하며 개인 자료는 조회하지 않는다. 운영에서는 404다. node scripts/verify-admin-guide.mjs로 HTTP 200, 링크 8개, 1440/390/320px 표시·넘침 없음, 교회소개 링크 클릭 후 비로그인 보호까지 확인했다. 수정 전 500→수정 후 200을 검증했다.
- 수정본 관리자 빌드/타입·lint 및 회귀 브라우저 검사 후 main 운영 배포로 반영한다. 마지막 배포 상태는 해당 main 커밋의 Vercel READY와 최종 작업 응답을 확인한다.

## 최신: 홈페이지 영상 썸네일 비율 정리 (2026-10-09)

- 사용자 요청에 따라 유튜브 썸네일을 화면 크기에 관계없이 16:9로 유지한다. 예배 목록 대표 카드의 lg:aspect-auto/최소 높이 28rem을 제거하고, 설명이 길어져도 이미지가 늘어나지 않도록 self-center로 분리했다.
- 대표/목록/메인 썸네일은 object-contain으로 원본 전체를 표시한다. 메인 링크는 width 100%·flex-shrink 0을 적용하고 확대 hover 효과를 제거해 이미지 속 글자가 잘리지 않게 했다. 16:9가 아닌 원본에는 검은 여백이 생길 수 있다. 사진 앨범·인물 사진의 비율은 유지한다.
- 검증: 홈페이지 production build(타입 포함)/lint 통과. 실제 공개 자료로 홈·주일 오전예배·첫시간 페이지를 1440/1024/768/390/320px에서 확인해 15개 조합 모두 썸네일 16:9·contain·가로 넘침 없음 확인. 데스크톱 스크린샷도 검토했다. 로컬 서버의 최초 DB EACCES는 개발 실행 환경의 네트워크 권한 문제였으며 권한을 갖춘 서버 재실행 후 검사 완료했다.
- 변경 범위는 홈페이지 표현 3개 파일과 이 문서이며 DB·영상 원본·관리자·앱 로직을 수정하지 않았다. Git main 반영 후 운영 자동 배포의 READY와 실제 사이트를 최종 확인한다.

## 최신: 홈페이지·앱 통합 관리자 간소화 (2026-10-09)

- 사용자 요청: 앱 운영현황을 없애고 공지·주보·설교 업로드를 한 곳에서 관리하며 불필요한 게시판과 복잡한 메뉴를 정리한다.
- 주 메뉴 17→8개: 관리 홈 / 설교·첫시간 / 공지사항 / 주보 / 교회 일정 / 사진 앨범 / 교회 안내 / 관리 설정. 교회 소개·사람들·사역은 교회 안내에, 계정·파일·이력·문의는 관리 설정에 모았다. 권한 검사는 유지한다. 아직 비활성인 모임·돌봄 링크는 설정에서도 숨긴다.
- 앱 운영현황 페이지와 운영 상태 집계 코드를 제거했다. 옛 /admin/app-operations 주소는 인증 보호 아래 관리 홈으로 이동한다. 쓰이지 않던 독립 앱 발행 패널/액션을 삭제했다. 기술 준비 상태는 기존 CLI check:release/check:push로 확인한다.
- 관리 홈은 빠른 등록 4개·일정 등록·최근 등록 내용·미처리 방문 문의만 표시한다. 전체 콘텐츠/미디어 집계와 관리자 활동 목록을 제거해 요약 조회를 17개에서 5개로 줄였다. 현재 메뉴 표시, 모바일 메뉴 자동 닫기·스크롤, 홈페이지 보기 동선을 추가했다. 설교 검색의 미연결 버튼을 실제 제목/설교자 검색에 연결했다.
- 공지·주보·일정은 기존 공통 원본과 공개 규칙을 계속 사용한다. 말씀은 기존 원본+APP revision 트랜잭션 저장을 유지한다. 공개 설정 안내와 개발 체험을 통합 기준에 맞췄다. 이미 사용 중인 사진 앨범과 교회 소개는 삭제하지 않았고 개인 기록/소속 전용 자료를 공개하지 않는다.
- 실제 공개 말씀 읽기 점검: 2건 중 구형 APP 반영본 불일치 1건 발견. scripts/sync-public-content.ts로 dry-run 후 해당 1건만 현재 공개 원본과 일치시켰다. 원본 본문·날짜·개인 기록·스키마·푸시 설정 변경 없음. 감사 기록을 남겼으며 재실행 dry-run 불일치 0건으로 멱등성을 확인했다. 향후 새 저장은 기존 통합 저장 서비스가 처리한다.
- 모바일 로컬 EXPO_PUBLIC_API_BASE_URL을 운영 관리자 HTTPS로 변경했다. 이 로컬 환경 파일은 Git 제외이며 EAS 원격 빌드 환경 반영/Android APK는 별도 남아 있다.
- 검증: 테스트 85개, 관리자 type-check/lint/production build, 공유 타입·변경 파일 lint, 경계 검사 통과. Edge 자동 검사에서 실제 공통 관리자 메뉴 8개·통합 등록 체험·390/320px 가로 넘침 없음·비로그인 보호 확인. 최초 검사 선택자(sr-only 클릭)를 실제 summary 클릭으로 수정 후 통과했다. 사용자 계정으로 콘텐츠를 추가/삭제하는 검증은 수행하지 않았다.
- 원격 검증: 관리자 수정본 미리보기 READY, 로그인·공개 API·인증 보호 10개 경로 모두 통과. 실제 운영 앱 API도 공개 말씀 2건 HTTP 200 확인. 모바일 타입/lint 통과. Git main 반영으로 운영 자동 배포를 진행하며 최종 상태는 해당 main 커밋의 Vercel READY와 작업 응답을 확인한다.


## 최신: 운영 배포 및 관리자 로그인 확인 완료 (2026-10-09)

- 코드 커밋 `de056bf`의 홈페이지·관리자 Git 자동 운영 배포가 모두 READY이며 production 대상 커밋 일치를 확인했다.
- 홈페이지 https://daegwangchurch.kr , https://www.daegwangchurch.kr , https://daegwangchurch.vercel.app 모두 HTTP 200. 관리자 주소는 https://daegwangchurch-admin.vercel.app/admin/login 이다.
- 로그인 화면 200, 비로그인 대시보드 307, 개인 기록 API 401. 말씀 API는 다른 경로 확인 전후 반복 조회 모두 200이며 공지 API도 200이다.
- 사용자가 이전 배포에서 “This page couldn’t load / A server error occurred”를 보고했다. transaction pool 수정본 배포 후 사용자가 직접 재접속하여 “화면열려”라고 관리자 화면 열림을 확인했다. 기존 오류와 DB 연결 한도의 연관성은 추정이며 해당 사용자 요청의 오류 로그로 직접 확정하지 않았다.
- 앞선 미리보기 14개 경로, 로컬 테스트 85개 및 경계 검사 결과는 유지된다. 이번 최종 확인은 운영 도메인 응답과 사용자 로그인 확인이다. 운영 DB 스키마·자료는 변경하지 않았다.
- 다음: 모바일 HTTPS API 주소 반영 → EAS preview 빌드 환경 및 GOOGLE_SERVICES_JSON 파일 변수 등록 → 푸시 작업 비밀값·크론 설정 → Android APK 빌드·본인 기기 수신 검증. Firebase/Expo 프로젝트 생성과 FCM V1 자격 등록은 이미 완료했다. 푸시 발송 및 미확정 가입/모임/돌봄/탈퇴 기능은 아직 비활성이다.

## 진행 중: 운영 DB 연결 한도 후속 수정 (2026-10-09)

- 후속 검증: 변경한 풀로 실제 DB 읽기 12개 병렬 실행 모두 통과. 수정본 Vercel 미리보기 관리자 10개·홈페이지 4개 경로 통과, 다른 경로 조회 후 말씀 재조회도 200. 미리보기 검증 후 두 production DATABASE_URL을 transaction pool로 갱신했다. 수정 코드를 Git main에 반영해 자동 배포 및 실제 운영 URL을 최종 검증한다.

- 홈페이지/관리자 승격 후 실제 도메인 검증에서 말씀 API만 503으로 바뀌는 현상을 확인했다. 실제 DB 읽기 재현에서 DriverAdapterError SQLSTATE XX000·연결 수 한도 오류를 확인했다. 서버 DATABASE_URL이 Supabase session pooler 5432였다.
- 공식 문서에 따라 서버 런타임만 transaction pooler 6543으로 바꿔 말씀 조회 3회와 읽기 전용 interactive transaction 성공을 확인했다. packages/database의 PrismaPg 풀은 max 2·connectionTimeoutMillis 10초·idleTimeoutMillis 10초로 제한했다. DB CLI .env/DIRECT_URL·스키마·회원 자료는 변경하지 않았다.
- 서버 로컬 환경과 Vercel preview 연결을 수정했으며 두 프로젝트의 수정본 미리보기 빌드를 실행했다. check:release에 Supabase transaction pool 검사를 추가했다. 공유 타입·변경 파일 lint 통과. 다음 최상단 기록에서 최종 운영 재배포/외부 확인 결과를 확인한다.

## 진행 중: Vercel 모노레포 배포 전환 (2026-10-09)

- 후속: 홈페이지 미리보기 4개 경로 및 관리자 미리보기 10개 경로 검증 완료. 공개 말씀/공지/주보/행사 200, 관리자 비로그인 이동 307, 개인 기록/기기 API 401, 비밀 없는 푸시 POST 401/no-store. 초기 Vercel 보호 302는 CLI의 관리자 프로젝트 로컬 연결 후 해소했다. 앱 인증을 우회하거나 미리보기 보호를 해제하지 않았다.
- 로컬 단위/체험 85개 및 패키지 경계 검사 통과. 서버 제품 소스 변경 없이 기존 기능의 원격 실행을 확인했다. 실제 사용자 로그인·개인 자료 쓰기·푸시 수신은 별도 검증이다.
- 사용자 승인 순서대로 미리보기 검증 후 두 프로젝트 production 환경 등록 완료. 가입/돌봄/모임/탈퇴/푸시 발송은 계속 false. 운영용 배포는 `--prod --skip-domain`으로 생성해 최종 확인 전 자동 도메인 전환을 막았다.
- 두 프로젝트 Git 연결을 `gyulsangja/daegwangchurch-project`, production branch `main`으로 연결하고 API 조회로 확인했다. Git push 후 자동 배포 가능 상태다.

- 사용자가 기존 scope `gyulsangjas-projects`의 `daegwangchurch`·`daegwangchurch-admin`에 소스와 앱별 DB/Supabase/서버 환경값을 등록하고 미리보기 검증 후 운영 배포하는 것을 명시 승인했다. Firebase 비밀 서비스 계정은 Vercel 전송 대상이 아니다.
- 기존 프로젝트 원격 조회에서 Git link는 null, Root Directory는 루트, 운영 배포는 7월 코드였다. `.kr`, `www` 도메인과 기존 vercel.app은 HTTP 200. 기존 설정과 운영 deployment ID를 Git 제외 test-results/deploy/previous-settings.json에 비밀값 없이 기록했다.
- 홈페이지 Root Directory `apps/website`, 새 관리자 프로젝트 `apps/admin`, 공유 파일 포함, install `cd ../.. && npm ci`, build `npm run build`로 설정했다. 로컬 홈페이지/관리자 production 빌드는 모두 통과했다.
- `.vercelignore`에 중첩 환경 파일·Firebase JSON/키·테스트/생성/빌드 파일 제외를 보완했다. CLI dry 검사: 584개, unexpectedArtifacts=0, secretContentMatches=0. 자동 검토의 민감 환경 전송/잔여 테스트 폴더 지적은 사용자 명시 승인과 제외 규칙 재검사로 해결했다.
- 미리보기 환경변수 등록 완료(값 출력 없음). 사이트 origin은 기존 `https://daegwangchurch.kr`, 관리자 origin은 `https://daegwangchurch-admin.vercel.app`을 사용한다. 미확정 가입/탈퇴/돌봄/모임/푸시 발송은 false 유지.
- 새 관리자 첫 배포는 Vercel이 자동 production으로 분류했다. 설정이 준비된 preview를 명시해 별도 검증 배포를 만들었다. 운영 환경/도메인 전환 완료로 해석하지 않는다. 다음 기록에서 최종 검증/전환 결과를 확인한다.

## 최신: 기존 Vercel 배포 확인 (2026-10-09)

- 후속 인증 성공: Vercel CLI `gyulsangja`, scope `gyulsangjas-projects`에서 기존 `daegwangchurch` 프로젝트를 확인했다. 사용자에게 일회용 코드를 다시 요청할 필요 없다. 프로젝트 조회상 Latest Production URL은 `https://daegwangchurch.kr`이다(별도 실제 도메인 응답 검증 전).
- 원격 project inspect: Root Directory `.`, Next.js, Node 24.x, 기본 build/install 설정이다. 현재 모노레포 홈페이지 경로 `apps/website`와 다르므로 최신 코드 재배포 전 기존 프로젝트의 루트 설정 전환을 검토해야 한다. 관리자/API는 `apps/admin` 별도 배포가 필요하다. 아직 설정 변경·배포는 실행하지 않았다.

- 사용자 정정: Vercel은 기존 Git 연결과 이전 홈페이지 배포가 있으며 주소는 https://daegwangchurch.vercel.app/ 이다. 새 호스팅 계정 유무를 다시 묻지 않고 기존 프로젝트를 이어서 검토한다.
- 공개 HTTP 확인: `/` 200(제목 독산대광교회), `/admin/login` 200(관리자 로그인), `/api/v1/worship` 404. 기존 홈페이지/관리자 화면은 존재하나 이 주소에서 새 앱 말씀 API는 제공되지 않는다. 응답만으로 정확한 배포 커밋/Root Directory는 확인할 수 없다.
- 현재 PC에 프로젝트 `.vercel` 연결 파일은 없고 Vercel CLI whoami는 Logged out이다. 사용자 직접 CLI 인증을 시작했다. 원격 설정·환경변수·Git 연결의 실제 현황을 인증 후 읽어 확인해야 한다. 운영 배포/도메인/DB 변경은 아직 하지 않았다.

## 최신: Android FCM V1 전송 자격 등록 (2026-10-09)

- 사용자가 다운로드한 Firebase 서비스 계정 JSON을 다운로드 폴더에서 읽어 type/service account·앱 google-services.json과 프로젝트 일치·RSA 비밀키 구조를 확인했다. 원문 비밀키는 출력하지 않았고 프로젝트 폴더에 복사하지 않았다.
- 인증된 EAS Credentials에서 preview → Google Service Account → Push Notifications (FCM V1) → Set up 경로로 등록했다. CLI가 업로드 성공 및 `org.daegwangchurch.app`에 FCM V1 할당 성공을 반환했다. Expo 프로젝트는 `@gyulsangjabox/daegwang-church`다. Play Store 제출 자격이나 Legacy 키로 등록하지 않았다.
- 실제 FCM 발송 성공은 아직 검증하지 않았다. 서버 발송 플래그는 계속 꺼져 있으며 빌드·운영 DB·배포·교인 발송 변경 없음. 제품 코드 변경이 없어 타입/빌드 검사는 반복하지 않았다.
- 다음: 휴대폰용 HTTPS 관리자/API 배포 주소 확정 → EAS preview 공개 환경 및 GOOGLE_SERVICES_JSON 파일 변수 등록 → 서버 비밀값/크론 → APK 빌드/본인 기기 수신 검증. 로컬 환경 파일과 다운로드 폴더의 키는 회사 PC/Git으로 자동 전달되지 않는다.

## 최신: Expo 프로젝트 생성·로컬 연결 (2026-10-09)

- 사용자 직접 기기 인증으로 EAS CLI 로그인을 완료했다. 일회용 인증정보는 기록하지 않는다.
- `eas init --account gyulsangjabox --non-interactive`로 `@gyulsangjabox/daegwang-church` 프로젝트를 생성했다. 프로젝트: https://expo.dev/accounts/gyulsangjabox/projects/daegwang-church . EAS CLI가 앱 아이콘을 등록하고 app.json의 공개 owner/extra.eas.projectId를 연결했다.
- 공개 EAS UUID `0ad541dc-af4a-4896-bfa5-ea6fe66795b4`를 기존 환경값 보존 후 모바일 EXPO_PUBLIC_EAS_PROJECT_ID와 관리자 EXPO_PUSH_PROJECT_ID에 동일하게 설정했다. EAS 원격 빌드 환경변수나 배포 서버 설정까지 반영한 것은 아니다.
- 로컬 check:push 10/12 통과. 남은 로컬 설정은 HTTPS API와 작업 비밀값이며, 외부 FCM V1 자격·크론·APK 수신은 별도 검증 대상이다. 발송 플래그는 비활성 유지. 빌드·배포·실제 발송·유료 플랜 신청 없음.
- 검증: EAS project:info에서 연결 프로젝트/UUID 확인, 모바일 type-check/lint와 Git diff 공백 검사 통과.
- 다음: Firebase 프로젝트의 전송용 서비스 계정 JSON을 준비해 위 Expo 프로젝트 Android `org.daegwangchurch.app`의 FCM V1 자격으로 등록. 서비스 계정 파일은 모바일 폴더/앱 환경/Git에 넣지 않는다. 기존 google-services.json은 공개 클라이언트 설정이며 이 비밀키와 다르다. 이후 HTTPS 서버·EAS preview 환경·크론·APK 검증으로 진행한다.

## 최신: Firebase Android 앱 파일 연결 (2026-10-09)

- 사용자가 Firebase 프로젝트와 Android 앱을 생성하고 `apps/mobile/google-services.json`을 저장했다. JSON 구조·공개 클라이언트 설정·Android 패키지 `org.daegwangchurch.app` 일치를 확인했다. 비밀 서비스 계정 JSON이 아니다. 실제 식별값/키/이메일은 문서나 출력에 남기지 않았다.
- 기존 모바일 `.env.local`의 다른 값을 보존하고 `GOOGLE_SERVICES_JSON=./google-services.json`을 설정했다. 기존 app.config.ts를 통해 Expo config를 실제 해석해 해당 Android 파일 경로와 패키지 반영을 확인했다. JSON과 환경 파일은 Git 제외 상태다.
- 로컬 푸시 점검 8/12 통과. EAS 프로젝트 UUID/서버 일치, 배포 HTTPS API, 주기 작업 비밀값은 미설정이다. FCM V1 서비스 계정의 EAS 등록·원격 환경·크론·APK 수신은 아직 미검증이며 발송은 꺼져 있다.
- 검증: Expo config 해석, 모바일 type-check/lint, Git diff 공백 검사 통과. 환경 파일과 Firebase 파일 모두 Git ignore 적용을 확인했다. 제품 소스/의존성/운영 DB는 변경하지 않았다.
- 다음: Expo CLI 로그인 및 EAS 프로젝트 생성/연결 → 공개 프로젝트 UUID를 앱/서버에 설정 → FCM V1 자격 등록 → HTTPS 배포·크론·APK 실기기 검증. Firebase 프로젝트를 다시 생성하지 않는다.
- EAS CLI whoami는 미로그인으로 확인됐다. CLI가 안내한 기기 로그인 흐름을 시작했으며 사용자 브라우저 승인 대기다. 일회용 인증 코드/재개 ID는 저장소에 기록하지 않는다. 새 세션에서는 실제 로그인 여부부터 재확인한다.

## 최신: Android 푸시 연결 사전 점검 (2026-10-09)

- 사용자 추가 답변: Firebase와 Expo 모두 같은 Google 계정을 사용하며 두 서비스의 프로젝트는 아직 없다. 이메일은 저장소에 기록하지 않는다. 아래의 과거 '둘 다 계정 없음' 기록보다 우선하며 계정/프로젝트 존재 여부를 다시 묻지 않는다. Firebase 프로젝트 생성·Android 등록과 Expo EAS 프로젝트 생성부터 진행한다.
- 브라우저/컴퓨터 자동화 초기화가 `windows sandbox failed: helper_unknown_error`로 실패하여 콘솔 생성 작업은 실행되지 않았다. 사용자에게 공식 콘솔에서 프로젝트를 생성하는 입력값을 안내했다. 실제 생성·파일 다운로드 완료를 확인하기 전 연결 완료로 기록하지 않는다.

- 사용자 요청으로 `git pull --ff-only origin main` 실행, `4ef540e`가 최신이며 회사 PC의 추가 원격 커밋은 없었다. 앞선 인수인계 커밋의 GitHub 업로드는 성공했다.
- `npm run check:push` 추가. 로컬 앱·관리자 환경 파일만 읽어 EAS UUID 일치, HTTPS API origin, 인증 프로젝트/공개키, 모바일 서버 비밀값 혼입, Firebase Android 앱 파일·패키지 일치, 서버 알림/작업 비밀값 준비를 검사한다. 값·경로·원문 오류를 출력하지 않으며 네트워크/DB/설정 변경/발송 없음.
- GOOGLE_SERVICES_JSON에 비밀 서비스 계정 JSON을 잘못 연결하면 거부한다. 실제 EAS 자격/빌드 환경·서버 응답·크론·OS 수신은 별도 MANUAL로 표시한다. 준비 전에 발송 플래그를 켜도록 유도하지 않는다.
- 현재 점검: 출시 설정 7/15, 푸시 로컬 설정 5/12. EAS ID, Firebase 앱 파일, HTTPS API, 주기 작업 비밀값 미준비. 실제 발송은 비활성. `.env`/운영 DB/배포는 변경하지 않았다.
- 검증: 기존 푸시 5개 + 새 사전 점검 6개, 변경 스크립트 ESLint·패키지 경계 검사 통과. 비밀 파일 혼동·프로젝트/패키지 불일치·개발용/인증정보 포함 URL·service_role 키·누락 설정 및 결과에 비밀값이 포함되지 않는지 검사했다. 점검 명령의 WAIT/종료 코드 1은 미설정에 따른 예상 결과다. 제품 코드/DB 변경이 없어 앱 빌드·실기기 검사를 새로 실행하지 않았다.
- 다음: Expo/Firebase 계정 준비 답변 확인 → 프로젝트/FCM 자격 연결 → HTTPS 관리자/API 배포 환경 확정 → 크론 → 본인 Android APK 수신 검증. 연결 절차는 notifications.md를 따른다. 사용자에게 비밀값을 채팅으로 보내도록 요청하지 않는다.

## 회사 PC Git 인수인계 (2026-10-06)

- 사용자 요청으로 현재까지의 홈페이지·관리자·앱 변경, 자산, migration, 테스트, 운영 문서를 함께 Git으로 전달한다. 원격은 `origin`의 `gyulsangja/daegwangchurch-project`, 브랜치는 `main`이다.
- 새 [대화 인수인계](CONVERSATION_HANDOFF.md)에 사용자 요청·확정 디자인/제품 기준·미정 사항·최근 푸시 대화·다음 작업·회사 PC Codex에 붙여 넣을 요청을 기록했다. 전체 대화 원문 내보내기가 아니라 작업을 이어가기 위한 요약이다.
- [회사 PC 점검표](company-pc-checklist.md) 최상단을 현재 12 migration/푸시 미연결 상태로 갱신했다. AGENTS.md와 README에서도 이 문서를 먼저 읽도록 연결했다.
- `.env.local`/DB 비밀번호/서비스 계정 키/로그인 세션/빌드·테스트 산출물은 Git 전달 대상이 아니다. 회사 PC의 기존 변경과 환경 파일을 보존하고, 재설정한 DB 비밀번호를 서버와 DB CLI 환경에 별도로 갱신한다. 운영 DB를 reset/seed하지 않는다.
- 제품 코드 검증 결과와 다음 실기기 작업은 바로 아래 푸시 전환 항목을 따른다. 이번 인수인계에서는 기능 코드를 추가로 변경하지 않았다.

## 최신: 휴대폰 원격 푸시 전환 (2026-10-06 후속)

- 사용자 요청: 앱 안 알림만으로는 의미가 없으므로 실제 휴대폰 푸시 중심으로 재검토/구현. 사용자 기기는 **안드로이드, Expo/Firebase 계정 없음**. Firebase로 iPhone도 지원 가능하나 별도 APNs/Apple 개발자 설정이 필요함을 안내했다. 계정 생성·자격 업로드·원격 배포·실제 발송은 하지 않았다.
- [푸시 기능 분석](push-design.md)과 [무료 범위/연결 안내](notifications.md)에 결정과 bash 절차를 기록했다. 첫시간 당일/선택 시각 하루 1회, 새 설교·중요 공지·선택한 새 행사, 본인이 만든/저장한 일정(당일 30분 전/종일 08시). 일반 소식 22~08시 보류·기기당 하루 5건, 과거 24시간/등록 전 제외. 소속·상담은 실제 정책 미정으로 활성 대상에서 제외했다.
- Expo SDK57 `expo-notifications`, `expo-secure-store`, `expo-crypto`를 expo install로 추가. 기기 수신 버튼·OS 권한/Android 채널 확인·등록/갱신·권한 해제/로그아웃/계정 전환 해제·오프라인 해제 재시도·푸시 탭 본인 알림 이동 구현. 웹/Expo Go/연결 미완료는 푸시 활성처럼 표시하지 않는다. Supabase 세션 영구 저장을 새로 도입하지 않았다.
- `app.config.ts`에 환경별 EAS UUID/Google 설정 파일/식별자 주입, `eas.json`에 Android APK preview 프로필을 추가했다. 기본 식별자는 `org.daegwangchurch.app`이며 Firebase/Apple 등록 전에 확정할 수 있다. 실제 계정/프로젝트 ID/키는 만들어 넣지 않았다.
- 서버의 기기 등록 API, 해제용 난수 자격 API, 비밀로 보호한 주기 작업 API, Expo 송신/영수증 어댑터, 발송 큐·동시 실행 보호·제공자 오류/토큰 폐기·현재 동의/공개/읽음/일정 재검사 구현. 잠금 화면은 교회명과 일반 안내만 표시하고 개인 본문/제목/소속을 보내지 않는다. 불확실한 송신/중단은 UNKNOWN으로 남겨 자동 재발송하지 않는다. 정확히 한 번 수신이나 즉시 도착은 보장하지 않는다.
- 운영 알림 조회는 더 이상 열람 시 새 알림을 만들지 않는다. 발송 작업이 앱 실행과 독립적으로 내역을 만든다. 내역 존재/제공자 접수/실제 기기 표시/읽음은 서로 다르다. 서버 플래그가 꺼진 현재 새 원격 전송은 없다.
- `20261006020000_member_push`를 격리 PostgreSQL 검증 후 연결 DB에 적용(총 12 migration). 두 신규 테이블 RLS true, anon/authenticated 직접 읽기·삽입 불가, 탈퇴 보호 트리거 2개 실제 확인. 기기·발송 작업은 탈퇴 접수와 함께 삭제된다. 기존 자료 삭제/운영 테스트 자료 생성 없음.
- `maintain:push` 기본 dry-run 실제 확인: configured=false, activeDevices=0, deliveries=[]; `--apply`는 실제 발송이므로 이번에는 실행하지 않았다. `scripts/supabase-push-cron.sql`은 Vault 비밀과 HTTPS 배포 주소가 있어야 설치되는 템플릿이며 아직 적용하지 않았다. 관리자 운영 현황과 공지 편집에 푸시 상태/중요 공지 전송 기준을 반영했다.
- 검증: 단위/체험 79 + 격리 DB 45 = **124개 통과**. 전체 타입·lint·패키지 경계, 관리자 production 빌드, 웹/Android/iOS export 통과. 알림 브라우저 검사(가짜 인증/API)와 390/320px 넘침 없음, 상단/하단 화면 시각 확인. export는 서명 APK 빌드나 실제 FCM/APNs 검증이 아니다. 마지막 토큰 교체 경쟁 상태 수정 후 공유 타입·대상 lint·DB 45개를 다시 통과했다.
- 토큰 교체 뒤 과거 발송의 DeviceNotRegistered 영수증이 돌아와도 신규 기기를 지우지 않는다. 기기 updatedAt은 실제 등록/갱신 시각이며, worker의 checkedAt 갱신은 이를 변경하지 않는다. 신규 기기 삭제 방지와 새 토큰으로 다음 발송을 통합 검사했다.
- 관리자 개발 서버를 새 Prisma 모델로 재시작. 최신 로그 `test-results/local-servers/admin-push.log` / `admin-push-error.log`. 홈페이지3000·관리자3001·앱8081 HTTP200, 미인증 기기 등록 API와 비밀 없는 주기 작업 API 401 확인. 사용자 브라우저 로그인은 건드리지 않았다.
- 다음: Expo/Firebase 무료 계정과 프로젝트 생성 → FCM V1/공개 google-services 설정 → 배포 HTTPS API/서버 비밀 → Supabase 5분 크론 연결 → 발송 플래그 활성 → Android APK 설치/본인 동의 기기 검증. 아이폰은 APNs/Apple 회원 또는 면제 승인 별도. 운영 정책/도메인 등 앞선 미정 사항은 그대로다.

## 최신: 앱 알림 자동 생성 및 수신 설정 보완 (2026-10-06)

- 알림센터 첫 페이지를 열거나 ‘새 알림 확인’을 누르면 로그인한 본인의 새 공개 말씀·공지·행사·오늘 시작하는 일정을 수신 설정에 따라 생성한다. 모든 설정의 기본값은 꺼짐이다. 앱 밖 원격 푸시·주기 발송은 이번에 구현하거나 실행하지 않았다.
- `20261006010000_notification_activation`을 격리 PostgreSQL 검증 후 실제 DB에 적용했다. migration 총 11개. 항목별 수신 시작 시각을 저장하며 기존 켜진 항목은 마지막 설정 저장 시각으로 초기화한다. 다른 옵션 수정 시 시작 시각을 유지하고 껐다 켜면 새 시각부터 받는다.
- 회원별 잠금·고유 키로 동시 접속/수정/새로고침 중복을 막고 읽음 상태를 유지한다. 첫시간은 한국 날짜·설정 시각과 실제 APP 공개 시각을 검사한다. 일정은 당일 시작하고 아직 끝나지 않은 본인 자료만 안내한다. 탈퇴 접수 계정에는 재생성하지 않는다.
- 제목/본문/개인 일정 메모·장소를 알림 저장소에 복사하지 않는다. 목록·상세 응답 시 현재 원본 제목과 접근 가능 여부를 재조회한다. 비공개·예약·만료·삭제·비활성 자료는 일반 안내로 바꾸고 관련 내용 버튼을 없앤다. 최근 30일·유형별 후보 500개 제한. 소속/상담/주보 알림은 아직 자동 생성하지 않는다.
- 알림 설정에 앱 안 알림과 휴대폰 푸시의 차이를 안내한다. 수신 스위치의 꺼짐 대비와 ‘켜짐/꺼짐’ 글자를 보강했다. 새 브라우저 검사 `apps/mobile/scripts/verify-notifications-web.mjs`는 실제 인증·개인 API를 모두 가짜 응답으로 대체한다.
- 검증: 단위/체험 74개 + DB 통합 35개 = 109개 통과. 전체 타입·lint, 관리자 production 빌드, 앱 웹/Android/iOS export 통과. 브라우저에서 읽음·새로고침·숨겨진 연결 차단·수신 해제 저장, 390/320px 가로 넘침 없음과 화면 시각 확인. 실제 회원/기기 알림 종단간 검증은 아직 필요하다.
- 실제 DB 읽기 확인: migration 11개, activationTimes 필드 존재, 알림 두 테이블 RLS 활성·공개 읽기 차단. 기존 알림 플래그 활성 유지. 실제 테스트 알림 등록·외부 발송은 하지 않았다. 관리자 개발 서버를 새 Prisma 모델로 재시작했고 세 서버 HTTP 200, 비인증 알림·설정 API 401 확인.
- 다음: [notifications.md](notifications.md)의 EAS 프로젝트·앱 식별자·FCM/APNs·기기 동의/토큰·발송 큐/결과 처리·로그아웃 해제/실기기 검사. 운영 정책/배포 정보는 기존처럼 미정이며 푸시 준비 완료로 간주하지 않는다.

## 최신: 회원탈퇴 접수·삭제·실패 복구 연결 (2026-10-05 후속)

- 운영 정보는 계속 미정이다. 탈퇴 기능을 구현했지만 실제 활성화·실제 회원 삭제·메일 발송은 하지 않았다. 푸시/자동 알림은 이번 작업에서 구현하지 않았다.
- `20261005170000_member_deletion`을 격리 PostgreSQL 검증 후 실제 DB에 적용했다. migration 총 10개. 삭제 큐 RLS/직접 공개 접근 차단, 개인 자료 10개 테이블과 관리자 프로필에 탈퇴 중 쓰기 차단 트리거를 추가했다. 이전 migration은 수정하지 않았다.
- 본인 비밀번호 재확인·현재 정책 검사·10분/5회 제한·비활성 포함 관리자 계정 보호. 개인 자료 삭제와 큐 접수는 원자적이며, 중복 요청과 동시 저장을 UUID별 잠금으로 처리한다. DB 롤백, 다른 회원 자료 보존, 인증 제공자 삭제 재시도·임대·완료 영수증 정리를 검증했다.
- DELETE profile은 접수 시 202를 반환하며, 앱은 ‘접수’ 안내 후 로그아웃한다. 완료 전 ‘삭제 완료’로 표현하지 않는다. 오류 시 비밀번호 입력을 지우며 취소 시 요청하지 않는다. 공개 가입은 탈퇴 준비가 되어야 열리도록 조건을 연결했다.
- `maintain:deletions`는 기본 읽기 전용. 실제 실행 결과 configured=false, 작업 0건. `--apply`는 이미 접수된 작업만 처리한다. 실제 스케줄·서버 비밀키·정책은 미설정이다. 관리자 운영 현황에 준비 여부와 대기 건수를 표시한다.
- 상세 범위·설정·제한: [account-deletion.md](account-deletion.md). 지원 정책은 상담 포함 모든 앱 개인 자료 삭제이며, 상담 별도 보관이 필요하면 활성화하지 않는다. 백업·공개 홈페이지 문의는 별도 운영 정책이 필요하다.
- 최종 검증: 단위/체험 74개 + 격리 DB 통합 29개 = 103개 통과. 전체 타입·lint·패키지 경계·관리자 배포 빌드·웹/Android/iOS 앱 export 통과. 탈퇴 전 확인/취소/잘못된 비밀번호/정책 버전/접수 후 로그아웃을 별도 브라우저의 가짜 API로 검증했고 390/320px 넘침 없음. 실제 제공자 계정 삭제·실기기 검증은 아직 하지 않았다.
- 실제 DB 읽기 확인: migration 10개, 탈퇴 큐 RLS 켜짐·공개 역할 읽기 차단, 쓰기 보호 트리거 11개, 탈퇴 작업 0건. 세 로컬 서버 HTTP 200, 비인증 개인 기록 API 401, 가입·탈퇴 옵션 false 확인. 관리자 서버는 새 Prisma 모델을 읽도록 재시작했다.

## 최신: 실제 연결 후 회원·모임·돌봄 운영 기반 (2026-10-05)

- 사용자 답변: 실제 예배/연락처·모임명·승인 담당자·돌봄 담당자/보관 기간은 **미정**. 관리자 직접 로그인 완료. 배포 방식·도메인/호스팅 계정 답변은 아직 없다. 미정 항목을 실제 값으로 만들어 채우지 않았다.
- 실제 관리자 화면을 확인하고 사이트 설정의 `독산대광교회`를 `대광교회`로 저장했다. 홈페이지 브라우저 제목에도 반영됨. 기존 공개 말씀 1건의 제목이 `ㅅㄴ`이므로 검토 전 앱에 자동 추가 발행하지 않았다. 주보·예배 시간표는 0건.
- 실제 DB에 `20261005150000_member_operations`, `20261005160000_registration_consents` 적용: 프로필·모임·담당자·소속·공지·상담 요청·가입 대기 동의 저장소. 기존 데이터 삭제/seed 없음. 초기 포함 총 9개 migration 완료.
- `APP_MEMBER_RECORDS_ENABLED`, `APP_MEMBER_NOTIFICATIONS_ENABLED`를 로컬 관리자 환경에서 활성화했다. 기존 회원의 기록·저장·일정·알림 조회/설정·표시 이름 서비스를 연결했다. 실제 두 Supabase 회원 로그인 테스트는 미완료이며 사용자에게 앱 로그인 확인 요청 중이다.
- 모임 공개/소속 피드 운영 서비스, 관심 설정 버전 검사, 소속 승인/해제, 담당자 권한, 공개/비공개·수정 공지, 감사 기록을 구현했다. `/admin/groups`에 등록·수정·담당자·회원 선택 화면을 추가했다. 실제 모임 미정이므로 `APP_GROUPS_ENABLED`는 꺼져 있다. 첨부·푸시·홈페이지 모임 공지 동시 발행은 구현 전.
- 상담·심방 운영 저장소/API 및 `/admin/care`: 명시된 담당자만 열람, 동의 버전·중복키·취소·상태 전이·버전 충돌·보관 만료 검증. 담당자/동의/기간 설정 없으면 접수와 관리자 조회를 차단한다. 만료 삭제 서비스는 구현했지만 주기 실행은 아직 연결하지 않았다.
- 가입·인증·재전송·복구·재설정에 공식 Supabase SDK 어댑터를 구현했다. 비밀번호/토큰은 응답·로그에 내보내지 않는다. 계정 메일별 요청 제한, 가입 동의 원문/버전/시각/해시 보존, 인증 후 세션 정리. 운영 정책·SMTP·OTP 메일 템플릿 확인 전 비활성. 실제 메일 테스트 미실시. 회원탈퇴와 제공자 삭제·실패 복구는 미완성 상태로 유지한다.
- 앱 운영 현황에 실제 DB 기반 반영 대기 말씀 수, 주보·시간표, 연락처, 개인 기능·모임·돌봄·가입·푸시 상태를 표시한다. 개인 기록 내용은 읽지 않는다. 여러 폼 중 하나를 저장해도 다른 폼의 미저장 경고를 지우지 않도록 보완했다.
- Docker 없는 PC 검증을 위해 EDB PostgreSQL 17.11 바이너리를 Git 제외 테스트 폴더에 내려받아 독립 루프백 DB 러너를 추가했다. 운영 DB를 테스트에 사용하지 않는다. 말씀/개인 기록/모임/돌봄/RLS 통합 검사 24개 및 단위·체험 검사 68개 통과. 전체 타입·lint·패키지 경계, 홈페이지/관리자 Next.js 배포 빌드 통과.
- 의존성 보안 점검으로 Next.js 16.3.6과 호환 범위 하위 패키지를 갱신했다. 마지막 전체 audit는 critical 0, high 26, moderate 14(전이 의존성 포함). Expo/Prisma 강제 다운그레이드 제안은 적용하지 않았다. 공개 출시 전 잔여 경고 검토가 필요하다.
- 세 개발 서버는 계속 실행한다: 홈페이지 3000, 관리자 3001, 앱 8081. 실제 Chrome에서 세 화면 로딩 확인, 홈페이지·앱 390px 및 앱 320px 가로 넘침 없음. 새 관리자 모임 화면·돌봄 접수 차단·운영 상태도 로그인된 브라우저에서 확인했다. 테스트 DB/웹 빌드 산출물을 Metro 감시 대상에서 제외했다.
- 웹·Android·iOS Expo export도 통과했다. 이는 실기기·스토어 빌드 검증을 대신하지 않는다. 만료 정리 CLI(`maintain:members`)를 추가했으며 기본은 읽기 전용이고 `--apply`를 명시해야 삭제한다. 자동 실행 스케줄은 미연결이다.
- 상세 설정·남은 구현·배포 조건은 [RELEASE_READINESS.md](RELEASE_READINESS.md) 참고. 회원탈퇴, 자동 알림/기기 푸시, 실제 회원·메일·기기 검증, 운영 정책, 호스팅·스토어 계정이 남아 있다. 모든 기능이나 출시가 완료된 상태가 아니다.

## 최신: DB 후속 migration 적용 및 로컬 3개 서버 실행 (2026-10-05)

- 사용자의 후속 진행 요청에 따라 미적용 migration 6개를 트랜잭션 안에서 검증 후 롤백하고, Prisma migrate deploy로 정식 적용했다. 초기 migration을 포함한 7개 완료 이력을 확인했다. seed/기존 콘텐츠 삭제는 하지 않았다.
- 새 개인 기록·저장·일정·알림 및 말씀 revision/publication 테이블의 RLS 활성화와 anon/authenticated 직접 SELECT 권한 차단을 조회 검증했다. 실제 두 회원의 API 격리 검증은 아직 필요하다.
- 관리자 설정을 기준으로 홈페이지·DB CLI·모바일의 로컬 환경 파일을 구성했다. 모바일에는 공개 URL/공개 키만 전달했다. 공개 말씀/공지/주보/행사/교회 API를 로컬 관리자 환경에서 활성화했다. 개인 기록/알림 플래그는 이번에 활성화하지 않았다.
- 홈페이지 http://localhost:3000, 관리자 http://localhost:3001/admin/login, 앱 웹 http://localhost:8081 개발 서버를 백그라운드 실행했다. Chrome에서 세 화면 HTTP 200 및 pageerror 없음 확인. 로그와 화면 캡처는 Git 제외 test-results/local-servers에 있다.
- 실제 DB에 말씀 원본 1개, APP publication 0개, 활성 관리자 1명이 있다. 기존 말씀은 관리자에서 공개 상태를 확인하고 저장하여 통합 발행해야 앱에도 반영된다. 현재 앱의 콘텐츠 빈 상태는 체험 샘플을 쓰지 않고 실제 DB에 연결한 결과다. 관리자 실제 로그인/콘텐츠 저장은 아직 검증하지 않았다.
- 재실행(Bash, 저장소 루트): 터미널 각각에서 `npm run dev:website`, `npm run dev:admin`, `npm run web --workspace @daegwang/mobile -- --port 8081 --max-workers 2`.

## 최신: Supabase 비밀번호 재설정 후 연결 확인 (2026-10-05)

- 사용자가 DB 비밀번호를 재설정하고 관리자 로컬 환경 파일을 갱신했다. 첫 확인은 인증 실패(28P01)였으나 현재 파일을 다시 읽은 후 실제 PostgreSQL 연결에 성공했다. 실패 원인이 저장 시점인지 서버 반영 지연인지는 확인하지 못했다.
- 읽기 전용 트랜잭션으로 migration 이력을 조회했다. 완료된 이력은 `0001_init` 하나이며 로컬의 후속 migration 6개는 이력에 없다. 실제 스키마 차이 및 스테이징 검증은 다음 작업이다.
- DB 데이터·스키마·기능 활성화 플래그는 변경하지 않았다. 운영 migration/seed/배포도 실행하지 않았다. 회사 PC와 기존 배포 환경에서 이전 DB 비밀번호를 사용한다면 새 값으로 갱신해야 한다. 비밀 값은 문서에 기록하지 않는다.

## 최신: 하단 메뉴 아이콘 투명 배경 (2026-10-04)

- 하단 탭 PNG에 흰색(홈은 연청록색) 배경이 포함된 것을 확인했다. 기존 Figma의 동일 아이콘 벡터를 배경 없이 가져와 `apps/mobile/assets/tab-icons`에 SVG와 48px 투명 PNG를 저장했다.
- 하단 탭만 새 아이콘을 24px로 사용한다. 다른 화면에서 사용하는 기존 `assets/figma` 이미지는 보존했다. 선택/비선택 배경색과 메뉴 동작은 유지한다.
- PNG 알파 채널, 앱 타입/lint, 브라우저 5개 탭 선택과 아이콘 로딩을 확인했다. 말씀 탭 선택 화면에서 흰 사각형 제거를 시각 확인했다.

## 최신: 작은 교회의 개인 신앙생활 중심 UX (2026-10-04)

- 40명 규모·청년 중심 예상 이용과 어르신 접근성을 반영했다. 기존 기획 문서/화면 점검표와 실제 코드를 검토했으며 Figma 원본 재조회/수정이나 교인 인터뷰를 한 것은 아니다.
- 홈의 첫 행동을 말씀 보기로 정리하고 삽화를 버튼 뒤로 옮겼다. 기도 안내/나의 기록, 주보·소식, 도움말 순서다. 상담·모임·일정은 기존 탭에서 유지한다.
- `/quiet-prayer` 및 말씀 상세의 `FaithPractice`: 비회원 마음 모으기 → 기도 → 작은 실천 → 선택적 비공개 기록. 큰 글씨, 제한 시간 없음, 기록/로그인 강요 없음. 안내 단계 이동은 서버에 활동 완료 기록을 저장하지 않는다.
- 묵상·기도 작성에 시작 질문을 추가하고 본문을 제목/날짜보다 앞에 놓았다. MY의 미구현 시청 기록 메뉴를 제거했다. 기존 개인 정보·인증·초안·기도 연결 정책은 유지한다.
- 영어 MY 탭을 ‘나의’, 화면 제목을 ‘나의 기록’으로 바꿨다. 내부 `/my` 경로와 기능은 유지한다. Android/iOS/웹 export도 통과했다.
- 홈페이지는 기존 흐름에 책갈피·주보 책등/종이 음영·제목 구분선·얕은 그림자를 보강했다. 운영 콘텐츠나 DB는 변경하지 않았다.
- 전체 타입/lint, 비회원 기도/오프라인 단계 이동/큰 글씨 320px/선택적 로그인, 기존 묵상 저장·재로그인·기도 연결·일정 회귀, 홈페이지 주요 9개 경로 및 패키지 경계 검사 통과. 실제 네이티브 접근성/교인 사용성/운영 연결은 대기다. 상세는 [small-church-experience.md](small-church-experience.md).

## 최신: 주제 중심의 메인 재디자인 (2026-10-04 재피드백)

- 사용자가 독립 영역을 반복한 메인을 기계적이라고 지적했다. ‘한 메시지’는 같은 주제로 연결되는 여러 콘텐츠를 함께 묶을 수 있다는 의미다. 이전의 개별 7영역 배치를 폐기했다.
- 대표 인사는 큰 삽화와 작은 문구 면을 조합하고, 예배 시간/찾아오는 길을 하단 안내 띠로 연결했다. 아치는 사용하지 않는다.
- 말씀: 주일 영상은 짙은 녹색의 주 콘텐츠, 첫시간은 밝은 묵상 면으로 구성했다. 공동체: 주보를 종이 형태로 표현하고 공지 목록/일정과 함께 배치했다. 마지막은 교회 소개와 새가족 환영을 함께 구성했다.
- 실제 콘텐츠가 없을 때 가짜 영상·주보를 만들지 않는다. 주보 그림은 장식용이며 실제 PDF 표지가 아니다. 공개 데이터/관리 표시 설정/통합 발행 서비스는 유지했다.
- 하위 페이지 상단은 제목과 설명을 나란히 배치하고 교회 가치/새가족 단계의 반복 테두리 카드를 줄였다. 프리텐다드 유지, 새 글꼴/이미지 생성 없음.
- 홈페이지 production 빌드(타입 포함), 전체 lint, 주요 9개 경로 1440/390/320px 회귀 검사 및 PC·모바일 시각 검토 통과. 후속 하위 화면 수정도 같은 브라우저 검사로 확인했다. 실제 DB 채워진 상태·운영 배포는 이번 범위에 포함하지 않는다.

## 최신: 명료한 홈페이지·콘텐츠 통합 관리 (2026-10-04 후속)

- 사용자 피드백에 따라 아치·큰 식물 장식과 명조 제목을 제거했다. 프리텐다드를 기본으로 사용한다. KoPub바탕은 필요한 강조 상황에서만 허용하며 이번에는 사용하지 않았다.
- 홈의 주일 말씀/첫시간/주보/공지/일정/교회 소개/새가족 안내를 독립 영역으로 나눴다. 큰 빈 영상 프레임과 중복 표어를 제거했다. 홈 관리자에서 사용하지 않는 이전 제목 필드는 숨기되 기존 값을 보존한다.
- 말씀 한 번 저장 시 원본+APP revision을 한 트랜잭션에서 저장한다. 비공개·삭제도 함께 반영하고 별도 앱 발행 액션은 폐기 안내로 바꿨다. 공개 조건·정렬·예배 유형 명칭을 공유한다. 주보는 공개 PDF 조건과 정렬을 함께 사용한다.
- 앱 API 활성화 환경변수/실제 DB는 변경하지 않았다. 기존 말씀은 편집 화면에서 한 번 저장하여 동기화해야 한다. 메모리 체험 앱의 샘플이 실제 홈페이지 DB와 자동 연결된 것은 아니다. [통합 운영 기준과 연결 제한](unified-content.md)을 반드시 확인한다.
- 검증: 전체 타입·lint, 홈페이지/관리자 production 빌드, 단위/체험 테스트 63개 + 공통 정렬/커서 테스트 1개, 패키지 경계 통과. 주요 9개 웹 경로를 1440/390/320px에서 검사했고 영역 구분·글꼴·메뉴·키보드 이동도 확인했다.
- 실제 PostgreSQL 통합 테스트는 새 정책으로 수정했지만 이 PC에 Docker가 없어 실행하지 못했다. 실제 연결 전 임시 DB 검증이 필요하다. 운영 migration/배포는 하지 않았다.

## 최신: 홈페이지 교회 정체성·디자인 개선 (2026-10-04)

- 공개 홈페이지에만 아이보리·차분한 녹색, 명조 제목, 성경 수채화 아치와 말씀·새싹·섬김 아이콘을 적용했다. 교단명/대광교회 두 줄 브랜드와 CMS 콘텐츠·표시 설정을 유지했다.
- 홈 예배 안내·새가족 동선, 교회 소개·비전·새가족 페이지, 한국어 표제, 공지/주보/일정 목록과 빈 상태를 정리했다. 실제 교회 사진·예배 시간·연락처를 임의로 추가하지 않았다.
- 현재 메뉴, 모바일 메뉴 이동 후/Escape 닫기, 본문 바로가기를 추가했다. 위치 미설정 시 개발자 안내와 동명 교회 검색 링크를 노출하지 않는다.
- 기존 앱 삽화를 홈페이지 독립 JPEG 자산(약 190KiB)으로 최적화했다. 공통 로고와 관리자/앱 디자인 토큰은 이번 변경에서 수정하지 않았다.
- 검증: 홈페이지 production 빌드(타입 검사 포함), 전체 lint, 패키지 경계 검사 통과. `scripts/verify-website-design.mjs`로 주요 9개 경로를 1440/390/320px에서 검사하고 PC/휴대폰 홈과 비전 페이지를 시각 확인했다.
- 상세 평가·검증 방법·남은 제한: [website-design-review.md](website-design-review.md). 실제 DB 콘텐츠와 긴 공지 제목·예배 시간·사진이 채워진 상태는 연결 후 재확인한다. 운영 연결·배포는 하지 않았다.

## 최신: 대광교회 명칭·따뜻한 홈·모임 소식 (2026-10-04)

- 사용자 정정에 따라 작은 `대한예수교장로회`와 큰 `대광교회` 두 줄 표기를 적용했다. 앱·웹·관리자 기본 명칭도 정정했으며 운영 DB 이름은 변경하지 않았다.
- 홈에 신규 수채화 삽화·아이보리 말씀 카드·기도/상담 선 아이콘을 적용했다. 320px에서 삽화 비율과 글씨 가독성을 확인했다.
- `/groups`에 비회원 공개 소식, 관심 모임 저장·알림 선택, 확인된 소속 안내 분리를 구현했다. 현재는 loopback 메모리 체험이며 운영 어댑터는 503이다. 실제 모임명/승인 담당자는 미확정이다.
- 관리자 가상 발행 체험에 모임·대상·홈페이지 공개·알림 요청과 최종 확인을 추가했다. 소속 전용 안내의 홈페이지 발행을 거부한다.
- [설계·구현 범위·이미지 출처](groups-and-brand.md)를 반드시 참고한다. 관심 선택이 소속 권한을 부여하지 않으며 실제 DB/푸시/승인 기능을 연결한 것은 아니다.
- 검증: 단위 61개(47+14), 전체 타입·lint, 320px 브랜드/삽화·비회원 공개 모임·관심 저장·소속 분리·관리자 발행 체험 브라우저 통과. `scripts/verify-groups.mjs`를 추가했다. Figma 원본은 이번 변경에서 수정하지 않았다.
- 공개 화면 회귀 검사, 패키지 경계, 관리자 production 빌드, Android/iOS/웹 export도 통과했다. 실제 연결과 운영 발행은 하지 않았다.

## 최신: 시작 화면·작은 화면 접근성 후속 (2026-10-04)

- Expo 57 호환 `expo-splash-screen`을 공식 CLI로 설치하고 단일 루트 lockfile을 갱신했다. 기존 교회 로고·앱 배경색으로 네이티브 시작 화면을 설정했다. 글꼴 로딩 성공 또는 오류 시 시작 화면을 닫으며 외부 API 응답을 기다리지 않는다. 웹 글꼴 대기 화면도 교회 로고와 앱 준비 안내로 바꿨다.
- 공통 확인/안내 모달에 최대 높이·스크롤·접근성 제목을 추가했다. 일정 필터는 큰 글씨에서 줄바꿈을 허용하고 탭 그룹, 폼 선택지는 라디오 그룹 이름을 제공한다.
- 기존 회원 브라우저 회귀 검사에 320×320 삭제 확인창 경계·실제 취소 클릭 검사를 추가했고 통과했다. 타입·lint·패키지 경계 검사 결과와 번들/신규 회원 흐름은 검토 문서의 후속 기록을 따른다.
- 실제 네이티브 시작 화면과 스크린리더·시스템 큰 글씨는 실기기 검증 대상이다. 아래 과거의 '스플래시 플러그인 미연결' 항목은 이제 완료됐다. 운영 연결/DB/배포 변경은 없다.
- 검증: 전체 타입·lint·경계, 기존 회원 및 신규 회원 브라우저 흐름, Android/iOS/웹 export 통과. 신규 회원 테스트의 키보드 입력이 설정 로딩 중 비활성 버튼을 누르던 경합을 발견해 버튼 활성화를 기다리도록 보완했다.

## 최신: 연결 전 UI/UX·이용 가치 보완 (2026-10-04 후속)

아래 이전 기록보다 이 항목이 우선한다. 사용자의 외출 중 자율 진행 요청에 따라 Figma R01/S01/H04와 관리자 AD01을 다시 확인하고 구현·체험·연결 준비를 진행했다. [이용 가치와 검증 내역](offline-ux-review.md)을 함께 확인한다.

- 묵상·교회·개인 일정의 월 달력, 날짜별 표시와 목록 전환을 연결했다. 월 전체 페이지 수집, 한국 시간 경계, 여러 날 행사, 저장한 공식 일정 중복 제거를 처리했다. 달력에 불필요한 별도 기록 목록 요청도 제거했다.
- 홈에서 본인의 오늘 묵상 작성 상태·다시 읽기·기도 이어쓰기, 내 일정 진입을 제공한다. 상담·심방 바로가기를 올바른 요청 화면으로 수정했다. 영상 시청 완료를 자동 추정하지 않는다.
- 본문 16px, 달력 날짜 최소 높이 56, 작은 화면 안내 줄바꿈, 취소 버튼 구분, 확인창 중복 동작 방지를 보완했다. `/help`를 MY에 추가했다.
- 묵상·기도·일정·상담 입력 초안을 메모리에 최대 30분/20개 보관한다. 같은 계정 재로그인 시 이어쓰기, 다른 계정·명시적 로그아웃·저장·작성 취소 시 정리한다. 앱 종료/새로고침에는 복구되지 않는다. 상담 전달 동의는 복원하지 않는다.
- 관리자 `/admin/app-operations`에 공개 채널과 할 일을 표시하고 실제 앱 발행·중단 전에 확인창을 추가했다. 실패한 폼 제출만으로 이탈 경고가 해제되지 않도록 수정했다. 개인 묵상·기도 관리자 열람은 추가하지 않았다.
- `npm run dev:admin:preview` → http://127.0.0.1:3001/preview/app-operations. 개발 모드·명시적 플래그·loopback 호스트에서만 열리는 가상 발행 체험이다. 실제 관리자 인증을 우회하지 않고 저장·발행 요청을 전송하지 않는다.
- 알림 목록/상세/읽음과 수신 설정의 운영 DB 서비스·인증 라우트를 준비했다. `APP_MEMBER_NOTIFICATIONS_ENABLED=false`가 기본이다. migration `20261004150000_member_notifications`를 **파일로만 추가했고 적용하지 않았다**. 개인 기록 관련 미적용 migration은 총 4개다. 실제 발송·기기 토큰·예약 작업은 미구현이다. 가입/복구/프로필/탈퇴/상담 운영 어댑터는 계속 비활성/503이다.
- 단위 60개(47+13), 타입·lint·경계 검사, 기존 개인 기능 브라우저 회귀 검사, 모바일 UI와 관리자 체험 브라우저 검사를 통과했다. 실제 Supabase/DB/기기 검증은 아니다. 최종 번들 검증 결과는 아래 검토 문서에 기록한다.
- 개발 서버 다중 실행 때 메모리 부족으로 브라우저 로딩이 지연됐다. 모바일 체험 스크립트는 Metro 작업 수를 2로 제한했다. 무거운 빌드는 관리자 개발 서버를 끄고 순서대로 실행한다.
- Android/iOS/웹 export와 관리자 production 빌드 통과. 기존 교회 SVG로 기본 Expo 아이콘을 교체했고 Android 전경/단색·favicon도 내보냈다. 아이콘 설정 검사와 시각 확인 완료. 스플래시 PNG는 준비만 했고 플러그인/실제 설치 검증은 남았다.

다음은 [회사 PC 연결 점검표](company-pc-checklist.md)에 따른 스테이징 연결·권한·실기기 검사다. 새 운영 정책/동의/담당자 권한을 임의 확정하지 않았으며 운영 DB·환경 파일·배포·원격 Git은 변경하지 않았다.

## 최신: 회사 PC 없이 진행한 회원 체험 기능 (2026-10-04)

이 항목이 아래 과거의 미구현 목록보다 최신이다. 사용자는 화요일까지 회사 PC를 사용할 수 없어 제안한 오프라인 개발·화면 점검·테스트·연결 준비를 모두 진행하도록 요청했다.

- Figma 03 App UI 88개 화면/상태를 [점검표](mobile-screen-audit.md)로 정리했다. 구현 52, 체험 20, 부분 13, 대기 3이며 모든 화면이 운영 완료된 것은 아니다.
- 회원가입/필수 동의/인증/완료, 비밀번호 복구/재설정, 계정 이름 수정/개인정보 안내/탈퇴 확인 화면을 연결했다. 비밀번호와 인증번호는 URL/영구 저장에 넣지 않는다.
- 상담·심방 입력→검토→별도 전달 동의→접수→본인 내역/상세→취소를 연결했다. 중복 클릭 잠금·요청 키·버전 검증, 401/503에서 현재 폼 유지가 있다.
- 알림 목록/분류/읽음/상세, 수신 항목과 한국 시간 HH:mm 설정을 연결했다. 선택 알림은 기본 꺼짐이며 실제 OS 권한이나 발송을 활성화했다고 표시하지 않는다.
- 공통 폼·이탈 확인, 키보드 회피, 체크박스/라디오/탭의 웹 접근성 상태, 모달 역할을 보완했다. 홈 알림·MY·교회 메뉴에서 신규 화면으로 이동한다.
- `scripts/preview-members.ts`는 메모리만 사용하는 loopback 개발 API다. 새 회원 기능과 기존 개인 기록/말씀 저장/일정도 체험한다. 사용자별 격리, 코드 만료/재사용 제한, 재설정 후 세션 폐기, 현재 비밀번호 확인 후 테스트 계정 삭제를 구현했다. 실제 Supabase·DB·메일·교회 접수·푸시는 사용하지 않는다.
- `npm run dev:mobile:preview` → http://localhost:8088. 로그인 화면의 **테스트 계정 채우기** 또는 `demo@example.invalid` / `Demo-only-123!`. 가입은 가상 `@example.invalid` 주소만, 코드 `123456`. 서버 종료 시 데이터 소멸, 새로고침 시 재로그인. 설정은 자식 프로세스에만 주입한다.
- 운영 `/api/v1/account/options`는 신규 기능 비활성, `/account/[operation]` 및 `/me/requests|notifications|preferences|profile`은 503이다. **신규 운영 어댑터/저장소는 미구현이다.** 기존 개인 기록 플래그로 켜지지 않는다. 이번 단계에서 migration 추가/적용·운영 설정 변경·배포는 하지 않았다.
- 계약은 `packages/contracts/src/features/member/extras.ts`, 클라이언트는 `packages/api-client/src/member-extras.ts`. 테스트 API는 앱/운영 패키지에서 import하지 않는다. 화면은 공통 컴포넌트와 디자인 토큰을 재사용한다.

검증: 기존 단위 47개 + 로컬 회원 8개, 전체 타입/lint/의존성 경계, 공개·기존 개인·신규 회원 흐름 브라우저 검사, Android/iOS/웹 로컬 export 통과. 320px 가로 넘침, 코드 오류/만료, 다른 회원 접근, 버전 충돌, 중복 접수, 이탈·취소·삭제 확인을 검사했다. 브라우저 검사는 fixture이며 실제 서비스와 실기기 검증을 대체하지 않는다.

다음: [회사 PC 연결 점검표](company-pc-checklist.md)에 따라 설정·스테이징 migration·실제 로그인부터 확인한다. 가입/동의 정책, 담당자 열람 범위/보관, 탈퇴 정책, 발송 주체/기기 설정을 결정한 뒤 실제 어댑터·DB·메일·푸시를 구현한다. 남은 Figma 차이는 점검표에 기록했다. 중보기도 요청·묵상 공유는 계속 보류한다.

작업 diff에는 이전 사용자 수정과 앞선 단계가 함께 있다. reset/clean으로 제거하지 않는다. 커밋·원격 반영은 하지 않았다.

기준일: 2026-10-02. 원래 회사 PC 저장소 이름 daegwangchurch. GitHub 저장소는 gyulsangja/daegwangchurch-project.

## 완료
- Next.js 홈페이지와 CMS/API, Expo 앱을 npm workspaces 모노레포로 분리했다.
- apps/website (3000), apps/admin (3001), apps/mobile (Expo).
- contracts/api-client/server/database/design-tokens/web-ui/config 공유 패키지 구성. mobile은 공개 HTTP 클라이언트만 사용한다.
- 말씀 CRUD 서비스/감사 로그/트랜잭션, APP 발행 revision/공개 포인터, 발행·중단 CMS 패널 구현.
- GET /api/v1/worship, /api/v1/worship/:id. 발행된 APP snapshot만 반환. no-store, 404/422/503 처리.
- 공개 모바일 묵상 목록·연월 필터·페이지 이동·상세·YouTube 영역·실패 복구 구현.
- 관리자 proxy 위치 수정, 홈페이지 /admin 이동, 독립 배포 후 홈페이지 콘텐츠 갱신 구조 정리.

## 집 PC 점검 및 설치 수정 (2026-10-03)
- 실제 프로젝트 루트는 현재 작업 폴더 아래 `daegwangchurch-project`다. 상위 폴더에는 커밋 없는 별도 Git 저장소가 있어 명령 실행 위치에 주의한다.
- Node.js 24.15.0 / npm 11.12.1에서 `npm ci`가 EUSAGE로 실패했다. 잠금 파일에 `@emnapi/core@1.11.3`, `@emnapi/runtime@1.11.3` 항목이 누락되어 있었다.
- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`로 잠금 파일을 보정했다. 기존 패키지 버전 변경 없이 누락된 두 항목과 npm 의존성 메타데이터를 갱신했다.
- 보정 후 `npm ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=30000` 성공(1,095개 패키지 설치 및 Prisma Client 생성). `npm test` 17개와 `npm run check:boundaries`도 통과했다. 이번 점검에서는 빌드/DB 통합 테스트를 실행하지 않았다.
- 환경변수 파일과 Docker는 이 PC에 준비되지 않았다. 실제 로그인/DB/앱 발행 데이터 확인에는 별도 설정이 필요하다.
- 다음 작업은 관리자와 모바일 앱 화면을 먼저 실행해 사용자가 기존 진행 상태를 확인하는 것이다. Git Bash에서 프로젝트 루트 기준 `npm run dev:admin`, 별도 터미널에서 `npm run dev:mobile` 후 `w`를 사용한다.
- DB 없이 앱을 확인하는 `npm run dev:mobile:preview`를 추가했다. http://localhost:8088 에서 명시적인 샘플 3개로 목록/날짜 필터/상세를 확인한다. 실제 데이터나 영상은 연결하지 않는다. Chrome에서 목록 및 상세 진입 확인, 모바일 타입 검사 통과. 관리자 인증은 변경하지 않았다.

## 회사 PC 검증 (2026-10-02)
단위 17개, 임시 PostgreSQL 통합 15개, 실제 production HTTP 경로/인증/갱신 테스트 통과. TypeScript/lint/경계 검사와 웹 2종 production 빌드 통과. Expo Android/iOS/웹 export 통과. 홈페이지/관리자 로그인 및 모바일 fixture 브라우저 검증 통과.
테스트 결과는 이 날짜의 상태이며 변경 후 필요한 검증을 다시 한다. 실제 기기 YouTube 재생, 운영 계정 관리자 버튼 조작은 별도 검증이 필요하다.

## 이전 단계에서 남아 있던 것 (아래 2026-10-04 기능 연결 기록 우선)
- 운영 DB migration, Vercel Root Directory 전환/관리자 프로젝트 배포, 운영 앱 배포.
- 회원 인증/개인 묵상·기도·일정·목회돌봄 전체 기능.
- 앱 전체 화면의 코드 구현과 실제 데이터 연동. Figma에는 88개 화면·상태 및 UX 명세가 존재하며 전체 프로토타입의 작동 검증은 별도다.
- 교적/재정, 중보기도 요청/묵상 공유.

## 이전 단계의 작업 순서
1. 홈·5개 기본 화면과 공지 목록/상세/API를 연결했다. 다음은 기존 Figma 기준 행사·교회 상세 및 공개 API 연결, 말씀 유형/검색 기능이다. 이미 있는 화면 목록과 Low-Fi를 새로 작성하지 않는다.
2. 회원 인증 방식, 개인 기도 형식, 일정 범위, 상담·심방 담당자와 기록 보존 정책은 해당 기능 설계 전에 결정한다. 중보기도 요청/묵상 공유는 계속 보류한다.
3. 회사 PC의 환경변수 설정을 안전하게 가져와 관리자와 실제 데이터를 확인한다. 집 PC의 `apps/admin/.env.local`은 기본 양식만 생성했으며 실제 연결값은 이 작업에서 입력하지 않았다.
4. 앱 발행 검증은 운영 DB 대신 임시 Docker 통합 테스트부터 사용한다. 배포는 별도 요청 시 docs/monorepo.md의 전환 절차를 따른다.

## Figma 재확인 및 계획 정정 (2026-10-03)
- 페이지 ID 없는 get_metadata가 초기 보관 페이지 하나만 반환해 처음에는 후속 디자인을 놓쳤다. use_figma로 실제 루트를 조회해 총 5개 페이지를 확인했다. 앞으로 생략형 메타데이터 결과만으로 전체 페이지를 판단하지 않는다.
- 02 Screen Inventory & UX Spec(6:2), 03 App UI · Daegwang Teal(6:3), 04 Theme(18:2), 05 Unified Admin(36:2)이 실제 존재한다. 03에는 88개 앱 화면·상태가 있으며 W02 8:332, W03 8:353도 확인됐다.
- 사용자 지적 후 35개 화면 재기획안과 새 Low-Fi 제작 순서를 철회하고 `docs/mobile-ux-plan.md`를 기존 Figma 기준 구현 계획으로 교체했다. 기존 화면 ID와 설계를 따른다.
- Figma 명세에 주요 회원 흐름 프로토타입 연결과 실제 입력·저장·신청 미구현이 명시돼 있다. 전체 화면과 모든 연결을 직접 시각 검증한 것은 아니다. 인증·시청·기록 보관 등 명세의 미확정 정책만 추가로 결정한다.
- 이번 정정은 문서만 수정했으며 Figma와 앱 코드·API·DB는 변경하지 않았다.

## 앱 홈과 하단 메뉴 구현 (2026-10-03)
- Figma H01(8:5), W01(8:295), N01(9:360), C01(10:5), M05(10:326)의 디자인 컨텍스트·이미지를 기준으로 5개 기본 화면과 Expo Router 하단 메뉴를 연결했다.
- 홈은 실제 공개 API의 최근 묵상을 읽는다. 오늘 자료가 아니면 실제 날짜와 최근 묵상 문구를 사용하고, 빈 결과·통신 실패·재시도를 구분한다. 가상 시청/회원 기록은 표시하지 않는다.
- 기존 목록은 `/devotional`로 이동했고 `/devotional/[id]` 상세와 오류 시 목록 복귀를 유지했다. 미구현 기능은 준비 안내만 표시한다. 로그인/저장/신청 기능이 구현된 것으로 간주하지 않는다.
- 로고 32×38, 하단 메뉴 아이콘 24×24 원본 PNG 6개를 로컬 자산으로 추가했다. 390px 홈 이미지 검토, 타입 검사, lint, 경계 검사 및 기존 브라우저 회귀 테스트의 5개 탭·비회원 안내·묵상 조회·오류 복구 검증을 진행했다. 실기기 검증과 운영 DB 연결은 남아 있다.

## 공지사항 앱 연결 (2026-10-04)
- Figma N08(30:161), N02(9:393) 기준으로 소식 → 공지 목록 → 상세 → 목록 동선을 구현했다. 공개 첨부 외부 열기, 페이지 이동, 로딩/빈 결과/비공개/오류 재시도, 화면 이탈 시 요청 취소를 포함한다.
- contracts/api-client/server/admin API를 연결했다. 홈페이지와 공지 공개 조건을 공유하고 공개·미삭제 첨부만 반환한다. 에러를 빈 결과로 숨기지 않으며 응답에 내부 DB 오류·관리 필드를 포함하지 않는다.
- `APP_PUBLIC_NOTICES_ENABLED` 기본 false. true인 경우 홈페이지 공개 공지를 공유하며, 말씀 APP revision 정책은 유지한다. 운영 환경 활성화/배포/DB 변경은 하지 않았다.
- 로컬 preview에 샘플 공지 2개를 추가했다. 기존 프로세스가 실행 중이면 Ctrl+C 후 루트에서 `npm run dev:mobile:preview` 재실행. http://localhost:8088 → 소식 → 공지사항.
- 전체 type-check, 단위 23개, 경계 검사, 모바일/관리자 및 수정 공유 파일 lint, 390px 브라우저 공지 목록/상세/페이지/비공개/빈 결과/오류 복구와 기존 묵상 회귀 검증 통과. 실제 DB 공개 필터 동작·스토리지 다운로드·실기기 검증은 연결 설정 후 추가해야 한다. 단위 테스트는 쿼리 조건 및 DTO/HTTP/클라이언트 동작 검증이다.

## 주보 앱 연결 (2026-10-04)
- Figma N03(9:413)/N04(9:435) 기준 `/bulletins`, `/bulletins/[id]` 구현. 소식 메뉴에서 연월 필터, 목록 페이지 이동, 상세, PDF 원본 열기를 제공한다. 웹은 iframe 문서 영역, 네이티브는 외부 문서 뷰어 연결이다. 네이티브 내부 PDF 확대/페이지 UI는 미구현이다.
- `/api/v1/bulletins` 및 `/:id`는 `APP_PUBLIC_BULLETINS_ENABLED=true`일 때만 홈페이지 공개 주보를 제공한다. 기본 false 유지. 발행 시점/삭제 여부와 PDF의 PUBLIC·미삭제·application/pdf 조건을 검사한다. UTC 날짜로 저장하는 기존 CMS 규칙을 따라 월 범위를 조회한다.
- 샘플 미리보기에 주보 2개와 실제 PDF 형식의 영문 SAMPLE 문서를 추가했다. 공식 교회 문서가 아니다.
- 전체 타입 검사, 수정 패키지/모바일/관리자 lint, 경계 검사, 단위 25개 및 브라우저 주보 목록/상세/월 빈 결과/비공개 전환/오류 복구 검증 통과. 브라우저 회귀 테스트의 문서 영역은 HTML fixture이며 실제 PDF 렌더러·운영 스토리지·휴대폰 검증을 대신하지 않는다.
- 다음 구현: 행사 목록/상세와 교회 안내 상세. 운영 설정·DB·배포는 변경하지 않았다.

## 행사 앱 연결 (2026-10-04)
- Figma N05(9:456)/N06(9:473) 기준 행사 목록 `/events`와 상세 `/events/[id]`를 소식 메뉴에 연결했다. 예정/지난 행사, 페이지 이동, 한국 시간/종일 표시, 장소·담당 부서·안내 본문, 빈 결과·오류·비공개 상태를 구현했다.
- 진행 중인 행사는 예정에 포함한다. 종료 시간이 없으면 시작 시각 기준, 종일은 한국 날짜의 마지막 날까지 예정으로 취급한다. 기존 CMS 시각 저장값을 해석하며 운영 자료의 시간대 정확성은 추가 확인이 필요하다.
- `APP_PUBLIC_EVENTS_ENABLED=true`에서 홈페이지 공개 행사를 앱에도 제공한다(기본 false). 발행 예약/삭제/상태 조건을 목록과 상세에 적용한다. 홈페이지 행사 검색이 OR 조건을 덮어쓰며 예약 발행 제한을 누락할 수 있던 부분을 공유 공개 조건의 AND로 보완했다.
- 내 일정 저장과 문의 접수는 미구현이며 명확한 준비 안내를 표시한다. 운영 활성화/DB/배포 변경 없음.
- 샘플 미리보기에 예정·지난 행사 각 1개 추가. 전체 타입 검사, 모바일/관리자/수정 공유 코드 lint, 경계 검사, 단위 28개, 기존 및 행사 브라우저 회귀 테스트 통과. 실제 DB 통합/운영 데이터/실기기 검증은 남아 있다.
- 다음은 교회 소개·예배 안내·담임목사·새가족·오시는 길 상세와 공개 API 연결이다.

## 교회 소개·예배 안내 연결 (2026-10-04)
- Figma C13(30:175)/C03(10:52) 기준 `/church-info/about`, `/church-info/schedules`를 교회 메뉴에 연결했다. 소개 본문과 예배 이름·요일·시간·장소·비고를 실제 공개 필드로 표시한다.
- `/api/v1/church/about`, `/api/v1/church/schedules`는 `APP_PUBLIC_CHURCH_ENABLED=true`에서만 활성화된다(기본 false). 소개는 PUBLISHED·미삭제·발행 시점, 시간표는 isVisible·미삭제 조건을 적용한다. 임의 기본 소개문/예배 시간을 채우지 않는다. 내부 JSON 필드는 응답에서 제외한다.
- 공개 소개 없음(404), 시간표 없음(빈 배열), DB/응답 오류(503 또는 형식 오류)를 구분한다. 샘플 소개 1개와 샘플 예배 안내 2개를 추가했다.
- 전체 타입 검사, 모바일/관리자/수정 공유 코드 lint, 경계 검사, 단위 30개 및 브라우저 교회 메뉴→소개→예배 안내/비공개/빈 결과/오류 재시도 검증 통과. 운영 DB 연결과 실기기 검증은 남아 있다. 운영 환경 활성화·DB·배포는 변경하지 않았다.
- 다음은 담임목사·새가족·오시는 길·연락처 화면/API 연결이다. 해당 메뉴와 문의는 현재 준비 안내다.

## 교회 상세 4개 및 연락 동선 (2026-10-04)
- Figma C02/C04/C05/C06 기준 담임목사·새가족·오시는 길·연락처 화면을 추가했다. 교회 메뉴, 소개/예배 안내, 행사 문의에서 연결한다.
- 기존 교회 API에 `pastor`, `newcomer`, `contact`를 추가했다. 담임목사는 표시 중인 미삭제 담임목사만, 새가족은 발행된 NEWCOMER_EDUCATION만 읽는다. 사진은 PUBLIC·미삭제 JPEG/PNG/WebP만 제공한다. 연락처는 홈페이지 공개 설정 중 필요한 필드만 선택하고 개인정보 담당자/SEO 등 내부 옵션을 제외한다.
- 전화/메일/홈페이지 외부 열기와 Google Maps 길찾기 URL 연결. 값이 없거나 전화/메일 형식이 잘못되면 연결 버튼을 제공하지 않거나 비활성화한다. 내부 지도는 아직 없으며 지도 영역에 외부 보기 안내를 명시한다. 주소는 선택/길게 눌러 복사한다. 새가족 문의는 대표 연락처 안내이며 앱 내 신청/문의 접수가 아니다.
- 로컬 샘플에는 실제 인물 사진·전화·주소를 넣지 않았다. 개인정보나 임의의 공식 자료를 생성하지 않는다. APP_PUBLIC_CHURCH_ENABLED는 기본 false 유지.
- 전체 타입 검사, 모바일/관리자/공유 코드 lint, 경계 검사, 단위 32개 통과. 브라우저 4개 화면·비공개·자료 없음·오류 복구·메일/홈페이지/지도 URL 검증 통과. 전화는 URL 단위 검사와 버튼 상태를 검증했으며 실제 발신은 하지 않았다. 운영 DB·사진 스토리지·실기기 외부 앱 실행은 추가 검증이 필요하다.
- 다음 작업 후보: 말씀 유형/검색과 교회 일정·공동기도. 회원 인증·개인 기록·상담/심방은 정책 확인 후 진행한다.

## 대화 이어받기용 문장
“독산대광교회 프로젝트를 이어서 진행해줘. AGENTS.md, docs/PROJECT_CONTEXT.md, docs/HANDOFF.md, docs/monorepo.md를 읽고 현재 Git 상태를 확인해줘. 기존 결정과 작업을 보존하고, 완료한 내용과 남은 작업을 구분한 뒤 다음 단계를 진행해줘.”

이 문서는 작업 맥락 요약이다. 원래 대화 전문이나 Codex 세션 자체를 포함하지 않는다. 인증 파일과 .codex 폴더를 GitHub에 복사하지 않는다.

## 기능 연결 진행 (2026-10-04, 최신 상태)

사용자 요청: 화면 다음 기능 완성 단계도 계속 진행. 기존 Figma와 확정 정책을 유지한다. 아래 기록이 앞선 미구현 목록보다 최신이다.

### 이번에 연결한 범위

- 말씀: 주일/특별 설교 목록·상세, 전체 검색, 기간/본문/설교자 조건. APP 공개 revision의 스냅샷만 검색하고 홈페이지 초안은 노출하지 않는다.
- 로그인: 기존 Supabase 이메일·비밀번호 계정, 개인 기능 진입 후 복귀, 로그아웃 시 개인 화면 제거. 이메일 방식은 Figma를 따른 구현 기본값이며 운영 정책 확정 답변은 받지 않았다. 회원가입/복구는 아직 준비 안내다.
- 개인 기록: 묵상·일반 기도·특별기도 CRUD, 월별 조회/페이지 이동, 말씀 연결 스냅샷, 묵상→기도 연결, 특별기도 선택적 응답일/감사. 일반 기도 제목은 선택이며 응답 추적을 강제하지 않는다.
- 저장한 말씀: 저장/해제, 유형별 목록, 공개 해제된 말씀의 본문/제목은 반환하지 않음, 사용자/말씀 unique로 중복 방지.
- 일정: 교회 날짜별 조회, 개인 일정 CRUD, 종일/시간/기간 검증, 교회 일정 저장/해제, 날짜별 통합 목록에서 같은 행사 중복 방지. 교회 원본을 개인 수정하지 않는다. 저장은 행사 신청이 아니다.
- 공동기도: P09/P10 목록·상세와 개인 기도 작성 진입. 기존 공지 CMS의 분류가 정확히 공동기도인 공개 자료만 별도 /api/v1/prayers에서 읽는다. 홈페이지 공지에도 노출되는 공개 콘텐츠이며 개인 기록을 공유하는 기능이 아니다. 기간 만료 자료는 목록/상세에서 모두 숨긴다. Figma의 이번 주/지난 기도 구분은 별도 기간 데이터 정책 결정 후 확장한다.
- 작성 화면 이탈 확인, 저장 실패/수정 버전 충돌 시 입력 유지, 중복 저장 클릭 방지, 공개/개인 조회 시 취소·재시도·빈 결과·실패 상태.
- 빈 기도 내용이 카드/메뉴에서 React Native 텍스트 경고를 만들던 문제 수정.

### API와 DB

개인 API /api/v1/me/records, /bookmarks, /schedules 및 각 /:id. 서버가 Supabase /auth/v1/user로 bearer를 검증하고 매 쿼리에 ownerId를 적용한다. 버전 조건으로 묵상/기도/일정의 동시 수정 덮어쓰기를 막는다. 개인 기록 관리자 조회 API/화면은 만들지 않았다. DB 운영자 권한까지 차단하는 종단간 암호화는 아니다.

추가 migration (파일 작성 및 Prisma Client 생성만 완료, DB 적용 안 함):
- 20261004120000_member_records
- 20261004130000_member_bookmarks
- 20261004140000_member_schedules

세 테이블에 RLS 활성화, PUBLIC/anon/authenticated 직접 권한 회수. 실제 서버 DB 역할의 테이블 접근권한 및 운영 RLS 동작은 임시 DB/실계정 통합 검증이 필요하다. 사용자 Auth ID는 외부 Supabase UUID이므로 Auth 테이블 FK는 없다.

APP_MEMBER_RECORDS_ENABLED=true가 세 개인 API를 함께 연다. 기본 false. 브라우저 Origin은 APP_MEMBER_ALLOWED_ORIGINS에 정확한 origin을 쉼표로 나열. 모바일에는 EXPO_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY만 사용한다. 실제 Supabase/DB 값은 입력하지 않았다. 신규 공개 공동기도 플래그 APP_PUBLIC_PRAYERS_ENABLED 기본 false.

### 검증과 제한

단위 47개 통과. 전체 타입/lint와 Android·iOS·웹 export를 검증했다. 공개/회원 Playwright 테스트는 fixture 기반이다. 회원 흐름은 로그인 실패/성공/복귀, 개인 CRUD, 저장 실패·버전 충돌·이탈 확인, 묵상 연결, 특별기도, 말씀 저장/해제, 개인 일정, 교회 일정 저장/해제/중복 방지, 로그아웃 화면 제거를 확인한다. 스크린샷은 apps/mobile/test-results 아래 생성된다. 실제 Supabase·DB 연결 및 실제 휴대폰 검증은 미진행이다.

새로고침/앱 종료 시 메모리 세션 소멸. 자동 임시저장/오프라인/인증 만료 후 초안 복구는 미구현. 같은 말씀에 여러 묵상 가능. 캘린더 월 전체 점 표시, 내장 PDF/지도, 전체 Figma 상태 일치는 남아 있다. 테스트용 8089 서버는 가짜 인증 설정이므로 일반 실행에 사용하지 않는다.

### 다음 작업 및 필요한 입력

1. 회사 PC의 실제 Supabase/DB 설정을 안전하게 확보하고 임시 DB에서 새 migration·서버 인증·회원 소유권·공개 해제 연동을 검증한다. 운영 DB 적용/배포는 AGENTS.md의 별도 사용자 요청 조건을 따른다.
2. 이메일 가입 방식, 실제 약관/필수 수집 항목, 탈퇴와 보관 기준을 확정한 후 가입·메일 인증·복구·계정 수정/탈퇴를 연결한다.
3. 상담·심방 담당자 범위와 민감한 요청의 보관 기준을 받은 뒤 요청/내역/담당자 처리 권한을 구현한다. 지정 담당자만 열람인지 전체 관리자 열람인지 질문했으며 답변 대기다.
4. 알림·푸시용 프로젝트/기기 설정, 발송 주체·수신 동의, 시청 완료 기준을 확정하고 실제 기기에서 검증한다.
5. 중보기도 요청/묵상 공유는 사용자 재승인 전까지 계속 보류한다.

Bash 실행 및 테스트 절차는 apps/mobile/README.md에 최신화했다. 모든 기능이 완료되었거나 운영 사용 준비가 끝났다고 해석하지 않는다.
