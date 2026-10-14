export function configuredSocialProviders(env: NodeJS.ProcessEnv, accountReady: boolean, deletionReady: boolean): ('google' | 'kakao')[] {
  if (!accountReady || !deletionReady) return [];
  return (['google', 'kakao'] as const).filter(provider => env[`APP_AUTH_${provider.toUpperCase()}_READY`] === 'true');
}
