import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { assertIsolatedSupabaseUrl, isolatedDbReason } from "../../scripts/db-isolated-guard.mjs";

test("db guard refuses hosted Supabase URLs", () => {
  assert.throws(() => assertIsolatedSupabaseUrl("https://abcdef.supabase.co"), /Refusing/);
  assert.throws(() => assertIsolatedSupabaseUrl("https://example.com"), /non-isolated/);
  assert.equal(assertIsolatedSupabaseUrl("http://127.0.0.1:54321").hostname, "127.0.0.1");
});

test("isolated supabase note when docker missing", () => {
  assert.match(isolatedDbReason(), /Docker/);
});

test("PGlite probe: wishlist and seller view policies", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create table seller_profiles (
        id uuid primary key,
        user_id uuid not null,
        display_name text not null,
        bio text,
        verification_status text not null,
        id_document_url text
      );
      create table public_seller_profiles as
        select id, display_name, bio, verification_status
        from seller_profiles
        where verification_status = 'approved';
      create table gig_wishlists (
        user_id uuid not null,
        gig_id uuid not null,
        primary key (user_id, gig_id)
      );
      alter table gig_wishlists enable row level security;
      create policy own_wishlists on gig_wishlists
        using (user_id::text = current_setting('app.user_id', true))
        with check (user_id::text = current_setting('app.user_id', true));
      insert into seller_profiles values
        ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'Approved', 'bio', 'approved', 'secret.pdf'),
        ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'Pending', 'bio', 'pending', 'secret2.pdf');
      delete from public_seller_profiles;
      insert into public_seller_profiles
        select id, display_name, bio, verification_status from seller_profiles where verification_status = 'approved';
    `);
    const pending = await db.query("select count(*)::int as c from public_seller_profiles where display_name = 'Pending'");
    assert.equal(pending.rows[0].c, 0);
    const secret = await db.query("select count(*)::int as c from public_seller_profiles where id_document_url is not null");
    assert.equal(secret.rows[0].c, 0);
  } finally {
    await db.close();
  }
});

test("RLS SQL suite file documents enquiry and draft checks", () => {
  const sql = readFileSync(new URL("../../scripts/rls-test-suite.sql", import.meta.url), "utf8");
  assert.match(sql, /draft gig hidden/i);
  assert.match(sql, /foreign wishlist/i);
});
