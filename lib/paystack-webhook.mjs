import { createHmac, timingSafeEqual } from 'node:crypto';

const REFERENCE = /^mm_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const LIMIT = 256 * 1024;

// Test the exact HTTP handler without real secrets or a live database.
export function createWebhookHandler({ secret, settle }) {
  return async function POST(request) {
    if (!secret || !/^sk_(test|live)_/.test(secret)) {
      return Response.json({ error: 'Payments unavailable.' }, { status: 503 });
    }
    const signature = request.headers.get('x-paystack-signature') || '';
    if (!/^[a-f0-9]{128}$/i.test(signature)) {
      return Response.json({ error: 'Invalid signature.' }, { status: 401 });
    }
    const chunks = [];
    let size = 0;
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: 'Missing body.' }, { status: 400 });
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > LIMIT) {
          await reader.cancel();
          return Response.json({ error: 'Payload too large.' }, { status: 413 });
        }
        chunks.push(Buffer.from(value));
      }
    } catch {
      return Response.json({ error: 'Invalid body.' }, { status: 400 });
    }
    const raw = Buffer.concat(chunks);
    const expected = createHmac('sha512', secret).update(raw).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
      return Response.json({ error: 'Invalid signature.' }, { status: 401 });
    }
    let event;
    try { event = JSON.parse(raw.toString('utf8')); }
    catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
    if (!event || typeof event.event !== 'string') {
      return Response.json({ error: 'Invalid event.' }, { status: 400 });
    }
    if (event.event !== 'charge.success') return Response.json({ ignored: true });
    const data = event.data;
    const domain = secret.startsWith('sk_test_') ? 'test' : 'live';
    if (!data || data.status !== 'success' || data.domain !== domain ||
        typeof data.reference !== 'string' || !REFERENCE.test(data.reference) ||
        !Number.isSafeInteger(data.amount) || data.amount <= 0 || data.currency !== 'NGN') {
      return Response.json({ error: 'Invalid payment event.' }, { status: 400 });
    }
    try {
      await settle(data);
      return Response.json({ received: true });
    } catch {
      return Response.json({ error: 'Payment could not be recorded.' }, { status: 500 });
    }
  };
}
