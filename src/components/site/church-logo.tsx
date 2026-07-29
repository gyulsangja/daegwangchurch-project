import Link from "next/link";

import { cn } from "@/lib/utils";

export function ChurchLogo({ className, siteName = "독산대광교회" }: { className?: string; siteName?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteName} 홈`}
      className={cn("focus-ring inline-flex items-center gap-3 rounded-md", className)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 44 44"
        className="size-10 shrink-0"
      >
        <circle cx="22" cy="22" r="21" fill="#1599AC" />
        <path d="M22 10v24M14 18h16" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M11 30c6-4 16-4 22 0" fill="none" stroke="#DDF4F6" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-700">
          대한예수교장로회(고신)
        </span>
        <span className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-text-primary">
          {siteName}
        </span>
      </span>
    </Link>
  );
}
