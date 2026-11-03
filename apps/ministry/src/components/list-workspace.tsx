'use client';
import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';
const paths=new Set(['/','/members','/families','/organizations','/attendance','/records','/care','/prayers','/plans','/worship','/church','/church/manage','/albums','/church-guide','/app-members','/app-groups','/intake','/users','/reports','/statistics','/settings','/management','/church-settings','/site-pages','/integration']);
export function ListWorkspace({children}:{children:ReactNode}){
 const path=usePathname();
 return <div className={paths.has(path)?'list-workspace':undefined} data-list-page={path}>{children}</div>;
}
