import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const COPY = 'Payment held in escrow until you confirm delivery';

test('escrow trust line uses the legal-aligned short copy', async () => {
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

test('short copy stays consistent with the legal escrow claim', async () => {
  const legal = await readFile(new URL('../app/legal/[document]/page.tsx', import.meta.url), 'utf8');
  assert.match(legal, /All payments on The Middleman are held in escrow/);
  assert.match(legal, /never released to the seller until you approve the delivery/);
});
