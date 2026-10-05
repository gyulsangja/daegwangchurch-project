import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getPrisma } from '@daegwang/database/prisma';
import { requireSupabaseConfig } from '@daegwang/config/env';
import { createDeletionHandler } from './deletion-api';
import { deletionConfig } from './deletion-config';
import { createDeletionService } from './deletion-service';
import { createDeletionProvider } from './deletion-provider';
import { memberIdentity } from './record-server';

export const configuredDeletionPolicy = () => deletionConfig(process.env)?.policy ?? null;
export const deletionHandler = createDeletionHandler({
  policy: configuredDeletionPolicy, allowedOrigins: memberIdentity.allowedOrigins,
  async authenticate(token) {
    const { url, publishableKey } = requireSupabaseConfig();
    const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) } });
    const { data, error } = await client.auth.getUser(token);
    if (error) { if (error.status === 401 || error.status === 403) return null; throw error; }
    const user = data.user;
    return user?.email && user.email_confirmed_at && !user.is_anonymous ? { id: user.id, email: user.email } : null;
  },
  async remove(identity, input, policy) {
    const config = deletionConfig(process.env); if (!config) throw new Error('Deletion unavailable');
    return createDeletionService(getPrisma(), createDeletionProvider(config)).request(identity, input, policy);
  },
});
