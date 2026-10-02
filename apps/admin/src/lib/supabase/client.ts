"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseConfig } from "@daegwang/config/env";

export function createClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
