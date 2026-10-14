import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readOAuthCode } from '@daegwang/api-client/social-auth';
import { configuredSocialProviders } from '@daegwang/server/features/member/social-config';
import { churchRequestSchema } from '@daegwang/contracts/features/member/church-membership';
import { deletionInputSchema } from '@daegwang/server/features/member/deletion-service';
import { needsSocialConsent } from '@daegwang/server/features/member/social-identity';
test('OAuth accepts only the expected callback and one code, never token fragments or error redirects', () => {
  const target = 'daegwang://auth/callback';
  assert.equal(readOAuthCode(`${target}?code=fixture`, target), 'fixture');
  for (const value of ['evil://auth/callback?code=fixture', 'daegwang://auth/other?code=fixture', `${target}?code=a&code=b`, `${target}#access_token=fixture`, `${target}?error=denied&code=a`, target]) assert.throws(() => readOAuthCode(value, target));
});
test('provider flags cannot bypass account and deletion readiness', () => {
  const env = { APP_AUTH_GOOGLE_READY: 'true', APP_AUTH_KAKAO_READY: 'true' };
  assert.deepEqual(configuredSocialProviders(env, false, true), []);
  assert.deepEqual(configuredSocialProviders(env, true, false), []);
  assert.deepEqual(configuredSocialProviders(env, true, true), ['google', 'kakao']);
  assert.deepEqual(configuredSocialProviders({}, true, true), []);
});
test('member cannot submit an approval and deletion requires exactly one reauthentication method', () => {
  assert.equal(needsSocialConsent([{ provider: 'google' }]), true);
  assert.equal(needsSocialConsent([{ provider: 'kakao' }]), true);
  assert.equal(needsSocialConsent([{ provider: 'email' }, { provider: 'google' }]), false);
  assert.equal(churchRequestSchema.safeParse({ realName: 'Fixture', version: 0, status: 'CONFIRMED' }).success, false);
  const base = { policyVersion: 'v1', confirm: 'DELETE' };
  assert.equal(deletionInputSchema.safeParse(base).success, false);
  assert.equal(deletionInputSchema.safeParse({ ...base, password: 'a', code: '123456' }).success, false);
  assert.equal(deletionInputSchema.safeParse({ ...base, code: '123456' }).success, true);
});
