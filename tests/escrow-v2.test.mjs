import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const buyer = "10000000-0000-4000-8000-000000000001",
  seller = "10000000-0000-4000-8000-000000000002",
  admin = "10000000-0000-4000-8000-000000000003",
  other = "10000000-0000-4000-8000-000000000004",
  profile = "10000000-0000-4000-8000-000000000005",
  gig = "10000000-0000-4000-8000-000000000006";
const uuid = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function fixture() {
  const db = new PGlite();
  await db.exec(`create role authenticated;create role anon;create role service_role bypassrls;
    create schema auth;create function auth.uid() returns uuid language sql as $$select null::uuid$$;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
    create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);
    create schema storage;create table storage.objects(id uuid,bucket_id text,name text);alter table storage.objects enable row level security;create policy "Allow authenticated uploads 18sed9p_0" on storage.objects for insert to authenticated with check(true);create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create type public.delivery_status as enum ('pending_upload','pending_review','needs_seller_edit','ready','delivered','expired');
    create type public.order_status as enum ('pending_payment','in_escrow','delivered','approved','disputed','refunded');
    create type public.verification_status as enum ('draft','pending','approved','rejected');
    create table public.users(id uuid primary key,email text,full_name text,phone text,state text);
    create table public.profiles(id uuid primary key references auth.users(id),role text);
    create table public.seller_profiles(id uuid primary key,user_id uuid,display_name text,verification_status public.verification_status default 'approved');
    create table public.gigs(id uuid primary key,seller_id uuid,title text,description text,price_ngn integer,status text default 'active',is_sold boolean default false,is_exclusive boolean default false,demo_links text[],gallery_image_paths text[],demo_video_path text);
    create table public.orders(id uuid primary key default gen_random_uuid(),gig_id uuid,buyer_id uuid,seller_id uuid,amount numeric,status public.order_status default 'pending_payment',idempotency_key uuid,created_at timestamptz default now(),updated_at timestamptz default now(),unique(buyer_id,idempotency_key));
    create table public.payments(id uuid primary key default gen_random_uuid(),order_id uuid,paystack_reference text unique,amount numeric,platform_fee numeric default 0,escrow_status text,payout_status text,created_at timestamptz default now(),updated_at timestamptz default now());
    create table public.transactions(id uuid primary key);
    create table public.deliveries(id uuid primary key default gen_random_uuid(),gig_id uuid,buyer_id uuid,seller_id uuid,status public.delivery_status default 'pending_upload',storage_path text,review_notes text,admin_reviewer_id uuid,reviewed_at timestamptz,delivered_at timestamptz,dispute_window_closes_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
    create table public.disputes(id uuid primary key default gen_random_uuid(),order_id uuid,raised_by uuid,reason text,status text default 'open',resolution_notes text,created_at timestamptz default now(),resolved_at timestamptz);
    create table public.platform_settings(key text primary key,value text);
    create function public.calculate_transaction_fees(bigint,numeric default .10,bigint default 150000,numeric default .075) returns jsonb language sql as $$select '{}'::jsonb$$;
    create function public.claim_exclusive_gig(uuid) returns boolean language sql as $$select true$$;
    grant usage on schema public to service_role,authenticated,anon;
    grant all on all tables in schema public to service_role,authenticated,anon;
    insert into auth.users(id) values('${buyer}'),('${seller}'),('${admin}'),('${other}');
    insert into public.profiles values('${admin}','admin');
    insert into public.seller_profiles(id,user_id,display_name) values('${profile}','${seller}','Creator');
    insert into public.gigs(id,seller_id,title,price_ngn,is_exclusive) values('${gig}','${profile}','Repo product',50000,true);
  `);
  for (const name of [
    "20260917215825_phase_c_verified_paystack.sql",
    "20260922232250_phase_d_order_delivery_review.sql",
    "20261002172833_escrow_fulfilment_v2.sql",
    "20261002180420_escrow_compatibility_hardening.sql",
    "20261002181508_escrow_provider_evidence.sql",
  ])
    await db.exec(
      await readFile(
        new URL(`../supabase/migrations/${name}`, import.meta.url),
        "utf8",
      ),
    );
  await db.exec(
    `create trigger delivery_window before update on public.deliveries for each row execute function public.set_dispute_window();update public.gigs set listing_review_status='approved';set role service_role;`,
  );
  return db;
}
const create = async (db, who = buyer, key = 1) =>
  (
    await db.query(
      "select public.create_escrow_order($1,$2,$3,1500,now(),$4) result",
      [who, gig, uuid(key), "test quoted FX"],
    )
  ).rows[0].result;
const pay = (db, id, total = 5322500) =>
  db.query("select public.record_paystack_payment($1,$2,$3) result", [
    `mm_${id}`,
    total,
    "NGN",
  ]);
