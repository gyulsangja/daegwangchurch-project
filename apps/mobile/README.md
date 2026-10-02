# 독산대광교회 모바일 앱 · 공개 묵상 1차 연결

기존 Figma W02(8:332), W03(8:353)의 청록색 테마·카드·간격·Noto Sans KR을 React Native로 구현했다. Expo SDK 57, Expo Router를 사용한다. 홈페이지는 apps/website, 관리자/API는 apps/admin에서 독립 실행한다.

## 실행

저장소 루트에서 `npm ci` 후 `.env.example`을 `.env.local`로 복사하고 API 주소를 설정한다.

```sh
npm start
npm run web
npm run type-check
npm run lint
npx expo export --platform all
```

실기기에서 localhost는 PC가 아닌 기기 자신이다. PC의 LAN 주소 또는 HTTPS 서버 주소를 사용한다. Android 에뮬레이터는 `http://10.0.2.2:3001`을 사용할 수 있다. 실제 API는 migration 및 `APP_PUBLICATION_ENABLED=true`, 관리자 앱 발행이 필요하다. 공개 API만 연결하므로 인증 비밀키를 앱 환경변수에 넣지 않는다.

## 구현 범위

- 첫시간 주님께 목록, 연월 필터, 커서 더 보기, 새로고침
- 상세 재조회, 본문 위치, 발행된 설명/요약
- YouTube 플레이어 영역과 외부 YouTube 열기
- 로딩, 빈 결과, 404, 503, 네트워크 오류, 재시도
- 화면 이탈/필터 변경 시 요청 취소와 오래된 응답 무시

회원 기능·저장·시청 기록·묵상 질문/작성은 아직 연결하지 않는다. Figma의 회원 기록 표시는 실제 데이터 없이 표시하지 않는다. 초기 진입은 이 기능의 목록이며 앱 전체 하단 메뉴는 후속 화면 연결 단계에서 구성한다. 월 필터는 입력 방식의 1차 구현이다. Figma 모형의 가상 상태바/기기 테두리 대신 실제 OS 영역을 사용한다. 아이콘/스플래시는 Expo 기본 개발용 자산이며 브랜드 확정본이 아니다.

## 검증

루트에서 `npm run test:mobile`, `npm run test:integration:worship`.

브라우저 테스트는 `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3210`으로 `npm run web -- --port 8088`을 실행한 뒤 `node scripts/verify-web.mjs`로 진행한다. 설치된 Edge를 headless로 사용하며 API/영상 응답은 명시적인 테스트 fixture다. 별도 임시 PostgreSQL 테스트는 실제 발행 DTO와 월 필터를 모바일 클라이언트로 검증한다.

실제 Android/iPhone에서 재생·딥링크·접근성 검증은 별도로 필요하다. YouTube 임베드 제한·삭제·네트워크 문제에는 외부 보기 버튼을 사용하며, 영상 재생을 묵상 완료로 기록하지 않는다. 패키지 설치 시 보고된 의존성 audit 항목은 출시 전 별도 점검 대상이며 자동 강제 버전 변경은 하지 않았다.

참고: https://docs.expo.dev/versions/v57.0.0/ · https://docs.expo.dev/router/installation/

API 주소를 변경한 뒤 export 결과에 이전 주소가 남으면 `npx expo export --platform web --clear`로 캐시를 비우고 다시 생성한다. 개발 서버도 주소 변경 후 재시작한다.
