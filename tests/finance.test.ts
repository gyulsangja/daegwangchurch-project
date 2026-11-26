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
  await db.exec(readFileSync('packages/database/ministry/012_finance_period.sql', 'utf8'));
  await db.exec('CREATE TABLE ministry.families(church_id text,id text,payload jsonb);CREATE TABLE ministry.organizations(church_id text,id text,payload jsonb)');
  await db.exec(readFileSync('packages/database/ministry/013_month_categories.sql','utf8'));
  await db.exec(readFileSync('packages/database/ministry/014_giving_receipts.sql','utf8'));
  await db.exec(readFileSync('packages/database/ministry/015_direct_finance.sql','utf8'));
  await db.exec(readFileSync('packages/database/ministry/016_receipt_register.sql','utf8'));
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
    const manage=async (action:string,rest:Record<string,unknown>)=>f.db.query('select finance.manage($1::jsonb)',[JSON.stringify({action,year:2026,version:(await f.read()).version,requestId:randomUUID(),...rest})]);
    const pending={...entry,id:randomUUID(),date:'2026-10-15'};
    await f.write(pending);
    await assert.rejects(manage('MONTH_CLOSE',{month:10,reason:'대기 검증'}),/FINANCE_DRAFTS/);
    await manage('MONTH_CLOSE',{month:11,reason:'가상 검증'});
    await assert.rejects(f.write({...entry,id:randomUUID()}),/MONTH_LOCKED/);
    await assert.rejects(f.write({action:'ENTRY_VOID',id:entry.id,reason:'시도'}),/MONTH_LOCKED/);
    await assert.rejects(f.write({...pending,date:'2026-11-01'}),/MONTH_LOCKED/);
    await f.write({action:'ENTRY_VOID',id:pending.id,reason:'검증'});
    await f.as(writer);
    await assert.rejects(manage('MONTH_REOPEN',{month:11,reason:'권한 검증'}),/FINANCE_FORBIDDEN/);
    await f.as();
    await manage('MONTH_REOPEN',{month:11,reason:'해제 검증'});
    await manage('CATEGORY_CONFIG',{kind:'INCOME',id:income.id,name:income.name,offering:true,section:'헌금',active:false});
    await assert.rejects(f.write({...entry,id:randomUUID()}),/CATEGORY_INACTIVE/);
    await assert.rejects(manage('ISSUE_PAPER',{id:entry.id}),/PAPER_DISABLED/);
    const receipt=async(action:string,fields:Record<string,unknown>)=>f.db.query(action==='RECEIPT_CANCEL'?'select finance.cancel_receipt($1::jsonb)':'select finance.receipt_command($1::jsonb)',[JSON.stringify({action,requestId:randomUUID(),year:2026,version:(await f.read()).version,reason:'가상 확인',...fields})]);
    await receipt('ISSUER_SETUP',{name:'가상',address:'가상 주소',registration:'0000000000',legalBasis:'가상 근거',giftCode:'41',confirmed:true});
    const manual={id:null,memberId:null,donorName:'가상 기부자',amount:1100,date:'2026-03-05',description:'수기 장부 기부',reason:'가상 대조'};
    await assert.rejects(receipt('RECEIPT_WRITE',{...manual,date:'2025-03-05'}),/FINANCE_INVALID/);
    await assert.rejects(receipt('RECEIPT_WRITE',{...manual,goods:{quantity:3,unitPrice:550}}),/FINANCE_INVALID/);
    await receipt('RECEIPT_WRITE',{...manual,goods:{quantity:2,unitPrice:550}});
    const direct=(await f.db.query<{s:FinanceSnapshot}>('select finance.giving_workspace(2026,null,null) s')).rows[0].s;
    assert.equal(direct.receipts![0].description,manual.description);assert.equal(direct.receipts![0].id,null);
    assert.equal(direct.receipts![0].goods?.quantity,2);
    assert.equal(direct.issuer?.registration,'0000000000');
    await f.as(writer);
    const instant={...entry,kind:'EXPENSE',categoryId:expense.id,memberId:null,id:randomUUID(),action:'ENTRY_RECORD',amount:5};
    await f.write(instant);
    assert.equal((await f.read()).entries.find(e=>e.id===instant.id)?.status,'POSTED');
    const overdraw={...instant,id:randomUUID(),amount:100000};
    await assert.rejects(f.write(overdraw),/FINANCE_BALANCE/);
    assert.equal((await f.read()).entries.some(e=>e.id===overdraw.id),false);
    await f.as();await f.write({action:'ENTRY_VOID',id:instant.id,reason:'가상 검증 완료'});

    await assert.rejects(receipt('RECEIPT_SHARE',{id:entry.id,amount:100,memberId:'member2'}),/FINANCE_INVALID/);
    await receipt('RECEIPT_SHARE',{id:entry.id,amount:300,memberId:'member1'});
    await assert.rejects(receipt('RECEIPT_SHARE',{id:entry.id,amount:501,memberId:'member1'}),/SHARE_AMOUNT/);
    await assert.rejects(manage('ISSUE_PAPER',{id:entry.id}),/RECEIPT_ISSUED/);
    const desk=async()=>(await f.db.query<{s:FinanceSnapshot}>('select finance.giving_workspace(2026,null,null) s')).rows[0].s;
    const first=(await desk()).receipts![0];assert.equal(first.amount,300);assert.match(first.documentNo!,/^\d{4}-\d{5,}$/);
    await f.as(writer);await assert.rejects(receipt('RECEIPT_CANCEL',{serial:first.serial}),/FINANCE_FORBIDDEN/);
    assert.equal((await desk()).receipts,undefined);await f.as();
    await receipt('RECEIPT_CANCEL',{serial:first.serial});assert.equal((await desk()).receipts![0].voided,true);

    await manage('ISSUE_PAPER',{id:entry.id});
    await assert.rejects(manage('ISSUE_PAPER',{id:entry.id}),/duplicate key/);
    await assert.rejects(f.write({action:'ENTRY_VOID',id:entry.id,reason:'검증'}),/RECEIPT_ISSUED/);
    const issued=(await f.db.query<{s:FinanceSnapshot}>('select finance.workspace(2026,null,null) s')).rows[0].s.receipts!;
    assert.equal(issued.length,1);assert.equal(issued[0].amount,800);assert.equal(issued[0].id,entry.id);
    await receipt('RECEIPT_CANCEL',{serial:issued[0].serial});
    const registry=(await f.db.query<{r:NonNullable<FinanceSnapshot['receipts']>}>('select finance.receipt_register(2026,false) r')).rows[0].r;
    assert.equal(registry.find(r=>r.serial===issued[0].serial)?.voidBy,manager);
    assert.ok(registry.find(r=>r.serial===first.serial)?.voidAt);
    assert.ok(registry.every(r=>r.documentNo));
    await f.as(reporter);
    assert.equal((await f.db.query<{s:FinanceSnapshot}>('select finance.workspace(2026,null,null) s')).rows[0].s.receipts,undefined);
    const period = async (start:string,end:string) => (await f.db.query<{s:FinanceSnapshot}>('select finance.read_period(2026,$1,$2) s',[start,end])).rows[0].s;
    await assert.rejects(f.db.query('select finance.receipt_register(2026,true)'),/FINANCE_FORBIDDEN/);
    const october = await period('2026-10-01','2026-10-31');
    assert.equal(financeTotals(october).balance,1000);
    assert.equal(financeTotals(october).income,0);
    const day = await period('2026-11-25','2026-11-25');
    assert.equal(financeTotals(day).expense,300);
    assert.equal(day.entries.length,0);
    await assert.rejects(period('2025-12-31','2026-01-01'),/FINANCE_INVALID/);
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
