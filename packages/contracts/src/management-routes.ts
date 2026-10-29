// Canonical destinations only: never forward credentials, query strings or arbitrary return URLs.
export const legacyManagementPaths=[
 ['/admin/login','/login'],['/admin/pages/history','/church-guide'],['/admin/pages/worship-info','/church-guide'],
 ['/admin/notices','/church/manage'],['/admin/events','/church/manage'],['/admin/bulletins','/worship'],['/admin/worship','/worship'],
 ['/admin/albums','/albums'],['/admin/people','/church-guide'],['/admin/ministries','/church-guide'],['/admin/pages','/site-pages'],
 ['/admin/settings','/church-settings'],['/admin/admins','/users'],['/admin/members','/app-members'],['/admin/groups','/app-groups'],
 ['/admin/inquiries','/intake'],['/admin/care','/intake'],['/admin/media','/management'],['/admin/activity','/management'],['/admin/app-operations','/management'],
 ['/admin/dashboard','/'],['/admin/manage','/management'],
] as const;
export function unifiedManagementPath(path:string){
 if(path==='/admin'||path==='/admin/')return '/';
 return legacyManagementPaths.find(([source])=>path===source||path.startsWith(source+'/'))?.[1]??'/management';
}
