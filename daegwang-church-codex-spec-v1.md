# 독산대광교회 홈페이지 제작 명세서
## Codex 전달용 v1.0

## 1. 프로젝트 개요

### 프로젝트명
독산대광교회 공식 홈페이지 및 관리자 CMS

### 도메인
- 운영 도메인: `https://daegwangchurch.kr`
- 관리자: `https://daegwangchurch.kr/admin`

### 프로젝트 목적
독산대광교회를 처음 접하는 방문자에게 교회의 정체성, 예배, 공동체, 다음세대 사역을 소개하는 공식 홍보 홈페이지를 구축한다.

동시에 기존 성도가 주일 오전예배, `첫 시간 주님께`, 주보, 공지, 일정을 쉽게 확인할 수 있도록 한다.

관리자는 개발자 도움 없이 예배 영상, 공지, 주보, 일정, 앨범, 고정 페이지와 문의를 직접 관리할 수 있어야 한다.

### 중요 우선순위
1. 홈페이지의 궁극적 목적은 교회 소개와 홍보다.
2. 가장 중요한 콘텐츠는 주일 오전예배 전체 영상이다.
3. 두 번째 핵심 콘텐츠는 매일 업로드되는 `첫 시간 주님께`다.
4. 홈페이지를 예배 아카이브 전용 서비스처럼 만들지 않는다.
5. 예배 콘텐츠는 교회를 소개하는 가장 강력한 콘텐츠로 활용한다.

---

## 2. 교회 핵심 콘텐츠

### 핵심 목회철학
- 예배를 통해 세상이 회복됨을 믿습니다.
- 모든 길은 예배로 통한다.

### 기존 상징 문구
- 일어나라 빛을 발하라

### 교회 소개
대광교회는 대한예수교장로회(고신)에 속한 교회로, 오직 성경만을 믿음과 삶의 최종 권위로 삼는다.

1988년 5월 1일 현재 교회 자리에 있던 신안연립에서 고 박성덕 원로목사 가정이 첫 예배를 드리며 시작했다.

역대 목회자:
- 1대 박성덕 원로목사
- 2대 김수복 목사
- 3대 고 김지상 목사
- 4대 이승희 목사
- 현재 오훈 담임목사

### 새가족 과정
1. 새가족 등록
2. `풍성한 삶의 초대` 4주 과정
3. 연령별 기관 공동체 참여
4. `풍성한 삶의 기초` 13주 과정
5. 피차 가르치고 권면하며 함께 성장

### 주요 부서 및 사역
- 유초등부
- 중고등부
- 청년부
- 새가족부
- 축복축구교실

### 축복축구교실
- 대상: 유초등부부터 청년부
- 시간: 매주 토요일 오후 2시~4시
- 전문 코치의 훈련과 게임
- 모든 순서 후 복음 나눔
- 문의 연락처는 관리자에서 공개 여부를 선택할 수 있게 한다.

### 공식 유튜브
`https://www.youtube.com/@서울독산동대광교회`

현재 설교만 별도로 제공하는 방식이 아니라 주일 오전예배, 주일 오후예배, 수요기도회 등 예배 전체 라이브를 송출하고 다시보기로 남긴다.

`첫 시간 주님께`는 매일 묵상 영상으로 업로드한다.

---

## 3. 디자인 시스템

### 디자인 방향
- Modern & Warm
- 밝고 따뜻하며 경건한 분위기
- 실제 교회 사진 중심
- 모바일 우선
- 과한 애니메이션, 글래스 효과, 화려한 그라데이션 지양

### 서체
- 로고 서체: 코레일 둥근고딕
- 일반 홈페이지 및 관리자 UI: Pretendard
- 로고는 이미지 또는 SVG로 사용하고 일반 UI에 코레일 둥근고딕을 적용하지 않는다.

### 색상
기존 로고의 청록색을 대표 색상으로 사용한다.

잠정 팔레트:
- Primary 600: `#1599AC`
- Primary 500: `#1BA6B9`
- Primary 100: `#DDF4F6`
- Primary 50: `#F0FAFB`
- Text Primary: `#262321`
- Text Secondary: `#66615E`
- Background: `#FFFFFF`, `#FCFBF9`, `#F5F5F4`
- Border: `#E7E5E4`

정확한 대표 색상은 로고 원본 확보 후 조정 가능하도록 CSS 변수로 관리한다.