const submit = (db, id) =>
  db.query(
    "select public.submit_checked_order_delivery($1,$2,$3,$4,100,$5) id",
    [id, seller, `${id}/${uuid(99)}.zip`, "a".repeat(64), "application/zip"],
  );
test("fees, exclusive reservation, signed payment replay, checked package, acceptance and confirmed payout", async () => {
  const db = await fixture();
  try {
    const c = await create(db),
      id = c.order.id;
    assert.equal(c.fees.buyer_total_kobo, 5322500);
    assert.equal(c.fees.seller_payout_kobo, 4462500);
    assert.equal(c.fees.buyer_vat_kobo, 22500);
    assert.equal(c.fees.seller_vat_kobo, 37500);
    assert.equal((await create(db)).order.id, id);
    await assert.rejects(create(db, other, 2));
    await assert.rejects(pay(db, id, 5000000));
    assert.equal((await pay(db, id)).rows[0].result, "recorded");
    assert.equal((await pay(db, id)).rows[0].result, "duplicate");
    const delivery = (await submit(db, id)).rows[0].id;
    await assert.rejects(
      db.query("select public.review_order_delivery($1,$2,true,$3)", [
        delivery,
        buyer,
        "Package matches listing",
      ]),
      { code: "42501" },
    );
    await db.query("select public.review_order_delivery($1,$2,true,$3)", [
      delivery,
      admin,
      "Package and preview commit match",
    ]);
    assert.equal(
      Number(
        (
          await db.query(
            "select extract(epoch from dispute_window_closes_at-delivered_at)/3600 hours from public.deliveries",
          )
        ).rows[0].hours,
      ),
      72,
    );
    await db.query("select public.accept_order_delivery($1,$2)", [id, buyer]);
    await db.query("select public.accept_order_delivery($1,$2)", [id, buyer]);
    assert.equal(
      (await db.query("select count(*)::int n from public.escrow_operations"))
        .rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("select escrow_status from public.payments")).rows[0]
        .escrow_status,
      "held",
    );
    await db.query("select public.admin_escrow_setting($1,$2,$3,$4,$5)", [
      admin,
      "recipient",
      profile,
      "RCP_test",
      "",
    ]);
    const job = (
      await db.query("select * from public.claim_escrow_operation()")
    ).rows[0];
    assert.equal(job.recipient_code, "RCP_test");
    await db.query("select public.finish_escrow_operation($1,$2,$3,null)", [
      job.id,
      "succeeded",
      "TRF_test",
    ]);
    await db.query("select public.finish_escrow_operation($1,$2,$3,null)", [
      job.id,
      "succeeded",
      "TRF_test",
    ]);
    assert.equal(
      (await db.query("select count(*)::int n from public.escrow_ledger"))
        .rows[0].n,
      2,
    );
    assert.equal(
      (await db.query("select payout_status from public.payments")).rows[0]
        .payout_status,
      "paid",
    );
    await assert.rejects(
      db.exec(`update public.order_fee_snapshots set price_kobo=1`),
      { code: "42501" },
    );
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select public.process_escrow_deadlines()"), {
      code: "42501",
    });
    await assert.rejects(db.query("select * from public.order_fee_snapshots"), {
      code: "42501",
    });
    await assert.rejects(db.query("select * from public.escrow_operations"), {
      code: "42501",
    });
    await assert.rejects(db.query("select * from public.payments"), {
      code: "42501",
    });
  } finally {
    await db.close();
  }
});
test("dispute response window, partial split and blocked payout until refund confirmation", async () => {
  const db = await fixture();
  try {
    const {
      order: { id },
    } = await create(db);
    await pay(db, id);
    const did = (await submit(db, id)).rows[0].id;
    await db.query("select public.review_order_delivery($1,$2,true,$3)", [
      did,
      admin,
      "Package matches listing",
    ]);
    await assert.rejects(
      db.query("select public.open_escrow_dispute($1,$2,$3,$4)", [
        id,
        buyer,
        "changed_mind",
        "I changed my mind",
      ]),
    );
    const dispute = (
      await db.query("select public.open_escrow_dispute($1,$2,$3,$4) id", [
        id,
        buyer,
        "broken_core_features",
        "Checkout crashes on launch",
      ])
    ).rows[0].id;
    await assert.rejects(
      db.query("select public.resolve_escrow_dispute($1,$2,2500000,$3)", [
        dispute,
        admin,
        "Partial refund decision",
      ]),
    );
    await db.query("select public.respond_escrow_dispute($1,$2,$3)", [
      dispute,
      seller,
      "Evidence: checkout works in demo",
    ]);
    const r = (
      await db.query(
        "select public.resolve_escrow_dispute($1,$2,2500000,$3) result",
        [dispute, admin, "Half the core scope is missing"],
      )
    ).rows[0].result;
    assert.equal(r.buyer_refund_kobo, 2661250);
    assert.equal(r.seller_release_kobo, 2231250);
    await db.query("select public.admin_escrow_setting($1,$2,$3,$4,$5)", [
      admin,
      "recipient",
      profile,
      "RCP_test",
      "",
    ]);
    const job = (
      await db.query("select * from public.claim_escrow_operation()")
    ).rows[0];
    assert.equal(job.kind, "refund");
    assert.equal(
      (await db.query("select * from public.claim_escrow_operation()")).rows
        .length,
      0,
    );
    await db.query("select public.finish_escrow_operation($1,$2,$3,null)", [
      job.id,
      "succeeded",
      "123",
    ]);
    assert.equal(
      (await db.query("select * from public.claim_escrow_operation()")).rows[0]
        .kind,
      "payout",
    );
  } finally {
    await db.close();
  }
});
test("deadlines refund missing submission; full refund revokes access and never relists", async () => {
  const db = await fixture();
  try {
    const {
      order: { id },
    } = await create(db);
    await pay(db, id);
    await db.exec(
      "update public.deliveries set seller_due_at=now()-interval '1 minute'",
    );
    await db.query("select public.process_escrow_deadlines()");
    await db.query("select public.process_escrow_deadlines()");
    assert.equal(
      (await db.query("select count(*)::int n from public.escrow_operations"))
        .rows[0].n,
      1,
    );
    await assert.rejects(submit(db, id));
    const job = (
      await db.query("select * from public.claim_escrow_operation()")
    ).rows[0];
    await db.query("select public.finish_escrow_operation($1,$2,$3,null)", [
      job.id,
      "succeeded",
      "456",
    ]);
    assert.equal(
      (await db.query("select status from public.orders")).rows[0].status,
      "refunded",
    );
    assert.equal(
      (await db.query("select is_sold from public.gigs")).rows[0].is_sold,
      true,
    );
    assert.ok(
      (await db.query("select access_revoked_at from public.deliveries"))
        .rows[0].access_revoked_at,
    );
  } finally {
    await db.close();
  }
});
test("auto-accept waits for buyer deadline; provider costs are immutable and service cannot truncate accounting", async () => {
  const db = await fixture();
  try {
    const {
      order: { id },
    } = await create(db);
    await pay(db, id);
    await db.query("select public.record_escrow_gateway_cost($1,96575)", [
      `mm_${id}`,
    ]);
    await db.query("select public.record_escrow_gateway_cost($1,96575)", [
      `mm_${id}`,
    ]);
    await assert.rejects(
      db.query("select public.record_escrow_gateway_cost($1,100000)", [
        `mm_${id}`,
      ]),
    );
    await assert.rejects(db.exec("truncate public.escrow_ledger"), {
      code: "42501",
    });
    await assert.rejects(db.exec("truncate public.order_fee_snapshots"), {
      code: "42501",
    });
    const did = (await submit(db, id)).rows[0].id;
    await db.query("select public.review_order_delivery($1,$2,true,$3)", [
      did,
      admin,
      "Package matches preview commit",
    ]);
    await db.query("select public.process_escrow_deadlines()");
    assert.equal(
      (await db.query("select count(*)::int n from public.escrow_operations"))
        .rows[0].n,
      0,
    );
    await db.exec(
      "update public.deliveries set dispute_window_closes_at=now()-interval '1 minute'",
    );
    const result = (
      await db.query("select public.process_escrow_deadlines() result")
    ).rows[0].result;
    assert.equal(result.accepted, 1);
    await db.query("select public.process_escrow_deadlines()");
    assert.equal(
      (await db.query("select count(*)::int n from public.escrow_operations"))
        .rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("select escrow_status from public.payments")).rows[0]
        .escrow_status,
      "held",
    );
  } finally {
    await db.close();
  }
});
test("late exclusive payment is quarantined for refund, not a second delivery", async () => {
  const db = await fixture();
  try {
    const first = await create(db);
    await db.exec(
      `update public.orders set reservation_expires_at=now()-interval '1 minute' where id='${first.order.id}'`,
    );
    const next = await create(db, other, 2);
    assert.equal(
      (await pay(db, first.order.id)).rows[0].result,
      "refund_pending",
    );
    assert.equal(
      (await db.query("select count(*)::int n from public.deliveries")).rows[0]
        .n,
      0,
    );
    assert.equal((await pay(db, next.order.id)).rows[0].result, "recorded");
    assert.equal(
      (await db.query("select count(*)::int n from public.deliveries")).rows[0]
        .n,
      1,
    );
  } finally {
    await db.close();
  }
});
