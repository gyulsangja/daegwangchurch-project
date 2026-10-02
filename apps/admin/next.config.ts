import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@daegwang/contracts', '@daegwang/database', '@daegwang/server', '@daegwang/config', '@daegwang/web-ui', '@daegwang/design-tokens'],
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
