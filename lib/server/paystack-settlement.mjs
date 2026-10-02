import { escrowV2Enabled } from './escrow-config.mjs';
import { sendPaymentSettledEmails } from './payment-emails.mjs';

export async function settlePaystackPayment({ admin, payment, notify = sendPaymentSettledEmails }) {
  if (escrowV2Enabled()) {
    const id = payment.reference?.slice(3);
    const snapshot = await admin.from('order_fee_snapshots').select('buyer_total_kobo').eq('order_id', id).maybeSingle();
    if (snapshot.error) throw new Error('Fee snapshot unavailable');
    if (snapshot.data && (payment.gross_amount ?? payment.amount) !== snapshot.data.buyer_total_kobo) throw new Error('Gross payment differs from buyer total');
  }
  const { data: outcome, error } = await admin.rpc('record_paystack_payment', {
    p_reference: payment.reference,
    p_amount_kobo: payment.amount,
    p_currency: payment.currency,
  });

  if (error) throw new Error('Payment recording failed');

  // Use verified provider evidence, never a guessed fee or tax schedule.
  if (escrowV2Enabled() && ['recorded','duplicate','refund_pending'].includes(outcome) &&
      Number.isSafeInteger(payment.fees) && payment.fees >= 0) {
    const cost = await admin.rpc('record_escrow_gateway_cost', {
      p_reference: payment.reference, p_cost_kobo: payment.fees,
    });
    if (cost.error) throw new Error('Gateway cost evidence could not be recorded');
  }

  // Notifications are durable and idempotent. We try after both a fresh
  // settlement and a duplicate verification so a previously failed email can recover.
  if (outcome === 'recorded' || outcome === 'duplicate') {
    try {
      const notification = await notify({
        admin,
        reference: payment.reference,
      });
      if (!notification?.ok) {
        console.warn('Payment is settled but one or more notification emails are still pending.');
      }
    } catch {
      console.warn('Payment is settled but notification delivery failed.');
    }
  }

  return outcome;
}
