import { createClient } from '@supabase/supabase-js';
import { AccountOperationError } from './account-service';
import type { DeletionProvider } from './deletion-service';

// Only server entry points supply the secret key. This module is also used by the private CLI.
export function createDeletionProvider(config: { url: string; publishableKey: string; secretKey: string }, fetcher: typeof fetch = fetch): DeletionProvider {
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetcher(input, { ...init, signal: AbortSignal.timeout(10000) }) } };
  const admin = createClient(config.url, config.secretKey, options).auth.admin;
  return {
    async reauthenticate(owner, email, password) {
      const auth = createClient(config.url, config.publishableKey, options).auth;
      try {
        const { data, error } = await auth.signInWithPassword({ email, password });
        if (error) throw new AccountOperationError(error.status === 429 ? 429 : error.status && error.status < 500 ? 422 : 503);
        if (!data.session || data.user?.id !== owner || data.user.is_anonymous || !data.user.email_confirmed_at) throw new AccountOperationError(422);
      } finally { await auth.signOut({ scope: 'local' }); }
    },
    async deleteIdentity(owner) {
      const { error } = await admin.deleteUser(owner, false);
      if (error && error.code !== 'user_not_found') throw new AccountOperationError(503);
    },
    async identityAbsent(owner) {
      const { error } = await admin.getUserById(owner);
      if (error?.code === 'user_not_found') return true;
      if (error) throw new AccountOperationError(503);
      return false;
    },
  };
}
