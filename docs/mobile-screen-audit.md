# Figma 앱 88개 화면·상태 점검

기준: 2026-10-04, [03 · App UI · Daegwang Teal](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=6-3). 기존 화면 ID를 유지했다. 88개는 독립 페이지뿐 아니라 모달·상태·화면 하단을 포함한다.

- **구현**: 화면과 관련 코드/API가 있다. 운영 연결·실기기 검증 완료라는 뜻은 아니다.
- **체험**: 화면 + 로컬 메모리 테스트 API로 동작한다. 운영 어댑터는 비활성이다.
- **부분**: 핵심 동작은 있지만 Figma 상태 또는 구성 일부가 남았다.
- **대기**: 구현 전 정책 결정이 필요하다.

집계: 구현 60, 대기 3, 부분 9, 체험 16 = 88개. 전체 88개 픽셀 일치나 모든 프로토타입 전이 검증을 완료했다고 간주하지 않는다. 신규 가입/계정/상담/알림은 Figma 상세 컨텍스트와 스크린샷을 참고했고 공통 카드·폼·모달을 재사용했다. 후속 작업에서 R01/S01/H04·관리자 AD01을 다시 확인했다. 알림의 구현 표시는 저장 코드 준비이며 실제 DB·푸시 검증 완료가 아니다.

