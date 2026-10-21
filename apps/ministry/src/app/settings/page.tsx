import { workspace } from '@/lib/workspace';
export default async function Settings() {
  await workspace();
  return <><div className="page-heading"><div><p className="eyebrow">개발 현황</p><h1>지금 확인할 수 있는 범위</h1><p>실제 운영 연결과 화면 검토를 구분합니다.</p></div></div><section className="panel form-section"><h2>현재 조작 가능</h2><ul className="plain-list"><li>가상 교인 검색·상태/소속 필터·등록·수정</li><li>교인 기본정보·가족 예시·소속·변경 이력 조회</li><li>복수 소속 배정 및 조직별 구성원 조회</li><li>서버 교회 범위 검사와 동시 수정 충돌 처리</li></ul><h2>실제 운영 전 연결할 기능</h2><ul className="plain-list"><li>담당자 로그인·권한 승인과 지속 저장 DB</li><li>실제 가족·조직 기준 및 편집</li><li>명부 가져오기·내보내기·백업 복구</li><li>기존 앱 계정·콘텐츠 관리자 연동</li></ul><p>개발 자료는 서버 메모리에만 있으며 재시작 시 초기화됩니다. 기존 홈페이지·앱·관리자의 데이터는 사용하지 않습니다.</p></section></>;
}
