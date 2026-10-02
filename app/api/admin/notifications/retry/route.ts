import { adminUser, privateJson, uuidPattern } from '@/lib/server/marketplace';
import { sameOriginMutation } from '@/lib/server/same-origin.mjs';
import { sendPaymentSettledEmails } from '@/lib/server/payment-emails.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) {
    return privateJson({ error: 'Invalid request origin.' }, 403);
  }

  const administrator = await adminUser();
  if (!administrator) {
    return privateJson({ error: 'Admin access required.' }, 403);
  }

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: 'Invalid request.' }, 400);
  }

  const orderId = body.orderId ?? '';
  if (!uuidPattern.test(orderId)) {
    return privateJson({ error: 'Invalid order ID.' }, 400);
  }

  const result = await sendPaymentSettledEmails({
    admin: administrator.db,
    reference: `mm_${orderId}`,
  });

  await administrator.db.from('admin_audit_log').insert({
    actor_id: administrator.user.id,
    action: 'retry_payment_notifications',
    target_type: 'order',
    target_id: orderId,
    details: { result },
  });

  return result.ok
    ? privateJson({ ok: true, statuses: result.statuses })
    : privateJson({
        ok: false,
        statuses: result.statuses,
        reason: result.reason ?? 'notification_retry_incomplete',
      }, 409);
}
