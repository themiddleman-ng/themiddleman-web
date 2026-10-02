import { sendPaymentSettledEmails } from './payment-emails.mjs';

export async function settlePaystackPayment({ admin, payment, notify = sendPaymentSettledEmails }) {
  const { data: outcome, error } = await admin.rpc('record_paystack_payment', {
    p_reference: payment.reference,
    p_amount_kobo: payment.amount,
    p_currency: payment.currency,
  });

  if (error) throw new Error('Payment recording failed');

  if (outcome === 'recorded') {
    try {
      const notification = await notify({
        admin,
        reference: payment.reference,
      });
      if (!notification?.ok) {
        console.warn('Payment recorded but one or more notification emails were not sent.');
      }
    } catch {
      console.warn('Payment recorded but notification delivery failed.');
    }
  }

  return outcome;
}
