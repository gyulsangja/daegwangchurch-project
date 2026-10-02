import "server-only";

import { redirect } from "next/navigation";

import type { AdminProfile } from "@daegwang/database/generated/client";
import { getPrisma } from "@daegwang/database/prisma";
import { hasSupabaseConfig } from "@daegwang/config/env";
import { createClient } from "../supabase/server";

export async function requireAdmin(): Promise<AdminProfile> {
  if (!hasSupabaseConfig() || !process.env.DATABASE_URL) {
    redirect("/admin/login?error=configuration");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;

  if (error || !subject) {
    redirect("/admin/login");
  }

  const admin = await getPrisma().adminProfile.findUnique({
    where: { authUserId: subject },
  });

  if (!admin?.isActive) {
    redirect("/admin/login?error=unauthorized");
  }

  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();

  if (admin.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard?error=forbidden");
  }

  return admin;
}
