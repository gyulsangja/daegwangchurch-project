"use client";

import Script from "next/script";
import { useCallback, useRef, useState } from "react";

type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (
    container: HTMLElement,
    options: { center: unknown; level: number },
  ) => unknown;
  Marker: new (options: { map: unknown; position: unknown; title: string }) => unknown;
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

type KakaoMapProps = {
  appKey: string;
  latitude: number;
  longitude: number;
  title: string;
};

export function KakaoMap({ appKey, latitude, longitude, title }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const initializeMap = useCallback(() => {
    const maps = window.kakao?.maps;
    const container = containerRef.current;
    if (!maps || !container) return;

    maps.load(() => {
      try {
        const position = new maps.LatLng(latitude, longitude);
        const map = new maps.Map(container, { center: position, level: 3 });
        new maps.Marker({ map, position, title });
        setStatus("ready");
      } catch (error) {
        console.error("Failed to initialize Kakao map", error);
        setStatus("error");
      }
    });
  }, [latitude, longitude, title]);

  return (
    <div className="relative min-h-[26rem] overflow-hidden rounded-[2rem] bg-background-muted">
      <Script
        id="kakao-maps-sdk"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`}
        strategy="afterInteractive"
        onReady={initializeMap}
        onError={() => setStatus("error")}
      />
      <div ref={containerRef} className="absolute inset-0" aria-label={`${title} 카카오 지도`} />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background-muted text-sm font-bold text-text-secondary">
          카카오 지도를 불러오는 중입니다.
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background-muted p-6 text-center">
          <div>
            <p className="font-extrabold">지도를 불러오지 못했습니다.</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              카카오 JavaScript 키와 등록된 웹 도메인을 확인해 주세요.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
