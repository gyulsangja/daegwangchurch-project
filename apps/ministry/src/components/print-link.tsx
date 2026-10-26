'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
export function PrintLink(){const path=usePathname();const member=path.match(/^\/members\/([^/]+)$/);const type:Record<string,string>={'/members':'directory','/care':'care','/prayers':'prayer','/plans':'plans','/attendance':'attendance','/families':'families','/organizations':'organizations'};return <Link className="button" href={member?`/print?type=member&memberId=${encodeURIComponent(member[1])}`:`/print?type=${type[path]||'directory'}`}>문서 출력</Link>;}
