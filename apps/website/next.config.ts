import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@daegwang/contracts', '@daegwang/database', '@daegwang/server', '@daegwang/config', '@daegwang/web-ui', '@daegwang/design-tokens'],
  async redirects() {
    const admin = process.env.ADMIN_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : undefined);
    if (!admin) return [];
    const url = new URL(admin);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('ADMIN_URL must be an HTTP(S) origin');
    const origin = url.origin;
    if (process.env.NEXT_PUBLIC_SITE_URL && origin === new URL(process.env.NEXT_PUBLIC_SITE_URL).origin) throw new Error('ADMIN_URL must differ from the website origin');
    return [{ source: '/admin/:path*', destination: origin + '/admin/:path*', permanent: false }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
