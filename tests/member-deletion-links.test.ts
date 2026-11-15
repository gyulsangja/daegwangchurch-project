import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('app deletion removes linked intake and appointment while preserving independent church records', async () => {
  const db = new PGlite();
  const owner = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  try {
    await db.exec('CREATE TABLE public.member_profiles("ownerId" uuid PRIMARY KEY); CREATE TABLE public.member_care_requests(id text PRIMARY KEY, "ownerId" uuid NOT NULL);');
    await db.exec(readFileSync('packages/database/ministry/001_workspace.sql', 'utf8'));
    await db.exec(readFileSync('packages/database/ministry/009_member_deletion_links.sql', 'utf8'));
    await db.exec("INSERT INTO ministry.churches VALUES('church','{}'); INSERT INTO ministry.members VALUES('church','member','{}'); INSERT INTO ministry.records VALUES('church','independent-record','member','{}');");
    for (const [user, suffix] of [[owner, 'one'], [other, 'two']]) {
      await db.query('INSERT INTO public.member_profiles VALUES($1)', [user]);
      await db.query('INSERT INTO public.member_care_requests VALUES($1,$2)', [suffix, user]);
      await db.query("INSERT INTO ministry.pastoral VALUES('church',$1,'member',$2)", [suffix, { body: 'Synthetic follow-up', history: [{ note: 'Synthetic note' }] }]);
      await db.query("INSERT INTO ministry.care_intakes(church_id,source_id,member_id,pastoral_id,imported_by) VALUES('church',$1,'member',$1,$2)", [suffix, user]);
    }
    await db.query("INSERT INTO ministry.account_links(church_id,member_id,user_id,approved_by) VALUES('church','member',$1,$1)", [owner]);
    await db.query('DELETE FROM public.member_care_requests WHERE "ownerId"=$1', [owner]);
    await db.query('DELETE FROM public.member_profiles WHERE "ownerId"=$1', [owner]);
    assert.equal((await db.query('SELECT * FROM ministry.account_links')).rows.length, 0);
    assert.deepEqual((await db.query('SELECT source_id FROM ministry.care_intakes')).rows, [{ source_id: 'two' }]);
    assert.deepEqual((await db.query('SELECT id FROM ministry.pastoral')).rows, [{ id: 'two' }]);
    assert.equal((await db.query('SELECT * FROM ministry.members')).rows.length, 1);
    assert.equal((await db.query('SELECT * FROM ministry.records')).rows.length, 1);
    await assert.rejects(db.query("INSERT INTO ministry.account_links(church_id,member_id,user_id,approved_by) VALUES('church','member',$1,$1)", [owner]), /foreign key/);
    await assert.rejects(db.query("INSERT INTO ministry.care_intakes(church_id,source_id,member_id,pastoral_id,imported_by) VALUES('church','one','member','two',$1)", [owner]), /foreign key/);
    await db.exec('CREATE ROLE unrelated_member');
    const permissions = await db.query<{ allowed: boolean }>("SELECT has_function_privilege('unrelated_member','ministry.remove_deleted_care_intake()','EXECUTE') AS allowed");
    assert.equal(permissions.rows[0].allowed, false);
  } finally { await db.close(); }
});

test('ministry-only access blocks deletion and a deleting account cannot acquire access', async () => {
  const db = new PGlite();
  const owner = '11111111-1111-4111-8111-111111111111';
  try {
    await db.exec('CREATE TABLE public.member_deletions("ownerId" uuid PRIMARY KEY);');
    await db.exec(readFileSync('packages/database/ministry/001_workspace.sql', 'utf8'));
    await db.exec(readFileSync('packages/database/ministry/010_member_deletion_access.sql', 'utf8'));
    await db.exec("INSERT INTO ministry.churches VALUES('church','{}');");
    await db.query("INSERT INTO ministry.access_grants(church_id,user_id,role) VALUES('church',$1,'ADMIN')", [owner]);
    await assert.rejects(db.query('INSERT INTO public.member_deletions VALUES($1)', [owner]), /Ministry access must be revoked/);
    assert.equal((await db.query('SELECT * FROM public.member_deletions')).rows.length, 0);
    await db.query('UPDATE ministry.access_grants SET active=false WHERE user_id=$1', [owner]);
    await db.query('INSERT INTO public.member_deletions VALUES($1)', [owner]);
    await assert.rejects(db.query('UPDATE ministry.access_grants SET active=true WHERE user_id=$1', [owner]), /Member unavailable/);
    await db.query('DELETE FROM ministry.access_grants WHERE user_id=$1', [owner]);
    await assert.rejects(db.query("INSERT INTO ministry.access_grants(church_id,user_id,role) VALUES('church',$1,'OFFICE')", [owner]), /Member unavailable/);
    await db.exec('CREATE ROLE unrelated_member');
    assert.equal((await db.query<{ allowed: boolean }>("SELECT has_function_privilege('unrelated_member','ministry.guard_deleting_account_access()','EXECUTE') AS allowed")).rows[0].allowed, false);
  } finally { await db.close(); }
});
