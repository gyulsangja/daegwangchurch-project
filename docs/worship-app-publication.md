# 말씀 앱 발행 및 공개 API

## 운영 활성화 전

- 추가형 migration: `20261002120000_worship_app_publication`.
- 기존 홈페이지 status/publishedAt 및 기존 행은 변경하지 않는다. 기존 자료는 앱에 자동 발행되지 않는다.
- 별도 검증 환경에서 `npm run db:deploy`를 적용한 후 서버 환경변수 `APP_PUBLICATION_ENABLED=true`를 설정한다. 기본값은 비활성이다.
- 비활성 상태에서는 관리자 앱 발행 패널을 숨기고 API는 503을 반환한다. migration 적용 전 활성화하지 않는다.
- 새 테이블은 RLS가 활성화되고 anon/authenticated 직접 읽기를 허용하지 않는다. Prisma 서버 연결 역할이 조회·저장 권한을 갖는지 배포 환경에서 확인한다.
- 현재 버전은 운영 DB에 자동 적용하지 않는다. 개인 묵상·기도 데이터와 회원 인증 API는 포함하지 않는다.

## 관리자 동작

1. 기존 말씀 폼에서 내용을 저장한다. 홈페이지 상태는 기존 규칙을 유지한다.
2. 수정 화면 아래 앱 발행 패널에서 저장된 내용을 발행한다.
3. 앱은 발행 시점의 revision을 읽는다. 이후 폼 수정은 재발행 전까지 앱에 반영되지 않는다.
4. 앱 발행 중단은 APP 포인터만 제거한다. 홈페이지 상태와 과거 revision은 유지한다.
5. 원본 소프트 삭제는 홈페이지와 앱에서 모두 숨긴다.

홈페이지 비공개만으로 이미 발행된 앱 콘텐츠가 숨겨지지는 않는다. 앱은 앱 발행 중단을 사용한다. 같은 저장본 중복 발행은 한 revision/활동 로그만 생성한다. 저장 시각이 바뀐 화면에서 발행하면 충돌 안내를 반환한다. 현재는 기존 활성 관리자 권한을 적용하며 발행 전담 역할은 별도 후속 작업이다.

## 공개 API

API 호스트는 apps/admin이다. 로컬 기본 주소는 http://localhost:3001 이며 홈페이지(3000)와 분리되어 있다. DTO는 packages/contracts, 조회/발행은 packages/server, migration은 packages/database에서 관리한다.

- `GET /api/v1/worship?type=FIRST_HOUR&limit=20&cursor=...`
- `GET /api/v1/worship/:id`
- 유형: FIRST_HOUR, SUNDAY_MORNING, SUNDAY_AFTERNOON, WEDNESDAY, SPECIAL, PRAISE.
- limit: 1~50, 기본 20. 발행 시각 내림차순, 동일 시각은 발행 ID 내림차순.
- 목록: `{ data: [...], nextCursor: string | null }`.
- 상세: `{ data: {...} }`.
- 항목: id, version, type, title, contentDate, youtube(videoId/url/thumbnailUrl), preacher, sermonTitle, scriptureReference, description, summary.
- 성경 본문 필드·관리자 정보·내부 상태·과거 revision은 반환하지 않는다.
- 404: 미발행·웹 전용·삭제·종료·미래 발행·없는 ID. 422: 잘못된 조건/커서. 503: 비활성 또는 DB/조회 실패.
- 오류: `{ error: { code, message, requestId } }`. DB 장애를 빈 목록으로 반환하지 않는다.
- `Cache-Control: no-store`. 목록 커서는 조회 중 재발행이 일어나면 위치가 달라질 수 있으며 목록 새로고침이 필요할 수 있다.

현재는 즉시 발행/중단 UI만 제공한다. 시작·종료 조건은 조회와 테스트에 포함하지만 예약 UI·작업 큐·푸시 발송은 후속 범위다. WEB revision 이행은 아직 하지 않았다.

## 재현 검증

Docker 실행 상태에서:

```sh
npm test
npm run test:integration:worship
npm run test:integration:worship:http
npm run lint
npm run type-check
```

HTTP 명령은 빌드 후 일회용 PostgreSQL에 모든 SQL migration을 적용하고, 실제 Prisma 서비스 및 프로덕션 HTTP 서버를 검증한다. 기존 .env의 DB 연결 대신 생성한 임시 DB만 쓰고, 서버와 DB 컨테이너를 종료한다. 사용자 계정으로 로그인해서 관리자 버튼을 누르는 브라우저 검증은 별도로 필요하다.
