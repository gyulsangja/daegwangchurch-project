import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { MenuCard } from './app-screen';
import { safeMemberReturn } from './member-session';
export function ReauthAction({ error, returnTo }: { error: string; returnTo: string }) {
  const pathname = usePathname(); const params = useLocalSearchParams();
  const query = new URLSearchParams(Object.entries(params).filter(([key, value]) => ['kind', 'worshipId', 'reflectionId', 'date'].includes(key) && typeof value === 'string') as [string, string][]).toString();
  const current = `${pathname}${query ? `?${query}` : ''}`;
  return error.includes('로그인') ? <MenuCard title="다시 로그인하고 이어쓰기" description="앱을 닫지 않으면 같은 계정으로 이어갈 수 있습니다." onPress={() => router.push({ pathname: '/login', params: { returnTo: safeMemberReturn(current || returnTo) as string } })} /> : null;
}
