import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { financeCommand, financeCsv, financeTotals, type FinanceSnapshot } from '../packages/contracts/src/finance';

const manager = '11111111-1111-4111-8111-111111111111';
const writer = '22222222-2222-4222-8222-222222222222';
const reporter = '33333333-3333-4333-8333-333333333333';
const outsider = '44444444-4444-4444-8444-444444444444';

async function fixture() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE daegwang_ministry_runtime; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated,service_role;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,deleted_at timestamptz,is_anonymous boolean DEFAULT false);
    CREATE SCHEMA ministry; CREATE TABLE ministry.churches(id text PRIMARY KEY);
    CREATE TABLE ministry.access_grants(church_id text,user_id uuid,active boolean,role text);
    CREATE TABLE ministry.members(church_id text,id text,payload jsonb,PRIMARY KEY(church_id,id));
    CREATE TABLE public.member_deletions("ownerId" uuid PRIMARY KEY);
    INSERT INTO ministry.churches VALUES('one'),('two');
    INSERT INTO auth.users(id,email) VALUES('${manager}','manager@example.invalid'),('${writer}','writer@example.invalid'),('${reporter}','reporter@example.invalid'),('${outsider}','other@example.invalid');
    INSERT INTO ministry.access_grants VALUES('one','${manager}',true,'ADMIN');
    INSERT INTO ministry.members VALUES('one','member1','{"name":"가상교인"}'),('two','member2','{"name":"다른교회"}');
  `);
  await db.exec(readFileSync('packages/database/ministry/011_finance.sql', 'utf8'));
  await db.exec('SET ROLE daegwang_ministry_runtime');
  const as = async (user = manager, church = 'one', verified = true) => {
    await db.query("SELECT set_config('ministry.user_id',$1,false),set_config('ministry.church_id',$2,false),set_config('ministry.aal','aal1',false),set_config('ministry.reauthenticated',$3,false)", [user, church, String(verified)]);
  };
  await as();
  const read = async (year = 2026) => (await db.query<{ result: FinanceSnapshot }>('SELECT finance.read_year($1) AS result', [year])).rows[0].result;
  const command = async (input: Record<string, unknown>) => (await db.query<{ result: { saved: boolean; duplicate?: boolean } }>('SELECT finance.command($1::jsonb) AS result', [JSON.stringify(input)])).rows[0].result;
  const write = async (input: Record<string, unknown>, year = 2026) => command({ requestId: randomUUID(), year, version: (await read(year)).version, ...input });
  const grant = async (email: string, role: string, version = 0, active = true) => command({ requestId: randomUUID(), action: 'ACCESS_SAVE', email, role, version, active, reason: '가상 권한 검증' });
  return { db, as, read, command, write, grant };
}

test('finance grants are explicit, server-scoped and separate from ministry roles', async () => {
  const f = await fixture();
  try {
    const before = await f.read();
    assert.equal(before.role, null); assert.equal(before.canManageAccess, true);
    await assert.rejects(f.write({ action: 'YEAR_CREATE', carry: false }), /FINANCE_FORBIDDEN/);
    await f.as(manager, 'one', false);
    await assert.rejects(f.grant('manager@example.invalid', 'MANAGER'), /ACCESS_REAUTH/);
    await f.as(); await f.grant('manager@example.invalid', 'MANAGER');
    await f.grant('writer@example.invalid', 'BOOKKEEPER');
    await f.as(writer); assert.equal((await f.read()).role, 'BOOKKEEPER');
    await assert.rejects(f.grant('other@example.invalid', 'MANAGER'), /FINANCE_FORBIDDEN/);
    await assert.rejects(f.write({ action: 'YEAR_CREATE', carry: false }), /FINANCE_FORBIDDEN/);
    await f.as(manager, 'two'); await assert.rejects(f.read(), /FINANCE_FORBIDDEN/);
    await f.as(outsider); await assert.rejects(f.read(), /FINANCE_FORBIDDEN/);
    await assert.rejects(f.db.query('SELECT * FROM finance.entries'), /permission denied/);
    await f.db.exec('RESET ROLE');
    const permissions = await f.db.query<{ count: number }>("SELECT count(*)::int AS count FROM information_schema.role_table_grants WHERE table_schema='finance' AND grantee IN ('anon','authenticated','service_role')");
    assert.equal(permissions.rows[0].count, 0);
    const executable = await f.db.query<{ allowed: boolean }>("SELECT has_function_privilege('authenticated','finance.read_year(integer)','EXECUTE') AS allowed");
    assert.equal(executable.rows[0].allowed, false);
  } finally { await f.db.close(); }
});

test('finance postings, budgets, transfers, close and carry preserve balances and prevent stale or duplicate writes', async () => {
  const f = await fixture();
  try {
    await f.grant('manager@example.invalid', 'MANAGER');
    await f.grant('writer@example.invalid', 'BOOKKEEPER');
    await f.grant('reporter@example.invalid', 'REPORTER');
    await f.write({ action: 'YEAR_CREATE', carry: false });
    const account = randomUUID(), second = randomUUID();
    await f.write({ action: 'ACCOUNT_SAVE', id: account, name: '보통예금', opening: 1000 });
    await f.write({ action: 'ACCOUNT_SAVE', id: second, name: '현금', opening: 0 });
    let snapshot = await f.read();
    const income = snapshot.categories.find(c => c.offering)!;
    const expense = snapshot.categories.find(c => c.kind === 'EXPENSE')!;
    await f.write({ action: 'BUDGET_SAVE', categoryId: expense.id, amount: 500, reason: '연간 예산' });
    const entry = { action: 'ENTRY_SAVE', id: randomUUID(), date: '2026-11-25', kind: 'INCOME', accountId: account, destinationId: null, categoryId: income.id, amount: 800, memberId: 'member1', party: '', memo: '가상 헌금', receipt: '보관함 1' };
    await f.as(writer);
    const input = { ...entry, requestId: randomUUID(), year: 2026, version: (await f.read()).version };
    assert.equal(financeCommand.safeParse(input).success, true);
    await f.command(input);
    assert.equal((await f.command(input)).duplicate, true);
    await assert.rejects(f.command({ ...input, amount: 999 }), /FINANCE_CONFLICT/);
    await assert.rejects(f.write({ action: 'ENTRY_POST', id: entry.id, reason: '승인 시도' }), /FINANCE_FORBIDDEN/);
    await f.as();
    await f.write({ action: 'ENTRY_POST', id: entry.id, reason: '입금 확인' });
    await assert.rejects(f.write({ ...entry, amount: 900 }), /FINANCE_ENTRY_LOCKED/);
    const outgoing = { ...entry, id: randomUUID(), kind: 'EXPENSE', categoryId: expense.id, memberId: null, party: '가상 거래처', amount: 300 };
    await f.write(outgoing); await f.write({ action: 'ENTRY_POST', id: outgoing.id, reason: '영수증 확인' });
    const transfer = { ...entry, id: randomUUID(), kind: 'TRANSFER', categoryId: null, memberId: null, destinationId: second, amount: 200 };
    await f.write(transfer); await f.write({ action: 'ENTRY_POST', id: transfer.id, reason: '현금 출금 확인' });
    snapshot = await f.read();
    assert.deepEqual(financeTotals(snapshot), { income: 800, expense: 300, budget: 500, balance: 1500 });
    assert.equal(snapshot.accounts.find(a => a.id === account)?.balance, 1300);
    assert.equal(snapshot.accounts.find(a => a.id === second)?.balance, 200);
    await assert.rejects(f.command({ requestId: randomUUID(), year: 2026, version: 1, action: 'ACCOUNT_SAVE', id: randomUUID(), name: '오래된 화면', opening: 0 }), /FINANCE_CONFLICT/);
    const excessive = { ...outgoing, id: randomUUID(), amount: 2000 };
    await f.write(excessive);
    await assert.rejects(f.write({ action: 'ENTRY_POST', id: excessive.id, reason: '잔액 초과 검사' }), /FINANCE_BALANCE/);
    assert.equal((await f.read()).entries.find(e => e.id === excessive.id)?.status, 'DRAFT');
    await assert.rejects(f.write({ action: 'YEAR_CLOSE', reason: '마감' }), /FINANCE_DRAFTS/);
    await f.write({ action: 'ENTRY_VOID', id: excessive.id, reason: '잘못된 입력 취소' });
    await f.as(reporter);
    const report = await f.read(); assert.deepEqual(report.entries, []); assert.deepEqual(report.members, []); assert.deepEqual(report.events, []);
    assert.equal(JSON.stringify(report).includes('가상교인'), false);
    assert.equal(financeTotals(report).income, 800);
    await f.as();
    await f.write({ action: 'YEAR_CLOSE', reason: '결산 확인' });
    await assert.rejects(f.write({ ...entry, id: randomUUID() }), /FINANCE_CLOSED/);
    await f.write({ action: 'YEAR_CREATE', carry: true }, 2027);
    assert.equal(financeTotals(await f.read(2027)).balance, 1500);
    assert.equal(financeTotals(await f.read(2027)).income, 0);
    assert.equal(financeTotals(await f.read(2027)).budget, 500);
    await assert.rejects(f.write({ action: 'YEAR_REOPEN', reason: '이월 후 변경' }), /FINANCE_CARRY_LOCKED/);
  } finally { await f.db.close(); }
});

test('finance protects active operators from account deletion and honours revocation', async () => {
  const f = await fixture();
  try {
    await f.grant('manager@example.invalid', 'MANAGER');
    await f.grant('writer@example.invalid', 'BOOKKEEPER');
    await assert.rejects(f.grant('manager@example.invalid', 'MANAGER', 1, false), /FINANCE_LAST_MANAGER/);
    await f.db.exec('RESET ROLE');
    await assert.rejects(f.db.query('INSERT INTO public.member_deletions VALUES($1)', [writer]), /FINANCE_REVOKE_BEFORE_DELETION/);
    await f.db.exec('SET ROLE daegwang_ministry_runtime');
    await f.grant('writer@example.invalid', 'BOOKKEEPER', 1, false);
    await f.as(writer); await assert.rejects(f.read(), /FINANCE_FORBIDDEN/);
    await f.db.exec('RESET ROLE'); await f.db.query('INSERT INTO public.member_deletions VALUES($1)', [writer]);
    await f.db.exec('SET ROLE daegwang_ministry_runtime'); await f.as();
    await assert.rejects(f.grant('writer@example.invalid', 'BOOKKEEPER', 2), /FINANCE_ACCOUNT_DELETING/);
  } finally { await f.db.close(); }
});

test('finance input uses whole won, calendar dates and safe CSV cells', () => {
  const input = { requestId: randomUUID(), action: 'ENTRY_SAVE', year: 2026, version: 1, id: randomUUID(), date: '2026-11-25', kind: 'EXPENSE', accountId: randomUUID(), destinationId: null, categoryId: randomUUID(), amount: 100, memberId: null, party: '', memo: '내용', receipt: '' };
  assert.equal(financeCommand.safeParse(input).success, true);
  for (const change of [{ amount: 0 }, { amount: 0.1 }, { date: '2025-11-25' }, { date: '2026-02-30' }, { memberId: 'member1' }]) assert.equal(financeCommand.safeParse({ ...input, ...change }).success, false);
  const csv = financeCsv([['=SUM(A1)', '+cmd', '@value', '"quote"', '한글', -123]]);
  assert.ok(csv.includes('"\'=SUM(A1)"')); assert.ok(csv.includes('"\'+cmd"')); assert.ok(csv.includes('""quote""')); assert.ok(csv.includes('"-123"'));
});
