import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const sql = await readFile(new URL("../supabase/migrations/20261110193909_protect_profile_role.sql", import.meta.url), "utf8");
const buyer = "11111111-1111-4111-8111-111111111111";

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role authenticated;
    create role anon;
    create role service_role;
    create type public.user_role as enum ('buyer', 'seller', 'admin');
    create table public.profiles (
      id uuid primary key,
      role public.user_role not null default 'buyer',
      display_name text
    );
    create table public.users (
      id uuid primary key,
      email text not null,
      is_buyer boolean not null default true,
      is_seller boolean not null default false
    );
  `);
  await db.exec(sql);
  await db.exec("grant select, insert, update on public.profiles to authenticated, anon");
  return db;
}

test("authenticated cannot insert or upsert a profile into admin", async () => {
  const db = await setup();
  await db.exec("set role authenticated");
  await assert.rejects(
    db.exec(`insert into public.profiles (id, role) values ('${buyer}', 'admin')`),
    /profile role is assigned by the platform/,
  );
  await db.exec("reset role");
  await db.exec(`insert into public.profiles (id, role, display_name) values ('${buyer}', 'buyer', 'Buyer')`);
  await db.exec("set role authenticated");
  await assert.rejects(
    db.exec(`insert into public.profiles (id, role) values ('${buyer}', 'admin')
      on conflict (id) do update set role = excluded.role`),
    /profile role is assigned by the platform/,
  );
  const row = await db.query("select role::text as role from public.profiles where id = $1", [buyer]);
  assert.equal(row.rows[0].role, "buyer");
  await db.close();
});

test("authenticated onboarding can keep buyer and cannot change the role later", async () => {
  const db = await setup();
  await db.exec("set role authenticated");
  await db.exec(`insert into public.profiles (id, role, display_name) values ('${buyer}', 'buyer', 'Buyer')`);
  await db.exec(`update public.profiles set display_name = 'Renamed' where id = '${buyer}'`);
  await assert.rejects(
    db.exec(`update public.profiles set role = 'admin' where id = '${buyer}'`),
    /profile role is assigned by the platform/,
  );
  await db.exec("reset role");
  const row = await db.query("select role::text as role, display_name from public.profiles where id = $1", [buyer]);
  assert.equal(row.rows[0].role, "buyer");
  assert.equal(row.rows[0].display_name, "Renamed");
  await db.close();
});

test("the platform owner can assign admin, and users.role is left alone when the column is absent", async () => {
  const db = await setup();
  await db.exec(`insert into public.profiles (id, role) values ('${buyer}', 'admin')`);
  const row = await db.query("select role::text as role from public.profiles where id = $1", [buyer]);
  assert.equal(row.rows[0].role, "admin");
  const triggers = await db.query(`
    select tgname from pg_trigger
    where tgrelid = 'public.users'::regclass and not tgisinternal
  `);
  assert.equal(triggers.rows.length, 0);
  await db.close();
});

test("when users.role exists, authenticated cannot self-assign admin", async () => {
  const db = new PGlite();
  await db.exec(`
    create role authenticated;
    create role anon;
    create role service_role;
    create type public.user_role as enum ('buyer', 'seller', 'admin');
    create table public.profiles (
      id uuid primary key,
      role public.user_role not null default 'buyer'
    );
    create table public.users (
      id uuid primary key,
      email text not null,
      role text not null default 'buyer'
    );
  `);
  await db.exec(sql);
  await db.exec("grant select, insert, update on public.users to authenticated, anon");
  await db.exec(`insert into public.users (id, email, role) values ('${buyer}', 'buyer@test.local', 'buyer')`);
  await db.exec("set role authenticated");
  await assert.rejects(
    db.exec(`update public.users set role = 'admin' where id = '${buyer}'`),
    /account role is assigned by the platform/,
  );
  await db.exec("reset role");
  const row = await db.query("select role from public.users where id = $1", [buyer]);
  assert.equal(row.rows[0].role, "buyer");
  await db.close();
});
