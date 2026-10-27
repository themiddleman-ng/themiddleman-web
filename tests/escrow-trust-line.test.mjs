import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const COPY = 'Purchases are paused. No payment is taken or held.';

test('escrow trust line states that purchases are paused', async () => {
  const source = await readFile(new URL('../components/EscrowTrustLine.tsx', import.meta.url), 'utf8');
  assert.equal((source.match(/export const ESCROW_TRUST_COPY = "([^"]+)"/) || [])[1], COPY);
  assert.match(source, /<span>\{ESCROW_TRUST_COPY\}<\/span>/);
});

test('the same component sits under the product price and on how-it-works step 3', async () => {
  const product = await readFile(new URL('../app/gigs/[id]/PageClient.tsx', import.meta.url), 'utf8');
  const home = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(product, /import EscrowTrustLine from "@\/components\/EscrowTrustLine"/);
  assert.match(product, /<EscrowTrustLine className="mt-3" \/>/);
  assert.match(product, /<EscrowTrustLine compact className="mt-2" \/>/);
  assert.match(home, /import EscrowTrustLine from "@\/components\/EscrowTrustLine"/);
  assert.match(home, /index === 2 \? <EscrowTrustLine className="mt-3" \/>/);
});

test('legal escrow sentences stay unchanged', async () => {
  const legal = await readFile(new URL('../app/legal/[document]/page.tsx', import.meta.url), 'utf8');
  const trust = await readFile(new URL('../components/EscrowTrustLine.tsx', import.meta.url), 'utf8');
  assert.match(legal, /All payments on The Middleman are held in escrow/);
  assert.match(legal, /never released to the seller until you approve the delivery/);
  assert.doesNotMatch(trust, /Payment held in escrow until you confirm delivery/);
});
