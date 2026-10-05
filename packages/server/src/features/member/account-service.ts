import { z } from 'zod';
import type { GoTrueClient } from '@supabase/supabase-js';
import { emailSchema, signupSchema, resetPasswordSchema } from '@daegwang/contracts/features/member/extras';

export const accountPolicySchema = z.object({ version: z.string().min(1).max(100), terms: z.string().min(1).max(30000), privacy: z.string().min(1).max(30000), deletion: z.string().max(10000).default(''), care: z.string().max(10000).default('') }).strict();
export type AccountPolicy = z.infer<typeof accountPolicySchema>;
type Auth = Pick<GoTrueClient, 'signUp' | 'verifyOtp' | 'resend' | 'resetPasswordForEmail' | 'updateUser' | 'signOut'>;
export class AccountOperationError extends Error { constructor(public status: number) { super('Account operation failed'); } }
function check(error: { status?: number } | null) { if (error) throw new AccountOperationError(error.status === 429 ? 429 : 422); }
export function createAccountService(deps: { auth: () => Auth; policy: AccountPolicy; rememberConsent: (owner: string, email: string, displayName: string, policy: AccountPolicy) => Promise<void>; confirmConsent: (owner: string, email: string) => Promise<void> }) {
  return async (operation: string, input: unknown) => {
    const auth = deps.auth();
    if (operation === 'signup') {
      const value = signupSchema.parse(input);
      if (value.policyVersion !== deps.policy.version) throw new AccountOperationError(409);
      const { data, error } = await auth.signUp({ email: value.email, password: value.password }); check(error);
      // With email confirmation disabled, do not pretend that the OTP flow is ready.
      if (data.session) { await auth.signOut({ scope: 'local' }); throw new AccountOperationError(503); }
      if (data.user?.identities?.length) await deps.rememberConsent(data.user.id, value.email, value.displayName, deps.policy);
      return;
    }
    if (operation === 'verify') {
      const value = z.object({ email: emailSchema, code: z.string().regex(/^\d{6,8}$/) }).strict().parse(input);
      const { data, error } = await auth.verifyOtp({ email: value.email, token: value.code, type: 'email' }); check(error);
      try {
        if (!data.user || data.user.is_anonymous || !data.user.email_confirmed_at || data.user.email?.toLowerCase() !== value.email.toLowerCase()) throw new AccountOperationError(422);
        await deps.confirmConsent(data.user.id, value.email);
      } finally { await auth.signOut({ scope: 'local' }); }
      return;
    }
    if (operation === 'resend' || operation === 'recovery') {
      const { email } = z.object({ email: emailSchema }).strict().parse(input);
      const { error } = operation === 'resend' ? await auth.resend({ type: 'signup', email }) : await auth.resetPasswordForEmail(email);
      // Do not reveal whether an email is registered. Report service/rate failures only.
      if (error?.status === 429) throw new AccountOperationError(429);
      if (error && (!error.status || error.status >= 500)) throw new AccountOperationError(503);
      return;
    }
    if (operation === 'reset') {
      const value = resetPasswordSchema.parse(input);
      const { data, error } = await auth.verifyOtp({ email: value.email, token: value.code, type: 'recovery' }); check(error);
      try {
        if (!data.user || !data.session || data.user.email?.toLowerCase() !== value.email.toLowerCase()) throw new AccountOperationError(422);
        const result = await auth.updateUser({ password: value.password }); check(result.error);
        const signedOut = await auth.signOut({ scope: 'global' }); check(signedOut.error);
      } finally { await auth.signOut({ scope: 'local' }); }
      return;
    }
    throw new AccountOperationError(404);
  };
}
