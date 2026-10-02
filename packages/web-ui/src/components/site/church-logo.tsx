import Image from "next/image";
import Link from "next/link";

import { cn } from "@daegwang/web-ui/lib/utils";

export function ChurchLogo({ className, href = "/" }: { className?: string; siteName?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="대광교회 홈"
      className={cn("focus-ring inline-flex items-center gap-3 rounded-md", className)}
    >
      <Image
        src="/logo.svg"
        alt=""
        width={32}
        height={38}
        priority
        className="h-10 w-auto shrink-0"
      />
      <span className="flex flex-col leading-none">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-700">
          대한예수교장로회
        </span>
        <span className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-text-primary">
          대광교회
        </span>
      </span>
    </Link>
  );
}
