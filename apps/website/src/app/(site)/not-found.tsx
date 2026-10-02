import Link from "next/link";

import { Button } from "@daegwang/web-ui/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-bold tracking-[0.12em] text-primary-700">404</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em]">페이지를 찾을 수 없습니다</h1>
      <p className="mt-4 text-text-secondary">주소가 변경되었거나 아직 준비 중인 페이지입니다.</p>
      <Button asChild className="mt-8">
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </section>
  );
}
