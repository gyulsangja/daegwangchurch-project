import { createClient, processLock, type SupportedStorage } from '@supabase/supabase-js';
export type { Session } from '@supabase/supabase-js';

export function createMemberAuth(url?: string, publishableKey?: string, options?: { storage: SupportedStorage; storageKey: string; useProcessLock?: boolean }) {
  if (!url || !publishableKey) return null;
  let endpoint: URL;
  try { endpoint = new URL(url); } catch { return null; }
  if ((endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) return null;
  if (publishableKey.startsWith('sb_secret_')) return null;
  // Temporary OAuth clients remain in memory; the app supplies its persistent store.
  // Server APIs still verify identity independently on every request.
  return createClient(endpoint.href, publishableKey, { auth: { flowType: 'pkce', persistSession: !!options, autoRefreshToken: !!options, detectSessionInUrl: false, ...(options ? { storage: options.storage, storageKey: options.storageKey, ...(options.useProcessLock ? { lock: processLock } : {}) } : {}) } }).auth;
}
