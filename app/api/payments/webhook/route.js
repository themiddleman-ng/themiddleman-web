import { createClient } from '@supabase/supabase-js';
import { createWebhookHandler } from '../../../../lib/paystack-webhook.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  return createWebhookHandler({
    secret: process.env.PAYSTACK_SECRET_KEY,
    settle: async (payment) => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error('Missing database configuration');
      const admin = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await admin.rpc('record_paystack_payment', {
        p_reference: payment.reference,
        p_amount_kobo: payment.amount,
        p_currency: payment.currency,
      });
      if (error) throw new Error('Payment recording failed');
    },
  })(request);
}
