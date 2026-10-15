import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('browser cannot publish, replace ownership, restore, or hard-delete a listing; edits return to review', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create role anon; create role service_role;
      create table gigs(id int primary key, seller_id int, title text, price_ngn int, status text default 'active', updated_at timestamptz default now());
      grant select,insert,update,delete on gigs to authenticated,service_role;
      insert into gigs(id,seller_id,title,price_ngn) values(1,10,'Reviewed',1000);`);
    await db.exec(await readFile(new URL('../supabase/migrations/20261015074336_enforce_listing_review.sql', import.meta.url),'utf8'));
    await db.exec('set role authenticated');
    await assert.rejects(db.exec("insert into gigs(id,seller_id,status) values(2,10,'active')"),{code:'42501'});
    await db.exec("insert into gigs(id,seller_id,title) values(2,10,'Draft')");
    assert.equal((await db.query('select status from gigs where id=2')).rows[0].status,'pending_review');
    await assert.rejects(db.exec("update gigs set status='active' where id=2"),{code:'42501'});
    await assert.rejects(db.exec('update gigs set seller_id=11 where id=1'),{code:'42501'});
    await db.exec("update gigs set title='Changed after approval' where id=1");
    assert.equal((await db.query('select status from gigs where id=1')).rows[0].status,'pending_review');
    await db.exec("reset role; set role service_role; update gigs set status='active' where id=1; reset role; set role authenticated;");
    await db.exec("update gigs set status='paused' where id=1");
    await assert.rejects(db.exec("update gigs set status='active' where id=1"),{code:'42501'});
    await db.exec("update gigs set status='pending_review' where id=1");
    await assert.rejects(db.exec('delete from gigs where id=1'),{code:'42501'});
    await db.exec("update gigs set status='deleted' where id=1");
    await assert.rejects(db.exec("update gigs set status='pending_review' where id=1"),{code:'42501'});
    await db.exec("reset role; set role service_role; update gigs set status='changes_requested' where id=2; update gigs set status='rejected' where id=2;");
  } finally { await db.close(); }
});
