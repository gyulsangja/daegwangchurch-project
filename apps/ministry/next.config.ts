import type { NextConfig } from 'next';
const config: NextConfig = {
  transpilePackages: ['@daegwang/contracts', '@daegwang/ministry-core'],
  async headers() { return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }, { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'no-referrer' }] }]; },
};
export default config;
