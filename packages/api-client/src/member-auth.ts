import { createClient } from '@supabase/supabase-js';
export type { Session } from '@supabase/supabase-js';

export function createMemberAuth(url?: string, publishableKey?: string) {
  if (!url || !publishableKey) return null;
  let endpoint: URL;
  try { endpoint = new URL(url); } catch { return null; }
  if ((endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) return null;
  if (publishableKey.startsWith('sb_secret_')) return null;
  // Memory-only session: no passwords or tokens are persisted on shared devices.
  // The API verifies identity independently on every request.
  return createClient(endpoint.href, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }).auth;
}
