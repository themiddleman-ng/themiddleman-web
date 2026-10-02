import { serviceClient } from '@/lib/server/marketplace';
import { settlePaystackPayment } from '@/lib/server/paystack-settlement.mjs';
import { createWebhookHandler } from '../../../../lib/paystack-webhook.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  return createWebhookHandler({
    secret: process.env.PAYSTACK_SECRET_KEY,
    settle: async (payment) => {
      const admin = serviceClient();
      if (!admin) throw new Error('Missing database configuration');
      return settlePaystackPayment({ admin, payment });
    },
  })(request);
}
