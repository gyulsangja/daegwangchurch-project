import {AdminDirectory} from '../../../../components/admin/admin-directory';
const sections=[
 {title:'예배와 첫 방문',items:[{href:'/admin/pages/worship-info',title:'예배안내',description:'예배 요일·시간·장소'},{href:'/admin/pages/newcomer-education',title:'새가족 교육',description:'교육 과정·신청 안내'}]},
 {title:'교회 소개',items:[{href:'/admin/pages/church',title:'교회소개',description:'교회의 시작·표어·핵심 가치'},{href:'/admin/pages/vision',title:'비전과 사명',description:'목회철학·사역 방향'},{href:'/admin/pages/history',title:'교회연혁',description:'연도별 주요 역사'}]},
 {title:'사람과 사역',items:[{href:'/admin/people',title:'섬기는 사람들',description:'목회자·교회 담당자 소개'},{href:'/admin/ministries',title:'교회학교·사역',description:'교회학교·사역 소개'}]},
 {title:'홈페이지 구성',items:[{href:'/admin/pages/home',title:'메인 화면',description:'대표 문구·주요 영역 노출'}]},
];
export default function AdminPagesPage(){return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-extrabold">교회 안내</h1><p className="mt-2 text-text-secondary">수정할 안내를 찾아 선택하세요. 설교·공지·주보는 각 등록 메뉴에서 관리합니다.</p><AdminDirectory sections={sections}/></div>;}