### 접근성
- 모바일 본문 최소 16px
- 버튼 높이 최소 44px
- 충분한 색상 대비
- 키보드 접근 가능
- 이미지 alt 필수
- 영상 16:9 유지
- `prefers-reduced-motion` 대응

---

## 4. 기술 스택

### 필수
- Next.js App Router
- TypeScript
- Vercel
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Storage
- Supabase Auth
- Prisma ORM
- React Hook Form
- Zod

### 권장
- Server Components 우선
- 데이터 변경은 Server Actions 또는 Route Handlers
- 관리자 테이블은 TanStack Table 사용 가능
- 공개 페이지 데이터 조회는 캐싱과 재검증 적용
- 업로드는 Supabase Storage signed/public URL 정책을 명확히 구분

### 인증 역할
초기에는 2개 역할만 구현한다.
- `SUPER_ADMIN`
- `ADMIN`

문의 내용은 개인정보이므로 기본적으로 `SUPER_ADMIN`만 조회 가능하게 하고, 추후 문의 담당 권한을 확장할 수 있게 구조를 둔다.

---

## 5. 공개 홈페이지 메뉴

### 상단 메뉴
1. 교회소개
2. 예배
3. 교회소식
4. 교회학교
5. 새가족
6. 오시는 길

### 교회소개
- 교회소개
- 비전과 사명
- 섬기는 사람들
- 교회연혁
- 예배안내

### 예배
- 주일 오전예배
- 첫 시간 주님께
- 주일 오후예배
- 수요기도회
- 특별예배
- 찬양

### 교회소식
- 공지사항
- 주보
- 교회일정
- 행사앨범

### 교회학교
- 유초등부
- 중고등부
- 청년부
- 축복축구교실

### 새가족
- 처음 오셨나요?
- 새가족 등록
- 새가족 교육
- 문의하기

### 오시는 길
단일 페이지

---

## 6. 공개 URL

```text
/
/about/church
/about/vision
/about/people
/about/history
/about/worship-info

/worship/sunday-morning
/worship/first-hour
/worship/sunday-afternoon
/worship/wednesday
/worship/special
/worship/praise
/worship/videos/[slug]

/news/notices
/news/notices/[slug]
/news/bulletins
/news/bulletins/[slug]
/news/events
/news/events/[slug]
/news/albums
/news/albums/[slug]

/ministries/elementary
/ministries/youth
/ministries/young-adult
/ministries/blessing-football

/newcomer/guide
/newcomer/education
/newcomer/register
/newcomer/contact

/location
/privacy
```

---

## 7. 메인페이지 구성

메인페이지의 목적은 모든 정보를 나열하는 것이 아니라 30초 안에 대광교회의 정체성과 방문 정보를 이해시키는 것이다.

### 섹션 순서
1. Header
2. Hero
3. 예배시간 요약
4. 최신 주일 오전예배
5. 최신 `첫 시간 주님께`
6. 대광교회 소개
7. 담임목사 대표 소개
8. 새가족 안내
9. 교회학교 및 축복축구교실
10. 교회소식
11. 행사앨범
12. 오시는 길
13. Footer

### Hero
문구:
```text
예배를 통해
세상이 회복됨을 믿습니다.

모든 길은 예배로 통합니다.
```

버튼:
- 예배 안내
- 처음 오셨나요?

배경 영상은 사용하지 않는다. 실제 예배 또는 공동체 사진을 사용한다.

### 최신 주일 오전예배
가장 큰 콘텐츠 영역으로 표시한다.
- 썸네일
- 예배 날짜
- 예배명
- 설교 제목
- 성경 본문
- 설교자
- 예배 전체 보기
- 지난 주일예배 보기

### 최신 첫 시간 주님께
- 최신 영상 썸네일
- 날짜
- 묵상 제목
- 성경 본문
- 짧은 설명
- 오늘 묵상 보기
- 지난 묵상 보기

### 교회 소개 요약
예시:
```text
1988년 독산동에서 첫 예배를 드린 대광교회는
예배와 말씀을 중심으로 다음세대와 지역을 섬기는
대한예수교장로회(고신) 교회입니다.
```

---

## 8. 예배 콘텐츠 규칙

하나의 `worship_contents` 모델로 통합한다.

### 유형
```text
SUNDAY_MORNING
FIRST_HOUR
SUNDAY_AFTERNOON
WEDNESDAY
SPECIAL
PRAISE
```

### 공통 필드
- id
- type
- title
- slug
- contentDate
- youtubeUrl
- youtubeVideoId
- thumbnailUrl
- description
- preacher
- sermonTitle
- scripture
- summary
- status
- isPinned
- publishedAt
- createdAt
- updatedAt
- deletedAt

