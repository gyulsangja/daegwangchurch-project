import { publicEnv } from '@daegwang/config/env';
import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "../../../../components/admin/login-form";
import { ChurchLogo } from "@daegwang/web-ui/components/site/church-logo";
import { hasSupabaseConfig } from "@daegwang/config/env";

export const metadata: Metadata = { title: "관리자 로그인", robots: { index: false } };

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = hasSupabaseConfig();
  const errorMessage =
    params.error === "unauthorized"
      ? "관리자 권한이 없거나 비활성화된 계정입니다."
      : params.error === "configuration"
        ? "관리자 시스템 환경설정이 아직 완료되지 않았습니다."
        : null;

  return (
    <main className="grid min-h-screen bg-background-warm lg:grid-cols-[1fr_1fr]">
      <section className="hidden bg-primary-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-sm font-bold tracking-[0.15em] text-primary-100">DAEGWANG CHURCH CMS</p>
        <div className="max-w-xl">
          <p className="text-5xl font-extrabold leading-tight tracking-[-0.055em]">
            예배와 소식을
            <br />한곳에서 관리합니다.
          </p>
          <p className="mt-6 max-w-md text-lg text-white/75">
            독산대광교회 홈페이지와 앱 콘텐츠를 함께 관리하는 공간입니다.
          </p>
        </div>
        <p className="text-sm text-white/60">권한이 부여된 관리자만 접속할 수 있습니다.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-[1.75rem] border border-border bg-white p-7 shadow-[0_24px_70px_rgba(38,35,33,0.08)] sm:p-10">
          <ChurchLogo href={publicEnv.NEXT_PUBLIC_SITE_URL} />
          <h1 className="mt-10 text-3xl font-extrabold tracking-[-0.04em]">관리자 로그인</h1>
          <p className="mt-2 text-text-secondary">등록된 관리자 계정으로 로그인해 주세요.</p>
          {!configured ? (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              현재 데모 화면입니다. `.env.local`에 Supabase 설정을 추가하면 로그인을 사용할 수 있습니다.
            </p>
          ) : null}
          {errorMessage ? (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
              {errorMessage}
            </p>
          ) : null}
          <LoginForm nextPath={params.next} />
          <Link href={publicEnv.NEXT_PUBLIC_SITE_URL} className="focus-ring mt-7 block rounded text-center text-sm font-semibold text-text-secondary hover:text-primary-700">
            공개 홈페이지로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
