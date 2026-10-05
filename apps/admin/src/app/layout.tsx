import type { Metadata } from 'next';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import theme from '@daegwang/web-ui/theme';
import './globals.css';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
export const metadata: Metadata = { title: '대광교회 통합 관리자', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="ko"><body><AppRouterCacheProvider options={{ enableCssLayer: true }}><ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider></AppRouterCacheProvider></body></html>;
}
