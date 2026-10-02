import Link from "next/link";

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
  return (
    <nav aria-label={label} className="border-b border-border bg-white">
      <div className="container-site overflow-x-auto">
        <ul className="flex min-w-max gap-1 py-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="focus-ring inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-text-secondary hover:bg-primary-50 hover:text-primary-700"
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
