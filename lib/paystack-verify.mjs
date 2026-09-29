import { sameOriginMutation } from './server/same-origin.mjs';

const REFERENCE = /^mm_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});

export function createVerificationHandler({ secret, authenticate, findOrder, settle, verifyFetch = fetch }) {
  return async function POST(request) {
    if (!sameOriginMutation(request)) return json({ error: 'Invalid request origin.' }, 403);
    if (!secret || !/^sk_(test|live)_/.test(secret)) return json({ error: 'Payments unavailable.' }, 503);
    try {
      const user = await authenticate();
      if (!user) return json({ error: 'Sign in to verify payment.' }, 401);

      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON.' }, 400); }

      const { reference, orderId } = body ?? {};
      if (typeof reference !== 'string' || !REFERENCE.test(reference) || reference !== `mm_${orderId}`) {
        return json({ error: 'Invalid order or reference.' }, 400);
      }

      const order = await findOrder(orderId, user.id);
      if (!order || order.buyer_id !== user.id) return json({ error: 'Order not found.' }, 404);

      const amount = Number(order.amount);
      const expectedKobo = amount * 100;
      if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(expectedKobo)) {
        return json({ error: 'Invalid order amount.' }, 409);
      }

      let result;
      try {
        const response = await verifyFetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            headers: { Authorization: `Bearer ${secret}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
          },
        );
        if (!response.ok) return json({ error: 'Could not verify payment with Paystack.' }, 502);
        result = await response.json();
      } catch {
        return json({ error: 'Could not verify payment with Paystack.' }, 502);
      }

      const payment = result?.data;
      if (result?.status !== true || !payment) return json({ error: 'Could not verify payment with Paystack.' }, 502);

      const expectedDomain = secret.startsWith('sk_test_') ? 'test' : 'live';
      const checks = {
        statusMatch: payment.status === 'success',
        amountMatch: payment.amount === expectedKobo,
        currencyMatch: payment.currency === 'NGN',
        referenceMatch: payment.reference === reference,
        domainMatch: payment.domain === expectedDomain,
      };

      if (Object.values(checks).some((matches) => !matches)) {
        // Diagnostic only: booleans and non-sensitive transaction metadata.
        // Never log secret keys, authorization headers, card details, or customer data.
        console.warn('Paystack verification mismatch', {
          ...checks,
          paymentStatus: payment.status,
          paymentAmount: payment.amount,
          expectedAmount: expectedKobo,
          paymentCurrency: payment.currency,
          paymentDomain: payment.domain,
          expectedDomain,
        });
        return json({ error: 'Payment does not match this order.' }, 402);
      }

      const outcome = await settle(payment);
      return json({ ok: true, duplicate: outcome === 'duplicate' });
    } catch {
      return json({ error: 'Payment could not be recorded. Please retry verification.' }, 500);
    }
  };
}
