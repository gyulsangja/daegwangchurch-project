import type { ChurchDetails } from '@daegwang/contracts/features/member/church-membership';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { createMemberAuth } from '@daegwang/api-client/member-auth';
import { readOAuthCode, saveSocialConsent } from '@daegwang/api-client/social-auth';
import { accountClient } from '../hooks/use-member-options';
import { prepareOAuthCrypto } from './oauth-crypto';

let active = false;
export async function authenticateSocial(provider: 'google' | 'kakao', input: { displayName: string; consent: true; policyVersion: string; churchRequest?: ChurchDetails }) {
  if (active) throw new Error('진행 중인 로그인을 먼저 완료해 주세요.');
  active = true;
  let accepted = false;
  const auth = createMemberAuth(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  try {
    if (!auth) throw new Error('로그인 연결을 준비하고 있습니다.');
    const options = await accountClient.options();
    if (!options.socialProviders.includes(provider) || options.policy?.version !== input.policyVersion) throw new Error('로그인 설정이나 약관이 변경되었습니다. 화면을 다시 열어 주세요.');
    const redirectTo = Linking.createURL('auth/callback');
    prepareOAuthCrypto();
    const { data, error } = await auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data.url) throw new Error('SNS 로그인에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    if (new URL(data.url).searchParams.get('code_challenge_method')?.toLowerCase() !== 's256') throw new Error('이 환경에서는 안전한 SNS 인증을 시작할 수 없습니다. 설치한 앱에서 다시 시도해 주세요.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null;
    const exchanged = await auth.exchangeCodeForSession(readOAuthCode(result.url, redirectTo));
    if (exchanged.error || !exchanged.data.session || exchanged.data.user?.is_anonymous) throw new Error('인증을 완료하지 못했습니다. 다시 시작해 주세요.');
    if (!exchanged.data.user?.email || !exchanged.data.user.email_confirmed_at) throw new Error('확인된 이메일을 제공하는 계정이 필요합니다. 이메일 제공 동의를 확인해 주세요.');
    await saveSocialConsent(process.env.EXPO_PUBLIC_API_BASE_URL, exchanged.data.session.access_token, input);
    accepted = true;
    return exchanged.data.session;
  } finally { if (!accepted) await auth?.signOut({ scope: 'local' }).catch(() => {}); active = false; }
}
