import { sendPaymentSettledEmails } from './payment-emails.mjs';

export async function settlePaystackPayment({ admin, payment, notify = sendPaymentSettledEmails }) {
  const { data: outcome, error } = await admin.rpc('record_paystack_payment', {
    p_reference: payment.reference,
    p_amount_kobo: payment.amount,
    p_currency: payment.currency,
  });

  if (error) throw new Error('Payment recording failed');

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
