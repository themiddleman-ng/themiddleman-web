import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const ownUser = "10000000-0000-4000-8000-000000000001";
const otherUser = "10000000-0000-4000-8000-000000000002";

async function fixture() {
  const db = new PGlite();
  await db.exec([
    "create role authenticated;",
    "create role anon;",
    "create role service_role bypassrls;",
    "create schema auth;",
    "create schema private;",
    "create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;",
    "create table auth.users(id uuid primary key);",
    "create table public.seller_profiles(id uuid primary key, user_id uuid unique not null references auth.users(id));",
    "create table public.seller_payout_accounts(seller_id uuid primary key references public.seller_profiles(id), recipient_code text not null, verified_by uuid not null references auth.users(id), verified_at timestamptz not null default now());",
    "grant usage on schema public, auth, private to authenticated, service_role;",
    "grant select, insert, update on public.seller_payout_accounts to service_role;"
  ].join("\n"));
  await db.query("insert into auth.users(id) values ($1), ($2)", [ownUser, otherUser]);
  await db.exec(await readFile(
    new URL("../supabase/migrations/20261012110000_seller_payout_onboarding.sql", import.meta.url),
    "utf8",
  ));
  return db;
}

test("onboarding preferences are private to their user", async () => {
  const db = await fixture();
  try {
    await db.query(
      "insert into public.user_onboarding_preferences(user_id, experience_choice, walkthrough_status) values ($1, 'veteran', 'skipped')",
      [otherUser],
    );
    await db.exec("set role authenticated; set request.jwt.claim.sub = '" + ownUser + "';");
    const result = await db.query("select user_id from public.user_onboarding_preferences");
    assert.equal(result.rows.length, 0);
    await db.query(
      "insert into public.user_onboarding_preferences(user_id, experience_choice, walkthrough_status) values ($1, 'new', 'in_progress')",
      [ownUser],
    );
    await assert.rejects(
      db.query(
        "insert into public.user_onboarding_preferences(user_id, experience_choice, walkthrough_status) values ($1, 'veteran', 'skipped')",
        [otherUser],
      ),
      { code: "42501" },
    );
    await assert.rejects(
      db.query("select * from public.seller_payout_accounts"),
      { code: "42501" },
    );
  } finally {
    await db.close();
  }
});

test("only the server role can consume the daily bank verification allowance", async () => {
  const db = await fixture();
  try {
    await db.exec("set role authenticated; set request.jwt.claim.sub = '" + ownUser + "';");
    await assert.rejects(
      db.query("select public.consume_seller_payout_verification_attempt($1)", [ownUser]),
      { code: "42501" },
    );
    await db.exec("reset role; set role service_role;");
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await db.query(
        "select public.consume_seller_payout_verification_attempt($1) as allowed",
        [ownUser],
      );
      assert.equal(result.rows[0].allowed, true);
    }
    const blocked = await db.query(
      "select public.consume_seller_payout_verification_attempt($1) as allowed",
      [ownUser],
    );
    assert.equal(blocked.rows[0].allowed, false);
  } finally {
    await db.close();
  }
});