### 노출 규칙
- 메인 주일 오전예배: 공개 상태이며 가장 최근 `SUNDAY_MORNING`
- 메인 첫 시간 주님께: 공개 상태이며 가장 최근 `FIRST_HOUR`
- 관리자가 고정한 콘텐츠가 있으면 최신 콘텐츠보다 우선
- 라이브 상태 자동 판별은 1차 필수 아님
- 관리자 수동 `isLive` 또는 라이브 URL 필드를 둘 수 있음

### 유튜브 입력 UX
관리자가 URL을 입력하면:
- video ID 파싱
- 기본 썸네일 URL 생성
- 유효한 YouTube URL인지 검증

YouTube Data API 자동 동기화는 후순위다.

---

## 9. 공개 상세 페이지 요구사항

### 주일 오전예배
- 최신 영상 상단 대형 노출
- 지난 영상 목록
- 연도/월 필터
- 더보기 또는 페이지네이션

### 첫 시간 주님께
- 최신 묵상 상단 노출
- 날짜별 목록
- 월별 필터
- 제목 검색
- 매일 콘텐츠이므로 카드 밀도를 높게 구성

### 영상 상세
- YouTube 임베드
- 예배 유형
- 날짜
- 제목
- 설교 제목
- 본문
- 설교자
- 설명
- 이전/다음 영상
- 유튜브에서 보기
- 공유
- 댓글 없음

### 공지
- 중요 공지 상단
- 카테고리
- 검색
- 상세, 첨부파일, 이전/다음

### 주보
- 표지
- 예배 날짜
- PDF 미리보기
- 다운로드
- 연도 필터
- 관련 주일 오전예배 연결

### 일정
- 데스크톱: 월간 달력 + 목록 전환
- 모바일: 목록 기본
- 지난 일정 자동 구분

### 앨범
- 앨범 단위 목록
- 상세 이미지 그리드
- 라이트박스
- 원본 전체 다운로드 제외

---

## 10. 관리자 URL

```text
/admin/login
/admin/dashboard
/admin/worship
/admin/worship/new
/admin/worship/[id]/edit
/admin/notices
/admin/bulletins
/admin/events
/admin/albums
/admin/pages
/admin/people
/admin/ministries
/admin/inquiries
/admin/admins
/admin/settings
```

---

## 11. 관리자 기능

### 공통
- 목록, 검색, 필터, 페이지네이션
- 등록, 수정, 소프트 삭제
- 임시저장, 공개, 비공개
- 저장하지 않은 변경사항 이탈 경고
- 필수값 검증
- 파일 형식/크기 검증
- 성공/오류 토스트

### 관리자 대시보드
빠른 등록:
- 주일 오전예배
- 첫 시간 주님께
- 주보
- 공지
- 일정

운영 현황:
- 최근 주일 오전예배
- 최신 첫 시간 주님께
- 이번 주 주보
- 미처리 문의
- 예정 일정

### 예배 콘텐츠
목록 컬럼:
- 썸네일
- 유형
- 제목
- 날짜
- 설교자
- 상태
- 메인 고정
- 수정일
- 관리

등록:
- 유형
- YouTube URL
- 제목
- 날짜
- 설명
- 설교 제목
- 본문
- 설교자
- 말씀 요약
- 대표 이미지
- 상태
- 메인 고정

유형에 따라 불필요한 필드는 숨기거나 선택값으로 처리한다.

### 공지
- 제목
- 카테고리
- 본문
- 첨부파일
- 중요 공지
- 상단 고정
- 공개 상태
- 공개 시작/종료일

### 주보
- 제목
- 예배 날짜
- PDF
- 표지 이미지
- 요약
- 상태

### 일정
- 일정명
- 분류
- 시작/종료일
- 종일 여부
- 시간
- 장소
- 부서
- 설명
- 상태

반복 일정은 후순위다.

### 앨범
- 앨범명
- 행사 날짜
- 카테고리
- 설명
- 대표 이미지
- 다중 이미지 업로드
- 이미지 순서
- 공개 여부
- 메인 노출 여부

### 페이지 관리
고정 페이지의 템플릿은 코드로 유지하고 내용만 관리한다.
관리 대상:
- 교회 소개
- 비전과 사명
- 교회 연혁
- 예배 안내
- 새가족 안내
- 새가족 교육
- 오시는 길

