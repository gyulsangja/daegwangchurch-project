# 대광교회 표기·모임 소식 설계

2026-10-05 후속: 실제 모임/소속/담당자/공지 저장소와 운영 서비스 및 `/admin/groups`를 구현하고 독립 PostgreSQL 권한 검사를 통과했다. 관심 선택과 소속 승인을 분리하며 관리자 페이지에서 등록·수정·담당자 지정·소속 승인/해제를 준비했다. 실제 모임과 절차가 미정이어서 앱 운영 플래그는 비활성이다. 기존 아래 ‘이번 구현 범위’는 10월 4일 체험 구현 기록이며 최신 제한은 [출시 준비](RELEASE_READINESS.md)를 따른다.

2026-10-04 사용자 요청: 공식 명칭은 대한예수교장로회 대광교회. 작은 교단명과 큰 교회명을 배치하고, 상업적인 느낌을 줄이며 전도회·소속별 소식을 준비한다.

## 교회다운 표현

- 앱 상단: 로고 옆 작은 `대한예수교장로회` / 큰 `대광교회` 두 줄. 320px에서 알림 버튼과 충돌하지 않도록 확인했다.
- 앱 이름·교회 안내·홈페이지/관리자 코드의 기본 표기도 대광교회로 정정했다. 기존 DB의 저장된 이름은 변경하지 않았다. 회사 PC에서 사이트 설정에 예전 이름이 있으면 별도로 정정한다. seed 기본 문자열만 수정했으며 seed는 실행하지 않았다.
- 홈 말씀 카드는 아이보리 바탕의 수채화 삽화와 청록 버튼을 사용한다. 글씨는 이미지 밖에 배치하고 기도·상담 카드에는 기존 선 아이콘을 재사용했다.
- 삽화는 실제 교회·성경 본문 사진이 아닌 장식용 AI 일러스트다. 교회 고유 로고는 변경하지 않았다.

## 모임 소식 운영 원칙 제안

| 구분 | 읽는 사람 | 선택/권한 | 알림 대상 |
| --- | --- | --- | --- |
| 교회 전체 공지 | 비회원 포함 누구나 | 기존 공지 | 기존 공지 수신 동의 |
| 모임 공개 소식 | 비회원 포함 누구나 | 관심 모임을 선택해 모아보기 | 관심 구독 + 모임 공개 소식 수신 동의 |
| 소속 전용 안내 | 서버에서 확인한 해당 소속 | 담당 관리자 승인/연계 필요. 사용자 관심 선택은 권한이 아님 | 확인된 소속 + 해당 수신 동의 |

실제 전도회 명칭, 대상, 중복 소속, 승인 담당자·절차는 아직 확정하지 않았다. 나이·성별·앱 가입만으로 소속을 추정하지 않는다. 모임 이름은 관리자 관리 항목으로 설계하고 현재는 `[예시]` 모임을 사용한다.

소속 전용 공지는 기존 공개 공지 본문/첨부에 저장해 두고 앱에서 숨기는 방식으로 구현하면 안 된다. 서버에서 권한을 검사하고 비공개 첨부도 별도 인가해야 한다. 공개 홈페이지 동시 발행을 차단하고, 소속 해제 후 목록·상세·알림 링크 권한을 다시 검사한다. 담당자 역할은 본인이 관리하는 모임에만 한정하고 승인·대상 변경·발행을 감사 기록에 남긴다. 개인 기도/묵상이나 상담 기록은 대상 선정에 사용하지 않는다.

알림은 기본 꺼짐이다. 공개 소식 구독과 소속 승인은 별개이며 운영 푸시 연결 시 소속 안내의 수신 동의도 별도로 구현해야 한다. 발송 시에도 권한을 재확인하고 잠금화면에 민감한 제목/본문을 노출하지 않는다. 중요한 공지라는 이유로 선택 동의를 자동 우회하지 않는다. 발송 결과는 수신/읽음 보장으로 표시하지 않는다.

## 이번 구현 범위

- `/groups`: 비회원 공개 모임 피드, 로그인 후 관심 모임 선택·알림 선택 저장, 전체/관심/내 소속 분류, 이탈 확인·중복 저장 방지·버전 충돌 처리. 홈·소식·MY에서 진입한다.
- `/api/v1/groups`, `/api/v1/me/groups`: contracts/api-client와 메모리 체험 API. 가상 `demo@example.invalid`만 예시 전도회 소속을 서버에서 부여한다. 다른 계정은 관심을 선택해도 소속 안내를 받지 못한다.
- 운영 API는 503으로 닫혀 있다. 실제 모임 DB·담당자 승인·발송·푸시 연결은 하지 않았다. 실제 소속 이름이나 권한을 임의로 확정하지 않았다.
- 관리자 개발 체험에 모임 이름·공지 제목·열람 대상·홈페이지 공개·알림 요청·최종 확인을 추가했다. 소속 전용+홈페이지 조합을 거부한다. 실제 발행·알림은 0건이다.
- 단위 검사: 비회원 공개 피드에 소속 데이터 미포함, 다른 회원 격리, 관심≠소속, 위조된 소속 입력 거부, 잘못된 모임 ID·중복 ID·버전 충돌을 계약/서비스에서 처리한다.
- 브라우저: 320px 이름/삽화, 로그인 복귀, 관심 저장/필터, 소속 분리, 관리자 공개 범위 오류/확인 검증. 이미지 원본 높이로 늘어나던 문제는 고정 비율 컨테이너로 수정했다.

## 이미지 출처·재현 정보

내장 `image_gen` 도구 사용. 원본: `apps/mobile/assets/illustrations/morning-word.png`. 기존 Figma 로고/아이콘과 분리한 신규 자산이다. 생성 프롬프트:

> Create one wide 3:2 illustration asset for a Korean Presbyterian church mobile app, not a UI mockup. Gentle hand painted watercolor on warm ivory paper, muted sage leaves and deep teal accents with soft morning honey light. An open Bible with no legible text on a simple oak table, a modest olive sprig, softly luminous window shadows. Quiet, welcoming, human and contemplative, not luxurious or commercial, not glossy 3D. Plenty of airy cream space, no typography, no letters, no watermark, no people, no church architecture or invented church logo. Composition stays recognizable cropped to a wide horizontal band. Intended as a warm editorial illustration above actual app text, keep contrast restrained and texture delicate.
