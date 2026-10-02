import type { MetadataRoute } from "next";

import { publicEnv } from "@daegwang/config/env";
import { getSiteSettings } from "@daegwang/server/features/settings/queries";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const baseUrl = (settings.canonicalUrl || publicEnv.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

export const dynamic = "force-dynamic";