| Figma 화면 | 상태 | 연결 코드/경로 | 확인 내용·남은 차이 |
| --- | --- | --- | --- |
| [A01 · 로그인](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-135) | 구현 | `/login` | 기존 Supabase 계정 로그인 코드, 실제 프로젝트 검증 대기 |
| [A02 · 회원가입](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-163) | 체험 | `/signup` | 가입·동의·인증·완료를 내부 단계로 연결; 메일 발송 없음 |
| [A03 · 약관 및 개인정보 동의](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-193) | 체험 | `/signup` | 가입·동의·인증·완료를 내부 단계로 연결; 메일 발송 없음 |
| [A04 · 비밀번호 찾기](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-216) | 체험 | `/recover` | 복구 요청·코드·재설정; 실제 메일/딥링크 대기 |
| [A05 · 비밀번호 재설정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-234) | 체험 | `/recover` | 복구 요청·코드·재설정; 실제 메일/딥링크 대기 |
| [A06 · 가입 인증 및 완료](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-256) | 체험 | `/signup` | 가입·동의·인증·완료를 내부 단계로 연결; 메일 발송 없음 |
| [A07 · 회원 기능 이용 안내](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-275) | 구현 | `MemberGate` | 회원 기능 진입 후 로그인 복귀 |
| [A08 · 회원가입 완료](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=11-5) | 체험 | `/signup` | 가입·동의·인증·완료를 내부 단계로 연결; 메일 발송 없음 |
| [A09 · 본인 확인](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=11-19) | 부분 | `/account/delete` | 탈퇴 시 현재 비밀번호 확인. 공통 재인증 화면은 미구현 |
| [B01 · 알림센터](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-134) | 구현 | `/notifications · /notifications/[id]` | 목록·분류·읽음·안전한 내부 이동과 소유자별 DB 서비스. 실제 적용·발송 대기 |
| [B02 · 알림 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-156) | 구현 | `/notifications · /notifications/[id]` | 상세·읽음 DB 서비스 준비. 실제 적용·발송 대기 |
| [B03 · 알림 설정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-173) | 구현 | `/notifications/settings` | 수신 항목 DB 서비스·버전 충돌 보호. OS 권한/푸시 미연결 |
| [B04 · 묵상 알림시간](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-203) | 구현 | `/notifications/settings` | 한국 시간 HH:mm 저장 코드 준비. 실제 예약·발송 대기 |
| [C01 · 교회](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-5) | 구현 | `/church` | 교회 허브 |
| [C02 · 담임목사](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-37) | 구현 | `/church-info/pastor` | 공개 목회자 소개 |
| [C03 · 예배안내](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-52) | 구현 | `/church-info/schedules` | 공개 예배 안내 |
| [C04 · 새가족안내](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-71) | 구현 | `/church-info/newcomer` | 새가족 안내·연락처 연결 |
| [C05 · 오시는 길](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-92) | 부분 | `/church-info/location` | 주소·외부 길찾기. 내장 지도 미구현 |
| [C06 · 연락처](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-112) | 구현 | `/church-info/contact` | 유효한 전화/메일/홈페이지 연결 |
| [C07 · 상담·심방 요청](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-300) | 체험 | `/care` | 상담/심방 종류 선택, 회원 진입·연락처 |
| [C08 · 목회상담 요청](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-319) | 체험 | `/care/new` | 상담/심방 폼·검토·전달 동의·중복 접수 방지 |
| [C09 · 심방 요청](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-348) | 체험 | `/care/new` | 상담/심방 폼·검토·전달 동의·중복 접수 방지 |
| [C10 · 상담·심방 요청 확인](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-379) | 체험 | `/care/new` | 상담/심방 폼·검토·전달 동의·중복 접수 방지 |
| [C11 · 내 상담·심방 요청](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-403) | 체험 | `/care/requests · /care/[id]` | 본인 내역·상세·취소. 실제 담당자 처리 없음 |
| [C12 · 상담·심방 요청 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-419) | 체험 | `/care/requests · /care/[id]` | 본인 내역·상세·취소. 실제 담당자 처리 없음 |
| [C13 · 교회소개](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=30-175) | 구현 | `/church-info/about` | 공개 교회 소개 |
| [H01 · 홈](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-5) | 구현 | `/` | 공개 콘텐츠·5탭·알림 진입 |
| [H02 · 홈 · 시청중](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-44) | 대기 | `/ · /worship` | 자동 시청 판정/이력 미구현. 완료 기준 결정 필요 |
| [H03 · 홈 · 시청함](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-74) | 대기 | `/ · /worship` | 자동 시청 판정/이력 미구현. 완료 기준 결정 필요 |
| [H04 · 홈 · 묵상 작성 후](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-103) | 구현 | `/ · /records` | 본인의 오늘 묵상 상태·다시 읽기·기도 이어쓰기 |
| [M01 · MY](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-225) | 구현 | `/my` | 회원/비회원 메뉴 및 기능 진입 |
| [M02 · 계정관리](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-261) | 체험 | `/account` | 표시 이름 수정, 로그아웃, 복구/탈퇴 진입 |
| [M03 · 개인정보 설정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-284) | 체험 | `/account/privacy` | 체험 정책·동의 버전. 운영 문구 미정 |
| [M04 · 회원탈퇴 안내](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-307) | 체험 | `/account/delete` | 안내·현재 비밀번호·최종 확인·테스트 데이터 삭제 |
| [M05 · MY · 비회원](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-326) | 구현 | `/my` | 회원/비회원 메뉴 및 기능 진입 |
| [M06 · 회원탈퇴 최종 확인](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=11-88) | 체험 | `/account/delete` | 안내·현재 비밀번호·최종 확인·테스트 데이터 삭제 |
| [N01 · 소식](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-360) | 구현 | `/news` | 소식 허브 |
| [N02 · 공지 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-393) | 구현 | `/notices · /notices/[id]` | 공지 목록·상세 |
| [N03 · 주보 목록](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-413) | 구현 | `/bulletins · /bulletins/[id]` | 주보 조회·PDF. 웹 내장, 네이티브 외부 열기 |
| [N04 · 주보 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-435) | 구현 | `/bulletins · /bulletins/[id]` | 주보 조회·PDF. 웹 내장, 네이티브 외부 열기 |
| [N05 · 행사 목록](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-456) | 구현 | `/events · /events/[id]` | 공개 행사 목록·상세·저장 |
| [N06 · 행사 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-473) | 구현 | `/events · /events/[id]` | 공개 행사 목록·상세·저장 |
| [N07 · 교회 일정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-493) | 구현 | `/church-calendar` | 월 전체 조회·날짜별 일정 표시·오늘 이동 |
| [N08 · 공지사항](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=30-161) | 구현 | `/notices · /notices/[id]` | 공지 목록·상세 |
| [P01 · 나의 기도](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-217) | 구현 | `/records?kind=PRAYER 및 공통 편집기` | 일반 기도 CRUD. 제목 선택 |
| [P02 · 개인 기도 기록](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-238) | 구현 | `/records?kind=PRAYER 및 공통 편집기` | 일반 기도 CRUD. 제목 선택 |
| [P03 · 개인 기도 기록하기](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-261) | 구현 | `/records?kind=PRAYER 및 공통 편집기` | 일반 기도 CRUD. 제목 선택 |
| [P04 · 개인 기도 수정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-290) | 구현 | `/records?kind=PRAYER 및 공통 편집기` | 일반 기도 CRUD. 제목 선택 |
| [P05 · 특별기도 · 응답/감사](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-316) | 구현 | `/records?kind=SPECIAL_PRAYER 및 공통 편집기` | 특별기도 CRUD. 제목 필수, 선택적 응답/감사 |
| [P06 · 특별히 품고 있는 기도](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-341) | 구현 | `/records?kind=SPECIAL_PRAYER 및 공통 편집기` | 특별기도 CRUD. 제목 필수, 선택적 응답/감사 |
| [P07 · 특별기도 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=11-62) | 구현 | `/records?kind=SPECIAL_PRAYER 및 공통 편집기` | 특별기도 CRUD. 제목 필수, 선택적 응답/감사 |
| [P08 · 특별기도 작성](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-238) | 구현 | `/records?kind=SPECIAL_PRAYER 및 공통 편집기` | 특별기도 CRUD. 제목 필수, 선택적 응답/감사 |
| [P09 · 교회 공동기도](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-263) | 부분 | `/prayers · /prayers/[id]` | 공동기도 공개 조회. 이번 주/지난 기도 구분 대기 |
| [P10 · 공동기도 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=26-280) | 부분 | `/prayers · /prayers/[id]` | 공동기도 공개 조회. 이번 주/지난 기도 구분 대기 |
| [R01 · 나의 묵상 · 캘린더](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-5) | 구현 | `/records?kind=REFLECTION` | 월 달력·날짜별 기록 표시·목록 전환 |
| [R02 · 묵상 기록 목록](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-113) | 구현 | `/records · /records/[id] · /records/new · /records/edit/[id]` | 묵상 CRUD, 말씀 스냅샷, 소유자/버전 검증 |
| [R03 · 묵상 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-133) | 구현 | `/records · /records/[id] · /records/new · /records/edit/[id]` | 묵상 CRUD, 말씀 스냅샷, 소유자/버전 검증 |
| [R04 · 묵상 작성](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-162) | 구현 | `/records · /records/[id] · /records/new · /records/edit/[id]` | 묵상 CRUD, 말씀 스냅샷, 소유자/버전 검증 |
| [R05 · 묵상 수정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-190) | 구현 | `/records · /records/[id] · /records/new · /records/edit/[id]` | 묵상 CRUD, 말씀 스냅샷, 소유자/버전 검증 |
| [S01 · 나의 일정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-604) | 구현 | `/schedules` | 월 달력·개인/공식/저장 통합·날짜별 표시·중복 제거 |
| [S02 · 교회 일정 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-714) | 구현 | `/events · /events/[id]` | 공개 행사 목록·상세·저장 |
| [S03 · 개인 일정 등록](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-740) | 구현 | `/schedules/new · /schedules/edit/[id] · /schedules/[id]` | 개인 일정 CRUD, 종일/기간/시간 검증 |
| [S04 · 개인 일정 수정](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-775) | 구현 | `/schedules/new · /schedules/edit/[id] · /schedules/[id]` | 개인 일정 CRUD, 종일/기간/시간 검증 |
| [S05 · 교회 일정 저장 · 알림](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=9-806) | 부분 | `/events/[id] · /notifications/settings` | 교회 일정 저장/해제 구현. 실제 알림 미연결 |
| [S06 · 개인 일정 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=11-39) | 구현 | `/schedules/new · /schedules/edit/[id] · /schedules/[id]` | 개인 일정 CRUD, 종일/기간/시간 검증 |
| [W01 · 말씀](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-295) | 구현 | `/worship` | 말씀 허브 |
| [W02 · 첫시간 주님께 목록](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-332) | 구현 | `/devotional · /devotional/[id]` | 목록·상세·말씀 저장·묵상/기도 진입 |
| [W03 · 첫시간 주님께](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-353) | 구현 | `/devotional · /devotional/[id]` | 목록·상세·말씀 저장·묵상/기도 진입 |
| [W04 · 설교 목록](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-385) | 구현 | `/sermons · /sermons/[id]` | 유형별 설교 목록·상세 |
| [W05 · 설교 상세](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-408) | 구현 | `/sermons · /sermons/[id]` | 유형별 설교 목록·상세 |
| [W06 · 말씀 검색](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-433) | 구현 | `/worship-search` | 검색·결과·유형/기간/본문/설교자 조건 |
| [W07 · 검색 결과](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-454) | 구현 | `/worship-search` | 검색·결과·유형/기간/본문/설교자 조건 |
| [W08 · 말씀 필터](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-478) | 구현 | `/worship-search` | 검색·결과·유형/기간/본문/설교자 조건 |
| [W09 · 저장한 말씀](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-505) | 구현 | `/saved-worship` | 본인 저장·해제·유형 필터 |
| [W10 · 시청한 묵상](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=8-525) | 대기 | `/ · /worship` | 자동 시청 판정/이력 미구현. 완료 기준 결정 필요 |
| [W11 · 첫시간 주님께 · 하단](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=11-105) | 구현 | `/devotional · /devotional/[id]` | 목록·상세·말씀 저장·묵상/기도 진입 |
| [X01 · 불러오는 중](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-357) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X02 · 기록 없음](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-372) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X03 · 연결 오류](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-386) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X04 · 검색 결과 없음](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-402) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X05 · 영상 재생 불가](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-422) | 부분 | `말씀 상세` | 영상 없을 때 안내·외부 열기. 실기기 재생 오류 검증 대기 |
| [X06 · 저장 실패](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-439) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X07 · 작성 중 나가기](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-457) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X08 · 삭제 확인](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-473) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X09 · 알림 권한 꺼짐](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-490) | 부분 | `/notifications/settings` | 기기 알림 연결 전 설명. OS 권한 확인/설정 이동 미구현 |
| [X10 · 콘텐츠 이용 불가](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-506) | 구현 | `공통 컴포넌트/각 조회·편집 화면` | 로딩·빈 결과·실패/재시도·이탈/삭제 확인·비공개 처리 |
| [X11 · 일정 변경 · 취소](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-523) | 부분 | `/events/[id] · /schedules` | 최신 공개 조회·미공개 처리. 변경/취소 전용 상태 대기 |
| [X12 · 로그인 만료](https://www.figma.com/design/rYXtTqmldFTgsYHoRfaT40?node-id=10-542) | 부분 | `개인 편집 화면` | 401 안내·같은 계정 재로그인 초안 복원 검사. 실제 만료/실기기 대기 |

## 이번 검증 범위

- 단위 테스트: 기존 47개 + 로컬 회원/UX/저장소 테스트 13개 통과.
- 브라우저: 공개 화면, 기존 개인 기록/말씀 저장/일정, 새 가입·복구·상담·알림·계정 흐름 통과. 외부 서비스는 fixture/loopback만 사용.
- 401/503 입력 유지, 중복 접수 방지, 다른 회원 접근 거부, 버전 충돌, 인증 코드 만료/재사용, 320px 가로 넘침을 검사했다.
- 체크박스·라디오·탭의 웹 접근성 상태와 모달 역할을 보완했다. 네이티브 스크린리더/키보드/푸시는 실기기 검증이 남는다.
- 전체 타입·lint·의존성 경계 및 Android/iOS/웹 로컬 export 통과. 앱스토어 빌드/서명/배포는 하지 않았다.
- 검증 스크린샷: `apps/mobile/test-results/` (생성 파일, Git 제외).

운영 전환 순서는 [화요일 연결 점검표](company-pc-checklist.md)를 따른다.
