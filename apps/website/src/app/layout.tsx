import type { Metadata } from "next";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

import { publicEnv } from "@daegwang/config/env";
import { getSiteSettings } from "@daegwang/server/features/settings/queries";
import theme from "@daegwang/web-ui/theme";

import "./globals.css";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  let baseUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
  try { baseUrl = new URL(settings.canonicalUrl).toString(); } catch { /* use environment fallback */ }
  return { metadataBase: new URL(baseUrl), title: { default: settings.siteName, template: `%s | ${settings.siteName}` }, description: settings.description, alternates: { canonical: "/" }, openGraph: { type: "website", locale: "ko_KR", siteName: settings.siteName, title: settings.siteName, description: settings.description, url: "/" }, twitter: { card: "summary", title: settings.siteName, description: settings.description }, robots: { index: true, follow: true }, verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      // Public ownership marker supplied by the site owner; not an account credential.
      'naver-site-verification': process.env.NAVER_SITE_VERIFICATION || '6376ab1c3f6fafd5db63f1404df0404a148e5c86',
      ...(process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : {}),
    },
  } };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const baseUrl = (settings.canonicalUrl || publicEnv.NEXT_PUBLIC_SITE_URL).replace(/\/$/, '');
  const structuredData = { "@context": "https://schema.org", "@graph": [
    { "@type": "Church", "@id": `${baseUrl}/#church`, name: settings.siteName, alternateName: ['대한예수교장로회 대광교회', '독산동 대광교회'], url: baseUrl, description: settings.description, ...(settings.address ? { address: { "@type": "PostalAddress", streetAddress: [settings.address, settings.addressDetail].filter(Boolean).join(" "), addressCountry: "KR" } } : {}), ...(settings.phone ? { telephone: settings.phone } : {}), ...(settings.email ? { email: settings.email } : {}), ...(settings.mapLatitude !== undefined && settings.mapLongitude !== undefined ? { geo: { '@type': 'GeoCoordinates', latitude: settings.mapLatitude, longitude: settings.mapLongitude } } : {}), ...(settings.youtubeUrl ? { sameAs: [settings.youtubeUrl] } : {}) },
    { '@type': 'WebSite', '@id': `${baseUrl}/#website`, url: baseUrl, name: settings.siteName, alternateName: '독산동 대광교회', inLanguage: 'ko-KR', about: { '@id': `${baseUrl}/#church` } },
  ] };
  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

// CMS runs separately; public database content is read on each request.
export const dynamic = "force-dynamic";
