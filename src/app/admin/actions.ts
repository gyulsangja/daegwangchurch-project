"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/db/prisma";

export type LoginState = { message?: string };

const loginSchema = z.object({
  email: z.email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상 입력해 주세요."),
  next: z.string().optional(),
});

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!hasSupabaseConfig()) {
    return { message: "Supabase 환경변수를 먼저 설정해 주세요." };
  }

  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!result.success) {
    return { message: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return { message: "이메일 또는 비밀번호를 확인해 주세요." };
  }

  const profile = data.user ? await getPrisma().adminProfile.findUnique({ where: { authUserId: data.user.id } }) : null;
  if (!profile?.isActive) {
    await supabase.auth.signOut();
    return { message: "관리자 권한이 없거나 비활성화된 계정입니다." };
  }
  await getPrisma().$transaction(async (tx) => {
    await tx.adminProfile.update({ where: { id: profile.id }, data: { lastLoginAt: new Date() } });
    await tx.activityLog.create({ data: { actorId: profile.id, action: "LOGIN", entityType: "AdminProfile", entityId: profile.id, summary: "관리자 로그인" } });
  });

  const nextPath =
    result.data.next?.startsWith("/admin/") && !result.data.next.startsWith("//")
      ? result.data.next
      : "/admin/dashboard";

  redirect(nextPath);
}

export async function logout() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const subject = data?.claims?.sub;
    if (subject && process.env.DATABASE_URL) {
      const profile = await getPrisma().adminProfile.findUnique({ where: { authUserId: subject } });
      if (profile) await getPrisma().activityLog.create({ data: { actorId: profile.id, action: "LOGOUT", entityType: "AdminProfile", entityId: profile.id, summary: "관리자 로그아웃" } });
    }
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