자유로운 페이지 빌더는 만들지 않는다.

### 섬기는 사람들
- 이름
- 직분
- 담당 사역
- 소개
- 약력
- 프로필 사진
- 대표 인물
- 공개 여부
- 노출 순서

담임목사와 기타 교역자를 하나의 관리 기능으로 통합한다.

### 교회학교·사역
- 이름
- 유형
- 소개
- 대상
- 모임 요일/시간
- 장소
- 담당 교역자
- 담당자
- 문의 연락처
- 대표 이미지
- 활동
- 공개 여부
- 순서

초기 데이터:
- 유초등부
- 중고등부
- 청년부
- 축복축구교실

### 문의
유형:
```text
NEWCOMER
COUNSELING
PRAYER
GENERAL
```

상태:
```text
NEW
CHECKED
CONTACTING
COMPLETED
ON_HOLD
```

기능:
- 목록
- 필터
- 상세
- 연락처 마스킹
- 상태 변경
- 관리자 메모
- 처리 이력
- 삭제

---

## 12. 데이터베이스 모델

최소 모델:
```text
admin_profiles
media
pages
history_items
worship_schedules
people
ministries
worship_contents
notices
notice_attachments
bulletins
events
albums
album_images
inquiries
inquiry_notes
site_settings
activity_logs
```

### 공통 enum
```text
ContentStatus:
DRAFT
PUBLISHED
PRIVATE

AdminRole:
SUPER_ADMIN
ADMIN
```

### soft delete
주요 콘텐츠에 `deletedAt`을 둔다.

### slug
공개 상세 페이지가 필요한 콘텐츠는 고유 slug를 사용한다.

### 정렬
- `sortOrder`
- 최신순 기본
- 필요 시 `isPinned`

### site_settings
key-value를 무분별하게 쓰기보다 주요 설정은 타입이 명확한 단일 레코드 또는 Prisma Json 필드로 관리한다.

---

## 13. 파일 및 스토리지

Supabase Storage bucket 예시:
```text
public-assets
private-files
```

폴더:
```text
logos/
people/
worship/
bulletins/
notices/
albums/
ministries/
pages/
site/
```

### 공개 파일
- 로고
- 프로필 사진
- 앨범 사진
- 대표 이미지
- 공개 주보 PDF

### 비공개 파일
- 문의 관련 첨부가 생길 경우
- 관리자 내부 파일

### 이미지 처리
- JPG, PNG, WebP
- 업로드 전 크기 제한
- Next/Image 사용
- 가능하면 WebP 변환
- 원본 파일명은 DB에 보존하되 저장 파일명은 UUID 사용

### 문서
- PDF
- 공지 첨부는 PDF, DOCX, HWP 허용 여부를 설정값으로 관리 가능
- 실행 파일 금지

---

## 14. SEO

필수:
- Next.js Metadata API
- 페이지별 title/description
- Open Graph
- sitemap.xml
- robots.txt
- canonical URL
- Organization 또는 Church 관련 구조화 데이터 검토
- 유튜브 영상 상세에는 VideoObject 구조화 데이터 검토

기본 사이트명:
- 독산대광교회
- 대한예수교장로회(고신) 대광교회

---

## 15. 개인정보 및 보안

- 문의 폼에 개인정보 수집 동의 필수
- 주민등록번호, 상세주소, 과도한 신앙 이력 수집 금지
- 서버에서 Zod 검증
- 관리자 라우트 보호
- RLS 정책 적용
- Service Role Key는 서버에서만 사용
- 로그인 실패 제한
- 문의 연락처 목록에서 마스킹
- 관리자 작업 로그 기록
- 환경변수에 비밀키 저장
- 업로드 MIME type 검증
- XSS 방지를 위해 HTML 편집기 출력 sanitize

---

## 16. 반응형

```text
Mobile: 0~767px
Tablet: 768~1023px
Desktop: 1024px 이상
Wide: 1440px 이상
```

- 공개 콘텐츠 최대 너비 약 1200px
- 긴 본문 760~820px
- 관리자 1280~1440px
- 모바일 카드 1열
- 태블릿 2열
- 데스크톱 3~4열
- 관리자 모바일은 조회와 간단 등록 중심

---

## 17. 1차 개발 범위

