import { ChurchLogo } from '@daegwang/web-ui/components/site/church-logo';
import { SiteNavigation } from './site-navigation';
export function SiteHeader() {
  return <header className="sticky top-0 z-50 border-b border-border bg-[#fffefa]/95 backdrop-blur-sm"><div className="container-site flex min-h-20 items-center justify-between gap-4 py-2 md:min-h-24"><ChurchLogo className="[&>span>span:last-child]:text-2xl [&>img]:h-12" /><SiteNavigation /></div></header>;
}
