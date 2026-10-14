import { requireAdmin } from '../../../../lib/auth/permissions';
import { AdminDirectory } from '../../../../components/admin/admin-directory';
import { ServiceAvailability } from '../../../../components/admin/service-availability';
export default async function ManagePage() {
 const admin=await requireAdmin();
 const sections=[
  {title:'교회 정보',items:[{href:'/admin/pages',title:'교회 안내',description:'소개·예배 시간·섬기는 사람들'},{href:'/admin/settings',title:'교회 기본 정보',description:'주소·연락처·유튜브 채널'}]},
  {title:'교인과 모임',items:[...(admin.role==='SUPER_ADMIN'?[{href:'/admin/members',title:'회원 관리',description:'전체 회원·교인 승인·소속·관리자 권한'},{href:'/admin/inquiries',title:'방문 문의',description:'새가족·방문 문의 확인'}]:[]),{href:'/admin/groups',title:'모임·소속 관리',description:'모임 공지·소속·담당자 관리'},{href:'/admin/care',title:'상담·심방',description:'요청 확인·담당자·보관 기간 설정'}]},
  ...(admin.role==='SUPER_ADMIN'?[{title:'운영 도구',items:[{href:'/admin/media',title:'첨부파일 정리',description:'이미 등록한 파일 확인'},{href:'/admin/activity',title:'변경 이력',description:'수정한 사람·내용 확인'}]}]:[]),
 ];
 return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-extrabold">관리 도구</h1><p className="mt-2 text-text-secondary">필요한 일을 선택하세요. 자주 쓰는 교인·모임 관리는 왼쪽 메뉴에서도 바로 열 수 있습니다.</p><AdminDirectory sections={sections} />{admin.role==='SUPER_ADMIN' && <ServiceAvailability />}</div>;
}
