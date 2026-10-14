"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
type Section = {title:string;items:{href:string;title:string;description:string}[]};
export function AdminDirectory({sections}:{sections:Section[]}) {
 const [query,setQuery]=useState(''); const term=query.trim().toLocaleLowerCase();
 const shown=sections.map(section=>({...section,items:section.items.filter(item=>`${section.title} ${item.title} ${item.description}`.toLocaleLowerCase().includes(term))})).filter(section=>section.items.length);
 return <><label className="relative mt-6 block max-w-md"><span className="sr-only">메뉴 찾기</span><Search aria-hidden="true" className="absolute left-3 top-3 size-5 text-text-secondary" /><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="필요한 메뉴 찾기" className="focus-ring min-h-11 w-full rounded-xl border border-border bg-white py-2 pl-10 pr-3 text-sm" /></label>
 <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">{shown.map(section=><section key={section.title}><h2 className="mb-3 text-sm font-bold text-text-secondary">{section.title}</h2><ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">{section.items.map(item=><li key={item.href}><Link href={item.href} className="focus-ring flex min-h-20 items-center gap-3 px-4 py-3 hover:bg-primary-50"><div className="min-w-0 flex-1"><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-sm leading-5 text-text-secondary">{item.description}</p></div><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-primary-600" /></Link></li>)}</ul></section>)}</div>{!shown.length&&<p role="status" className="mt-6 text-text-secondary">일치하는 메뉴가 없습니다. 다른 검색어를 입력해 주세요.</p>}</>;
}
