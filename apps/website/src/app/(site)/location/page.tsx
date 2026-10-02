import { Bus, Car, MapPin, Navigation } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, SectionTitle } from "../../../components/site/content-shell";
import { KakaoMap } from "../../../components/site/kakao-map";
import { PageHero } from "../../../components/site/page-hero";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { getSiteSettings } from "@daegwang/server/features/settings/queries";
import { publicEnv } from "@daegwang/config/env";

export const metadata: Metadata = {
  title: "찾아오시는 길",
  description: "독산대광교회로 오시는 길을 안내합니다.",
  alternates: { canonical: "/location" },
};

export const dynamic = "force-dynamic";

export default async function LocationPage() {
  const settings = await getSiteSettings();
  const hasMap =
    settings.mapLatitude !== undefined && settings.mapLongitude !== undefined;
  const address = [settings.address, settings.addressDetail].filter(Boolean).join(" ");
  const hasKakaoMap = hasMap && Boolean(publicEnv.NEXT_PUBLIC_KAKAO_MAP_KEY);
  const navigationUrl = hasMap
    ? `https://map.kakao.com/link/to/${encodeURIComponent(settings.siteName)},${settings.mapLatitude},${settings.mapLongitude}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(address || settings.siteName)}`;

  return (
    <>
      <PageHero
        eyebrow="LOCATION"
        title="찾아오시는 길"
        description={`${settings.siteName}을 찾아오시는 방법을 안내합니다.`}
      />
      <ContentShell>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          {hasKakaoMap ? (
            <KakaoMap
              appKey={publicEnv.NEXT_PUBLIC_KAKAO_MAP_KEY!}
              latitude={settings.mapLatitude!}
              longitude={settings.mapLongitude!}
              title={settings.siteName}
            />
          ) : (
            <div className="flex min-h-[26rem] items-center justify-center rounded-[2rem] bg-background-muted text-center">
              <div>
                <MapPin className="mx-auto size-12 text-primary-600" />
                <p className="mt-4 font-extrabold">지도 연결 준비 중</p>
                <p className="mt-2 text-sm text-text-secondary">
                  {!hasMap
                    ? "관리자 사이트 설정에서 주소와 좌표를 입력해 주세요."
                    : ".env에 NEXT_PUBLIC_KAKAO_MAP_KEY를 입력해 주세요."}
                </p>
              </div>
            </div>
          )}
          <aside className="rounded-[2rem] border border-border p-7 md:p-8">
            <p className="text-sm font-bold tracking-[0.12em] text-primary-700">ADDRESS</p>
            <h2 className="mt-3 text-2xl font-extrabold">{settings.siteName}</h2>
            <p className="mt-5 whitespace-pre-line leading-7 text-text-secondary">
              {address || "주소 확인 후 게시"}
            </p>
            {settings.phone ? <p className="mt-3 font-bold">대표전화 {settings.phone}</p> : null}
            <Button asChild className="mt-7 w-full">
              <a href={navigationUrl} target="_blank" rel="noreferrer">
                <Navigation className="size-4" /> 카카오맵에서 길찾기
              </a>
            </Button>
          </aside>
        </div>
        <section className="mt-20">
          <SectionTitle eyebrow="TRANSPORTATION" title="교통 안내" />
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-border p-6">
              <Bus className="size-7 text-primary-600" />
              <h2 className="mt-5 text-xl font-extrabold">대중교통</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-text-secondary">
                {settings.transitInfo || "가까운 지하철역과 버스 노선을 확인 중입니다."}
              </p>
            </article>
            <article className="rounded-2xl border border-border p-6">
              <Car className="size-7 text-primary-600" />
              <h2 className="mt-5 text-xl font-extrabold">주차 안내</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-text-secondary">
                {settings.parkingInfo || "교회 주차 공간과 인근 주차 안내를 확인 중입니다."}
              </p>
            </article>
          </div>
          <p className="mt-8 text-sm text-text-secondary">
            방문 전에는{" "}
            <Link
              href="/about/worship-info"
              className="font-bold text-primary-700 underline underline-offset-4"
            >
              예배 안내
            </Link>
            도 함께 확인해 주세요.
          </p>
        </section>
      </ContentShell>
    </>
  );
}
