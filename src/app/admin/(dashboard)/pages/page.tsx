import Paper from "@mui/material/Paper";
import { BookOpen, Church, Clock3, GraduationCap, History, Home } from "lucide-react";
import Link from "next/link";

const pages = [
  { href: "/admin/pages/home", title: "메인 화면", description: "대표 문구와 주요 콘텐츠 영역의 노출을 관리합니다.", icon: Home },
  { href: "/admin/pages/church", title: "교회소개", description: "교회의 시작, 표어와 핵심 가치를 관리합니다.", icon: Church },
  { href: "/admin/pages/vision", title: "비전과 사명", description: "목회철학, 교회 표어와 사역 방향을 관리합니다.", icon: BookOpen },
  { href: "/admin/pages/history", title: "교회연혁", description: "연도별 주요 역사를 등록하고 순서를 관리합니다.", icon: History },
  { href: "/admin/pages/worship-info", title: "예배안내", description: "예배별 요일, 시간과 장소를 관리합니다.", icon: Clock3 },
  { href: "/admin/pages/newcomer-education", title: "새가족 교육", description: "새가족 교육 과정과 신청 안내를 관리합니다.", icon: GraduationCap },
];

export default function AdminPagesPage() {
  return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">PAGE MANAGEMENT</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">고정 페이지</h1><p className="mt-2 text-text-secondary">교회 소개와 예배 안내에 항상 표시되는 내용을 관리합니다.</p><div className="mt-8 grid gap-5 md:grid-cols-2">{pages.map(({ href, title, description, icon: Icon }) => <Paper key={href} component={Link} href={href} variant="outlined" className="group flex gap-5 p-6 transition hover:border-primary-300 hover:shadow-md"><span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700"><Icon className="size-6" /></span><div><h2 className="text-xl font-extrabold group-hover:text-primary-700">{title}</h2><p className="mt-2 leading-7 text-text-secondary">{description}</p></div></Paper>)}</div></div>;
}
