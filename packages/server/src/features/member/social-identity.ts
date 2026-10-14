export function needsSocialConsent(identities: { provider: string }[] | undefined) {
  return !!identities?.some(identity => ['google', 'kakao'].includes(identity.provider)) && !identities.some(identity => identity.provider === 'email');
}
