# 라우트와 재사용 UI 설계

## 1. 공개 라우트

공개 페이지는 `src/app/(site)` route group 아래에 두되 URL에는 그룹명이 드러나지 않게 한다.

| 영역 | URL | 화면 책임 |
|---|---|---|
| 홈 | `/` | 교회 정체성, 최신 핵심 영상, 새가족, 공동체, 소식 요약 |
| 교회소개 | `/about/church` | 교회 소개 |
|  | `/about/vision` | 비전과 사명 |
|  | `/about/people` | 섬기는 사람들 |
|  | `/about/history` | 교회 연혁 |
|  | `/about/worship-info` | 예배 안내 |
| 예배 | `/worship/sunday-morning` | 주일 오전예배 최신 영상과 아카이브 |
|  | `/worship/first-hour` | 첫 시간 주님께 목록과 검색 |
|  | `/worship/sunday-afternoon` | 주일 오후예배 |
|  | `/worship/wednesday` | 수요기도회 |
|  | `/worship/special` | 특별예배 |
|  | `/worship/praise` | 찬양 |
|  | `/worship/videos/[slug]` | 영상 상세 |
| 교회소식 | `/news/notices` | 공지 목록 |
|  | `/news/notices/[slug]` | 공지 상세 |
|  | `/news/bulletins` | 주보 목록 |
|  | `/news/bulletins/[slug]` | 주보 상세 및 PDF |
|  | `/news/events` | 일정 달력/목록 |
|  | `/news/events/[slug]` | 일정 상세 |
|  | `/news/albums` | 앨범 목록 |
|  | `/news/albums/[slug]` | 앨범 상세 |
| 교회학교 | `/ministries/elementary` | 유초등부 |
|  | `/ministries/youth` | 중고등부 |
|  | `/ministries/young-adult` | 청년부 |
|  | `/ministries/blessing-football` | 축복축구교실 |
| 새가족 | `/newcomer/guide` | 처음 오셨나요 |
|  | `/newcomer/education` | 새가족 교육 |
|  | `/newcomer/register` | 새가족 등록 문의 |
|  | `/newcomer/contact` | 문의하기 |
| 기타 | `/location` | 다시 오실 길 |
|  | `/privacy` | 개인정보처리방침 |

목록의 필터와 페이지 번호는 가능한 한 search params로 표현한다. 예: `/news/notices?page=2&category=교회소식`.

## 2. 관리자 라우트

| URL | 권한 | 화면 책임 |
|---|---|---|
| `/admin/login` | 공개 | 로그인 |
| `/admin/dashboard` | ADMIN 이상 | 운영 요약과 빠른 등록 |
| `/admin/worship` | ADMIN 이상 | 예배 콘텐츠 목록 |
| `/admin/worship/new` | ADMIN 이상 | 예배 콘텐츠 등록 |
| `/admin/worship/[id]/edit` | ADMIN 이상 | 예배 콘텐츠 수정 |
| `/admin/notices` | ADMIN 이상 | 공지 CRUD |
| `/admin/bulletins` | ADMIN 이상 | 주보 CRUD |
| `/admin/events` | ADMIN 이상 | 일정 CRUD |
| `/admin/albums` | ADMIN 이상 | 앨범 CRUD |
| `/admin/pages` | ADMIN 이상 | 고정 페이지 내용 관리 |
| `/admin/people` | ADMIN 이상 | 섬기는 사람들 관리 |
| `/admin/ministries` | ADMIN 이상 | 교회학교·사역 관리 |
| `/admin/inquiries` | SUPER_ADMIN | 문의 조회와 처리 |
| `/admin/admins` | SUPER_ADMIN | 관리자 계정과 역할 관리 |
| `/admin/settings` | SUPER_ADMIN | 사이트 설정 |

리소스별 `new`, `[id]/edit` 패턴을 동일하게 적용한다. 삭제와 상태 변경은 별도 공개 페이지를 만들지 않고 Server Action으로 처리한다.

## 3. 재사용 UI 컴포넌트

### 공통 Material UI primitive

- `Button`, `IconButton`, `LinkButton`
- `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`
- `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`
- `Tabs`, `Badge`, `Tooltip`, `Separator`
- `Card`, `Skeleton`, `EmptyState`, `ErrorState`
- `Pagination`, `SearchField`, `FilterBar`
- `FormField`, `FieldError`, `FileDropzone`
- `Toast` 또는 접근 가능한 상태 알림 영역

### 공개 사이트

- `SiteHeader`, `DesktopNavigation`, `MobileNavigation`, `SiteFooter`
- `PageHero`, `SectionHeading`, `SectionShell`
- `Breadcrumbs`, `SubNavigation`
- `HeroFeature`, `PrimaryCallToAction`
- `VideoEmbed`, `FeaturedWorshipCard`, `WorshipCard`, `WorshipMeta`
- `ChurchIntro`, `PastorIntro`, `WorshipSchedule`
- `NoticeList`, `BulletinCard`, `EventCard`, `AlbumCard`
- `MinistryCard`, `NewcomerSteps`, `LocationSummary`
- `ShareButton`, `AttachmentList`

### 관리자

- `AdminShell`, `AdminSidebar`, `AdminHeader`, `AdminBreadcrumbs`
- `DashboardStat`, `QuickCreateCard`
- `DataTable`, `TableToolbar`, `RowActions`, `StatusBadge`
- `ContentEditorShell`, `PublishControls`, `UnsavedChangesGuard`
- `ImageUploader`, `DocumentUploader`, `MediaPicker`
- `YouTubeUrlField`, `YouTubePreview`
- `DeleteContentDialog`, `ActivitySummary`

### 컴포넌트 설계 기준

- 링크와 버튼의 의미를 구분하고 키보드 조작을 보장한다.
- 클릭 영역 높이는 최소 44px, 모바일 본문은 최소 16px로 한다.
- 모든 콘텐츠 이미지에는 관리 가능한 대체 텍스트를 둔다.
- 동영상 영역은 16:9 비율을 유지한다.
- 장식적 움직임은 `prefers-reduced-motion`에서 제거한다.
- 공개 화면의 최대 폭은 1200px, 본문은 760~820px로 제한한다.
