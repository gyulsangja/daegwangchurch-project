import { z } from 'zod';

export const financeRole = z.enum(['MANAGER', 'BOOKKEEPER', 'AUDITOR', 'REPORTER']);
export const financeRoles = { MANAGER: '재정 책임자', BOOKKEEPER: '회계 입력 담당', AUDITOR: '감사 · 상세 열람', REPORTER: '결산 요약 열람' };
const year = z.number().int().min(2000).max(2200);
const money = z.number().int().min(0).max(1_000_000_000_000);
const name = z.string().trim().min(1).max(100);
const base = z.object({ requestId: z.uuid(), year, version: z.number().int().nonnegative() });
export const financeCommand = z.discriminatedUnion('action', [
  base.extend({ action: z.literal('YEAR_CREATE'), carry: z.boolean() }).strict(),
  base.extend({ action: z.literal('YEAR_CLOSE'), reason: z.string().trim().min(1).max(300) }).strict(),
  base.extend({ action: z.literal('YEAR_REOPEN'), reason: z.string().trim().min(1).max(300) }).strict(),
  base.extend({ action: z.literal('CATEGORY_SAVE'), id: z.uuid(), name, kind: z.enum(['INCOME', 'EXPENSE']), offering: z.boolean() }).strict(),
  base.extend({ action: z.literal('ACCOUNT_SAVE'), id: z.uuid(), name, opening: money }).strict(),
  base.extend({ action: z.literal('BUDGET_SAVE'), categoryId: z.uuid(), amount: money, reason: z.string().trim().min(1).max(300) }).strict(),
  base.extend({
    action: z.literal('ENTRY_SAVE'), id: z.uuid(), date: z.iso.date(), kind: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    accountId: z.uuid(), destinationId: z.uuid().nullable(), categoryId: z.uuid().nullable(), amount: money.positive(),
    memberId: z.string().max(100).nullable(), party: z.string().trim().max(100), memo: z.string().trim().min(1).max(1000),
    receipt: z.string().trim().max(300),
  }).strict().superRefine((value, context) => {
    if (!value.date.startsWith(`${value.year}-`)) context.addIssue({ code: 'custom', message: '선택한 회계연도의 날짜를 입력하세요.' });
    if (value.kind === 'TRANSFER' ? !value.destinationId || value.destinationId === value.accountId || value.categoryId !== null : !value.categoryId || value.destinationId !== null) {
      context.addIssue({ code: 'custom', message: '항목과 입출금 계좌를 확인하세요.' });
    }
    if (value.kind !== 'INCOME' && value.memberId) context.addIssue({ code: 'custom', message: '교인 연결은 수입에만 사용할 수 있습니다.' });
  }),
  base.extend({ action: z.enum(['ENTRY_POST', 'ENTRY_VOID']), id: z.uuid(), reason: z.string().trim().min(1).max(300) }).strict(),
  z.object({ action: z.literal('ACCESS_SAVE'), requestId: z.uuid(), email: z.email().max(254), role: financeRole, active: z.boolean(), version: z.number().int().nonnegative(), reason: z.string().trim().min(1).max(300) }).strict(),
]);
export type FinanceCommand = z.infer<typeof financeCommand>;
export type FinanceRole = z.infer<typeof financeRole>;
export type FinanceAccount = { id: string; name: string; opening: number; balance: number };
export type FinanceCategory = { id: string; name: string; kind: 'INCOME' | 'EXPENSE'; offering: boolean; budget: number; actual: number; annualActual?: number };
export type FinanceEntry = { id: string; date: string; kind: 'INCOME' | 'EXPENSE' | 'TRANSFER'; accountId: string; destinationId: string | null; categoryId: string | null; amount: number; memberId: string | null; party: string; memo: string; receipt: string; status: 'DRAFT' | 'POSTED' | 'VOID'; createdBy: string; approvedBy: string | null };
export type FinanceSnapshot = {
  role: FinanceRole | null; canManageAccess: boolean; year: number; version: number; closed: boolean; years: number[];
  accounts: FinanceAccount[]; categories: FinanceCategory[]; entries: FinanceEntry[];
  members: { id: string; name: string }[];
  grants: { email: string; role: FinanceRole; active: boolean; version: number }[];
  events: { action: string; at: string; actor: string; reason: string }[];
};

export function financeTotals(data: Pick<FinanceSnapshot, 'categories' | 'accounts'>) {
  const sum = (kind: 'INCOME' | 'EXPENSE', field: 'actual' | 'budget') => data.categories.filter(c => c.kind === kind).reduce((total, c) => total + c[field], 0);
  return { income: sum('INCOME', 'actual'), expense: sum('EXPENSE', 'actual'), budget: sum('EXPENSE', 'budget'), balance: data.accounts.reduce((total, a) => total + a.balance, 0) };
}

export function financeCsv(rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = String(value);
    const safe = typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
