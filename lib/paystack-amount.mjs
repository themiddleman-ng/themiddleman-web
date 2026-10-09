// Paystack may increase the charged amount when transaction fees are passed to the customer.
 // In that case, requested_amount is the merchant's original amount while amount is the gross charge.
 // Both values come from Paystack's signed/server-side transaction data.
 export function canonicalPaystackAmount(payment) {
   const gross = payment?.amount;
   if (!Number.isSafeInteger(gross) || gross <= 0) return null;

   if (payment?.requested_amount == null) return gross;

   const requested = payment.requested_amount;
   if (!Number.isSafeInteger(requested) || requested <= 0 || requested > gross) return null;
   return requested;
 }
