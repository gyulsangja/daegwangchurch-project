# 예배 CMS 운영 연결 기록

## 구현 완료

- Prisma 최초 migration
- Supabase Data API와 Storage RLS 정책
- YouTube watch, youtu.be, shorts, live, embed URL 파싱
- 영상 ID, canonical URL, 기본 썸네일 URL 생성
- 예배 콘텐츠 등록, 수정, 소프트 삭제 Server Action
- Zod 서버 검증과 입력 필드 오류 표시
- CREATE, UPDATE, DELETE 활동 로그
- 공개 상태와 메인 고정 관리
- 관리자 예배 전용 목록, 등록, 수정 화면
- 공개 홈, 예배 목록, 영상 상세의 Prisma 조회
- DB 미연결 또는 데이터 없음 상태의 샘플 fallback

## 원격 적용 대기

Supabase 접속 정보를 설정한 뒤 다음 순서로 적용한다.

1. `npm run db:deploy`
2. Supabase SQL Editor에서 `supabase/rls.sql` 실행
3. Supabase Auth에 최초 관리자 생성
4. seed 환경변수 입력
5. `npm run db:seed`

## 다음 구현 후보

- Supabase Storage 실제 업로드 Route Handler
- 공지, 주보, 일정 CRUD를 동일 패턴으로 연결
- 관리자 목록 검색, 필터, 페이지네이션
- 삭제 확인 Dialog와 성공 Toast
- 실제 DB를 사용하는 통합 테스트
