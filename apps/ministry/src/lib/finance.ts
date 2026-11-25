import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { financeCommand, type FinanceSnapshot } from '@daegwang/contracts/finance';
import { accessQuery } from './access-management';
import { authenticatedSession } from './auth-security';
import { operationalEnabled, operationalOrigin } from './operational-config';

export const financeSession = cache(async () => {
  if (!operationalEnabled()) throw new Error('FINANCE_SETUP');
  if ((await headers()).get('host') !== new URL(operationalOrigin()).host) throw new Error('FINANCE_FORBIDDEN');
  const session = await authenticatedSession();
  if (session.nextLevel === 'aal2' && session.aal !== 'aal2') throw new Error('MINISTRY_MFA_REQUIRED');
  return session;
});
export async function financeSnapshot(year: number, period?: {start:string; end:string}) {
  const { user, aal } = await financeSession();
  return accessQuery<FinanceSnapshot>(user.id, aal, 'SELECT finance.workspace($1::integer,$2::date,$3::date) AS result',[year,period?.start??null,period?.end??null]);
}
export async function saveFinance(raw: Record<string, unknown>) {
  const { password, ...body } = raw;
  const input = financeCommand.parse(body);
  const { user, aal } = await financeSession();
  let verified = false;
  if (input.action === 'ACCESS_SAVE' && aal !== 'aal2') {
    if (!user.email || typeof password !== 'string' || !password || password.length > 200) throw new Error('ACCESS_REAUTH');
    const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!, { auth: { persistSession: false, autoRefreshToken: false } });
    try {
      const { data, error } = await verifier.auth.signInWithPassword({ email: user.email, password });
      if (error || data.user?.id !== user.id) throw new Error('ACCESS_REAUTH');
      verified = true;
    } finally { await verifier.auth.signOut({ scope: 'local' }).catch(() => {}); }
  }
  return accessQuery<{ saved: boolean }>(user.id, aal, ['MONTH_CLOSE','MONTH_REOPEN','CATEGORY_CONFIG','ISSUE_PAPER'].includes(input.action) ? 'SELECT finance.manage($1::jsonb) AS result' : 'SELECT finance.command($1::jsonb) AS result', [JSON.stringify(input)], verified);
}
export function financeError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const messages: Record<string, string> = {
    PAPER_DISABLED:'이 연도는 서면 발급 자격 확인이 필요합니다.', RECEIPT_ISSUED:'발급된 영수증의 원본 전표입니다. 발급 내역을 먼저 확인하세요.',
    MONTH_LOCKED:'마감된 월입니다. 마감 해제 후 처리하세요.', CATEGORY_INACTIVE:'사용 중지된 항목입니다.',
    FINANCE_FORBIDDEN: '재정 접근 권한이 없습니다. 통합 관리 최고관리자에게 재정 권한을 요청하세요.',
    FINANCE_SETUP: '재정 데이터베이스 연결을 준비하고 있습니다.', ACCESS_SETUP: '권한 관리 연결 설정을 확인하세요.',
    MINISTRY_LOGIN_REQUIRED: '로그인이 필요합니다.', MINISTRY_MFA_REQUIRED: '설정한 2단계 인증을 완료하세요.',
    ACCESS_REAUTH: '현재 로그인한 계정의 비밀번호를 다시 확인하세요.',
    FINANCE_CONFLICT: '다른 변경이 있습니다. 새로고침하고 다시 저장하세요.',
    FINANCE_CLOSED: '마감한 연도입니다. 재정 책임자가 마감 해제한 뒤 수정하세요.',
    FINANCE_YEAR_MISSING: '먼저 회계연도를 개설하세요.', FINANCE_PREVIOUS_OPEN: '전년도 마감 후 잔액을 이월할 수 있습니다.',
    FINANCE_CARRY_LOCKED: '다음 연도에 이월한 장부입니다. 이월 자료를 확인한 후 정정해야 합니다.',
    FINANCE_DRAFTS: '승인 대기 전표를 승인하거나 취소한 뒤 마감하세요.',
    FINANCE_BALANCE: '이 처리 후 계좌 잔액이 음수가 됩니다. 수입·기초잔액을 확인하세요.',
    FINANCE_CATEGORY_KIND: '수입·지출 항목의 종류를 확인하세요. 기존 항목의 종류는 변경할 수 없습니다.',
    FINANCE_ENTRY_LOCKED: '수정할 수 없는 전표입니다. 승인한 전표는 사유를 남겨 취소하고 다시 등록하세요.',
    FINANCE_OPENING_LOCKED: '집행 내역이 있는 계좌의 기초잔액은 변경할 수 없습니다.',
    FINANCE_REASON: '처리 사유를 입력하세요.', FINANCE_ACCOUNT_MISSING: '가입한 계정을 찾을 수 없습니다.',
    FINANCE_LAST_MANAGER: '마지막 재정 책임자는 해제할 수 없습니다.',
    FINANCE_ACCOUNT_DELETING: '탈퇴 처리 중인 계정에는 재정 권한을 부여할 수 없습니다.',
  };
  const code = (error as { code?: string })?.code;
  const status = message === 'MINISTRY_LOGIN_REQUIRED' ? 401 : message.includes('FORBIDDEN') ? 403 : message === 'FINANCE_CONFLICT' ? 409 : error instanceof ZodError ? 422 : code === '42P01' || code === '42883' || message.includes('SETUP') ? 503 : messages[message] ? 422 : 500;
  return Response.json({ message: error instanceof ZodError ? error.issues[0]?.message ?? '입력값을 확인하세요.' : messages[message] ?? (code === '23505' ? '같은 이름이나 번호가 이미 있습니다.' : status === 503 ? '재정 데이터베이스 연결을 준비하고 있습니다.' : '재정 요청을 처리하지 못했습니다. 입력값을 확인하고 다시 시도하세요.') }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
