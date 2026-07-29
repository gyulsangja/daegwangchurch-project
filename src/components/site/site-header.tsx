import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";

import { ChurchLogo } from "@/components/site/church-logo";
import { getSiteSettings } from "@/features/settings/queries";

const navigation = [
  { label: "교회소개", href: "/about/church" },
  { label: "예배", href: "/worship/sunday-morning" },
  { label: "교회소식", href: "/news/notices" },
  { label: "교회학교", href: "/ministries/elementary" },
  { label: "새가족", href: "/newcomer/guide" },
  { label: "다시 오실 길", href: "/location" },
];

export async function SiteHeader() {
  const settings = await getSiteSettings();
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-sm">
      <div className="container-site flex min-h-20 items-center justify-between gap-6">
        <ChurchLogo siteName={settings.siteName} />
        <nav aria-label="주 메뉴" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="focus-ring inline-flex min-h-11 items-center rounded-full px-4 text-[0.94rem] font-semibold text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <details className="group relative lg:hidden">
          <summary className="focus-ring flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-border bg-white text-text-primary [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5 group-open:hidden" />
            <ChevronDown aria-hidden="true" className="hidden size-5 group-open:block" />
            <span className="sr-only">메뉴 열기</span>
          </summary>
          <nav
            aria-label="모바일 주 메뉴"
            className="absolute right-0 top-14 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white p-2 shadow-xl"
          >
            <ul>
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="focus-ring flex min-h-12 items-center rounded-xl px-4 font-semibold text-text-secondary hover:bg-primary-50 hover:text-primary-700"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
