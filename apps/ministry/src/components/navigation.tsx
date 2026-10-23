'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {Home,Users,Network,Settings2,HeartHandshake,NotebookPen,Flag,CalendarCheck} from 'lucide-react';
const items=[{href:'/',label:'목회 홈',Icon:Home},{href:'/care',label:'상담·심방',Icon:HeartHandshake},{href:'/prayers',label:'목회 기도',Icon:NotebookPen},{href:'/plans',label:'목표와 계획',Icon:Flag},{href:'/attendance',label:'예배 출석부',Icon:CalendarCheck}];
const directory=[{href:'/members',label:'교인',Icon:Users},{href:'/families',label:'가구',Icon:Users},{href:'/organizations',label:'조직',Icon:Network},{href:'/settings',label:'환경설정',Icon:Settings2}];
export function Navigation({ name = '대광교회' }: {name?:string}) {
  const pathname = usePathname();
  const links=(list:typeof items)=>list.map(({href,label,Icon})=><Link key={href} href={href} aria-current={pathname===href||(href!=='/'&&pathname.startsWith(`${href}/`))?'page':undefined}><Icon size={19}/>{label}</Link>);
  return <aside className="sidebar"><Link href="/" className="brand"><Image src="/logo.svg" width={32} height={38} alt="대광교회 로고"/><span><small>대한예수교장로회</small><strong>{name}</strong></span></Link><div className="workspace-label">목회시스템</div><nav aria-label="목회 메뉴">{links(items)}</nav><details className="directory-menu" open={directory.some(i=>pathname.startsWith(i.href))||undefined}><summary>교적과 환경설정</summary><nav aria-label="교적 메뉴">{links(directory)}</nav></details><p className="sidebar-note">한 사람을 기억하고<br/>다음 만남을 준비합니다.</p></aside>;
}
