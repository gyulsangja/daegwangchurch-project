import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

const parsedPublicEnv = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});

if (!parsedPublicEnv.success) {
  throw new Error(`공개 환경변수 설정이 올바르지 않습니다: ${parsedPublicEnv.error.message}`);
}

export const publicEnv = parsedPublicEnv.data;

export function hasSupabaseConfig() {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
      publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL);
}

export function requireSupabaseConfig() {
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return {
    url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
