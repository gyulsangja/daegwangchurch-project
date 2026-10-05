'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';

type NavigationItem = {
  label: string;
  href: string;
};

export function SectionNavigation({
  label,
  items,
}: {
  label: string;
  items: NavigationItem[];
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="border-b border-border bg-white">
      <div className="container-site overflow-x-auto">
        <ul className="flex min-w-max gap-1 py-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`focus-ring inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold hover:bg-primary-50 hover:text-primary-700 ${pathname === item.href ? 'bg-primary-50 text-primary-700' : 'text-text-secondary'}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
