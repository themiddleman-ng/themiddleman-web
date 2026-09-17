import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

// Capability probe only: this synthetic schema is NOT the application's schema.
// Never connects to Supabase, imports production rows, or reads credentials.
test('free local database enforces roles, RLS, constraints and rollback', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role probe_client nologin nosuperuser nobypassrls;
      create table public.probe (
        id integer primary key,
        owner_id text not null,
        status text not null check (status in ('pending', 'completed'))
      );
      alter table public.probe enable row level security;
      grant usage on schema public to probe_client;
      grant select, insert, update on public.probe to probe_client;
      create policy own_rows on public.probe to probe_client
        using (owner_id = current_setting('probe.user_id', true))
        with check (owner_id = current_setting('probe.user_id', true));
      insert into public.probe values (1, 'buyer', 'pending'), (2, 'other', 'pending');
      set role probe_client;
      set probe.user_id = 'buyer';
    `);
    assert.deepEqual((await db.query('select id from public.probe')).rows, [{ id: 1 }]);
    await assert.rejects(db.exec("insert into public.probe values (3, 'other', 'pending')"), { code: '42501' });
    await assert.rejects(db.exec("update public.probe set owner_id = 'other' where id = 1"), { code: '42501' });
    await assert.rejects(db.exec("insert into public.probe values (3, 'buyer', 'invented')"), { code: '23514' });
    await db.exec("begin; update public.probe set status = 'completed' where id = 1; rollback;");
    assert.equal((await db.query('select status from public.probe where id = 1')).rows[0].status, 'pending');
    await db.exec("set probe.user_id = 'unrelated';");
    assert.deepEqual((await db.query('select id from public.probe')).rows, []);
  } finally {
    await db.close();
  }
});
