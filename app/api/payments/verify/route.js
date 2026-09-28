import { authenticatedUser, serviceClient } from '@/lib/server/marketplace';
import { createVerificationHandler } from '../../../../lib/paystack-verify.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  return createVerificationHandler({
    secret: process.env.PAYSTACK_SECRET_KEY,
    authenticate: authenticatedUser,
    findOrder: async (id, buyerId) => {
      const admin = serviceClient();
      if (!admin) throw new Error('Missing database configuration');
      const { data, error } = await admin
        .from('orders')
        .select('id, buyer_id, amount, status')
        .eq('id', id)
        .eq('buyer_id', buyerId)
        .maybeSingle();
      if (error) throw new Error('Order lookup failed');
      return data;
    },
    settle: async (payment) => {
      const admin = serviceClient();
      if (!admin) throw new Error('Missing database configuration');
      const { data, error } = await admin.rpc('record_paystack_payment', {
        p_reference: payment.reference,
        p_amount_kobo: payment.amount,
        p_currency: payment.currency,
      });
      if (error) throw new Error('Payment recording failed');
      return data;
    },
  })(request);
}
