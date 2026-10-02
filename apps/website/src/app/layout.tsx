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
  return { metadataBase: new URL(baseUrl), title: { default: settings.siteName, template: `%s | ${settings.siteName}` }, description: settings.description, alternates: { canonical: "/" }, openGraph: { type: "website", locale: "ko_KR", siteName: settings.siteName, title: settings.siteName, description: settings.description, url: "/" }, twitter: { card: "summary", title: settings.siteName, description: settings.description }, robots: { index: true, follow: true } };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const structuredData = { "@context": "https://schema.org", "@type": "Church", name: settings.siteName, url: settings.canonicalUrl, description: settings.description, ...(settings.address ? { address: { "@type": "PostalAddress", streetAddress: [settings.address, settings.addressDetail].filter(Boolean).join(" "), addressLocality: "서울", addressCountry: "KR" } } : {}), ...(settings.phone ? { telephone: settings.phone } : {}), ...(settings.email ? { email: settings.email } : {}), ...(settings.youtubeUrl ? { sameAs: [settings.youtubeUrl] } : {}) };
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
