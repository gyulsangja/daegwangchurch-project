import { deletionPolicySchema } from './deletion-service';

export function deletionConfig(env: Record<string, string | undefined>) {
  const key = env.SUPABASE_SECRET_KEY;
  if (env.APP_ACCOUNT_DELETION_ENABLED !== 'true' || env.APP_ACCOUNT_DELETION_WORKER_READY !== 'true' || !key || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  // Accept a server secret or legacy service_role JWT, never a public anon key.
  let secret = key.startsWith('sb_secret_');
  if (!secret) { try { secret = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { return null; } }
  if (!secret) return null;
  try { return { policy: deletionPolicySchema.parse(JSON.parse(env.APP_ACCOUNT_DELETION_POLICY ?? '')), url: env.NEXT_PUBLIC_SUPABASE_URL, publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, secretKey: key }; } catch { return null; }
}
