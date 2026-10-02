import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectPackage,
  validateArchivePath,
} from "../lib/server/package-validation.mjs";
import { runGatewayOperation } from "../lib/server/escrow-gateway.mjs";
import {
  escrowV2Enabled,
  gatewayTestEnabled,
} from "../lib/server/escrow-config.mjs";
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(name, localName = name) {
  const data = Buffer.from("hello"),
    n = Buffer.from(name),
    local = Buffer.from(localName);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50);
  header.writeUInt16LE(20, 4);
  header.writeUInt32LE(crc32(data), 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(local.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(crc32(data), 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(n.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + n.length, 12);
  end.writeUInt32LE(header.length + local.length + data.length, 16);
  return Buffer.concat([header, local, data, central, n, end]);
}
test("ZIP validates full content and rejects Git history, path traversal, secrets, symlinks and divergent headers", async () => {
  const ok = await inspectPackage(zip("src/app.js"), "application/zip");
  assert.match(ok.sha256, /^[a-f0-9]{64}$/);
  for (const name of [
    ".git/config",
    "folder/.GIT/HEAD",
    "folder/.git./config",
    "../secret",
    "C:/secret",
    ".env",
    "folder/id_rsa",
  ])
    await assert.rejects(inspectPackage(zip(name), "application/zip"));
  assert.throws(() => validateArchivePath("link", 0xa0000000));
  await assert.rejects(
    inspectPackage(zip("src/app.js", ".git/config"), "application/zip"),
  );
  const corrupt = zip("src/app.js");
  corrupt[30 + "src/app.js".length] ^= 1;
  await assert.rejects(inspectPackage(corrupt, "application/zip"), /integrity/);
  await assert.rejects(
    inspectPackage(Buffer.from("not a zip"), "application/zip"),
  );
  await assert.rejects(
    inspectPackage(Buffer.alloc(10 * 1024 * 1024 + 1), "text/plain"),
  );
  await assert.rejects(
    inspectPackage(Buffer.from("fake PDF"), "application/pdf"),
  );
});
test("feature flags cannot authorize the production database or live gateway", () => {
  const env = {
    MARKETPLACE_ESCROW_V2_ENABLED: "true",
    MARKETPLACE_ISOLATED_PREVIEW: "true",
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SUPABASE_URL: "https://isolated.supabase.co",
    PAYSTACK_SECRET_KEY: "sk_test_example",
    ESCROW_GATEWAY_TEST_ENABLED: "true",
  };
  assert.equal(escrowV2Enabled(env), true);
  assert.equal(gatewayTestEnabled(env), true);
  for (const extra of [
    { VERCEL_ENV: "production" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://uwigyojtiudefnwjezhm.supabase.co" },
    { NEXT_PUBLIC_SUPABASE_URL: "broken" },
    { MARKETPLACE_ISOLATED_PREVIEW: "false" },
  ])
    assert.equal(escrowV2Enabled({ ...env, ...extra }), false);
  assert.equal(
    gatewayTestEnabled({ ...env, PAYSTACK_SECRET_KEY: "sk_live_example" }),
    false,
  );
});
const refundJob = {
  id: "job",
  kind: "refund",
  amount_kobo: 10000,
  reference: "mm_refund_order",
  status: "processing",
  attempts: 1,
};
const payment = "mm_10000000-0000-4000-8000-000000000001";
test("refund is submitted once; pending response never releases money and unknown outcome never retries", async () => {
  let requests = 0;
  const fetcher = async () => {
    requests++;
    return Response.json({
      status: true,
      data: {
        id: 42,
        amount: 10000,
        currency: "NGN",
        domain: "test",
        status: "pending",
        transaction: { reference: payment },
      },
    });
  };
  const pending = await runGatewayOperation({
    job: refundJob,
    secret: "sk_test_example",
    paymentReference: payment,
    fetcher,
  });
  assert.equal(requests, 1);
  assert.equal(pending.status, "submitted");
  assert.equal(pending.providerId, "42");
  const unknown = await runGatewayOperation({
    job: { ...refundJob, status: "uncertain", attempts: 2 },
    secret: "sk_test_example",
    paymentReference: payment,
    fetcher,
  });
  assert.equal(unknown.status, "uncertain");
  assert.equal(requests, 1);
  const interrupted = await runGatewayOperation({
    job: refundJob,
    secret: "sk_test_example",
    paymentReference: payment,
    fetcher: async () => {
      throw new Error("timeout");
    },
  });
  assert.equal(interrupted.status, "uncertain");
});
test("payout confirms reference, recipient, amount, currency and test domain before succeeding", async () => {
  const job = {
    kind: "payout",
    amount_kobo: 10000,
    reference: "mm_payout_order",
    recipient_code: "RCP_test",
    status: "submitted",
    provider_id: "TRF_test",
  };
  const data = {
    amount: 10000,
    reference: job.reference,
    currency: "NGN",
    domain: "test",
    status: "success",
    recipient: { recipient_code: "RCP_test" },
    transfer_code: "TRF_test",
  };
  const result = await runGatewayOperation({
    job,
    secret: "sk_test_example",
    fetcher: async () => Response.json({ status: true, data }),
  });
  assert.equal(result.status, "succeeded");
  for (const changed of [
    { amount: 20000 },
    { currency: "USD" },
    { domain: "live" },
    { reference: "other" },
    { recipient: { recipient_code: "RCP_other" } },
  ]) {
    const r = await runGatewayOperation({
      job,
      secret: "sk_test_example",
      fetcher: async () =>
        Response.json({ status: true, data: { ...data, ...changed } }),
    });
    assert.equal(r.status, "uncertain");
  }
  await assert.rejects(runGatewayOperation({ job, secret: "sk_live_example" }));
});