### 필수
- 공개 홈페이지 전체 메뉴
- 관리자 인증
- 관리자 대시보드
- 예배 콘텐츠 CRUD
- 공지 CRUD
- 주보 CRUD
- 일정 CRUD
- 앨범 CRUD
- 고정 페이지 관리
- 섬기는 사람 관리
- 교회학교·사역 관리
- 문의 접수 및 관리
- 사이트 설정
- 이미지/PDF 업로드
- SEO 기본
- 반응형
- 도메인 연결을 위한 Vercel 구성

### 후순위
- YouTube Data API 자동 동기화
- 예약 공개
- 반복 일정
- PDF 첫 페이지 자동 썸네일
- 관리자 세부 권한
- 문의 이메일/문자 알림
- 콘텐츠 복원 UI
- 감사 로그 전용 화면
- PWA
- 교적
- 재정
- 모바일 네이티브 앱

---

## 18. 개발 순서

### Phase 1. 기반
1. Next.js 프로젝트 생성
2. Tailwind/shadcn 설정
3. Pretendard 적용
4. 디자인 토큰 설정
5. Supabase 프로젝트 연결
6. Prisma schema 작성
7. 인증 및 관리자 라우트 보호
8. 공통 레이아웃 작성

### Phase 2. 핵심 공개 화면
1. Header/Footer
2. 메인페이지
3. 교회소개
4. 예배안내
5. 오시는 길
6. 새가족 안내

### Phase 3. 핵심 CMS
1. 예배 콘텐츠
2. 주일 오전예배 공개 화면
3. 첫 시간 주님께 공개 화면
4. 공지
5. 주보
6. 일정

### Phase 4. 공동체 콘텐츠
1. 섬기는 사람들
2. 교회학교·사역
3. 앨범
4. 문의

### Phase 5. 품질
1. SEO
2. 접근성
3. 반응형
4. 오류/빈 상태
5. 보안
6. 로딩 최적화
7. 테스트
8. 샘플 데이터

---

## 19. Codex 작업 원칙

1. 처음부터 모든 기능을 한 번에 구현하지 말 것.
2. 각 Phase 시작 전 구현 계획과 변경 파일 목록을 제시할 것.
3. 기존 확정 기획을 임의로 변경하지 말 것.
4. UI 문구와 데이터 모델을 임의로 과도하게 확장하지 말 것.
5. 재사용 컴포넌트를 우선 설계할 것.
6. Server Components를 기본으로 하고 Client Component 사용을 최소화할 것.
7. 비밀키와 개인정보가 클라이언트 번들에 노출되지 않게 할 것.
8. 각 Phase 종료 시 lint, type-check, build를 수행할 것.
9. 마이그레이션과 seed 파일을 함께 관리할 것.
10. README에 로컬 실행, Supabase 설정, Vercel 배포 방법을 기록할 것.

---

## 20. Codex에게 처음 요청할 작업

아래 작업까지만 먼저 진행한다.

```text
위 명세를 검토한 뒤 바로 전체 기능을 개발하지 말고 다음을 수행해 주세요.

1. 프로젝트 구조와 구현 계획을 제안합니다.
2. 기술 선택에서 충돌하거나 불명확한 부분을 정리합니다.
3. Prisma 데이터 모델 초안을 작성합니다.
4. 공개/관리자 라우트 구조를 제안합니다.
5. 재사용 UI 컴포넌트 목록을 작성합니다.
6. Phase 1 개발 작업을 세부 태스크로 나눕니다.
7. 아직 코드를 대규모로 작성하지 말고, 먼저 계획과 스키마 초안을 보여주세요.

확정된 핵심:
- 목적은 교회 홍보·소개 홈페이지
- 가장 중요한 콘텐츠는 주일 오전예배 전체 영상
- 두 번째는 매일의 첫 시간 주님께
- 공개 홈페이지와 관리자 CMS 동시 구축
- Next.js + TypeScript + Vercel + Supabase + Prisma
- Pretendard 사용
- 기존 청록색 로고 아이덴티티 유지
```

---

## 21. 완료 기준

- `daegwangchurch.kr`에서 정상 접속
- PC, 태블릿, 모바일 정상
- 최신 주일 오전예배 자동 노출
- 최신 첫 시간 주님께 자동 노출
- 관리자가 모든 핵심 콘텐츠 CRUD 가능
- 유튜브 URL 입력 시 영상 ID와 썸네일 처리
- 주보 PDF 열람 및 다운로드
- 문의 접수와 관리자 처리
- 권한 없는 관리자 접근 차단
- 이미지와 PDF 정상 업로드
- 기본 SEO 및 sitemap 제공
- lint, type-check, build 통과
- 운영 매뉴얼과 README 제공
