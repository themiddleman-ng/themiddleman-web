import { createResendMailer } from './email.mjs';

const REFERENCE = /^mm_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatNaira(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
      }).format(amount)
    : 'your payment';
}

function emailShell(title, body, footer) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#111827">
    <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;padding:32px">
      <div style="font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0b3d91">The Middleman</div>
      <h1 style="font-size:24px;line-height:1.3;margin:18px 0 12px">${escapeHtml(title)}</h1>
      <div style="font-size:16px;line-height:1.65">${body}</div>
      <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:24px 0 0">${escapeHtml(footer)}</p>
    </div>
  </body>
</html>`;
}

export function paymentSettledTemplates({ title, amount }) {
  const product = String(title || 'your order');
  const safeProduct = escapeHtml(product);
  const money = formatNaira(amount);

  return {
    buyer: {
      subject: `Payment confirmed — ${product}`,
      text: `Payment confirmed for ${product}. ${money} is now held in escrow by The Middleman. The seller can now begin work. You do not need to pay again.`,
      html: emailShell(
        'Payment confirmed',
        `<p style="margin:0 0 16px">Your payment for <strong>${safeProduct}</strong> has been confirmed.</p><p style="margin:0"><strong>${escapeHtml(money)}</strong> is now held in escrow. The seller can begin work, and the funds remain protected while the order is in progress.</p>`,
        'You do not need to pay again. Track the order from My Orders.',
      ),
    },
    seller: {
      subject: `New paid order — ${product}`,
      text: `You have a new paid order for ${product}. The buyer's payment has been confirmed and the funds are held in escrow. You can now begin work and submit the finished delivery from My Orders.`,
      html: emailShell(
        'You have a new paid order',
        `<p style="margin:0 0 16px">A buyer has paid for <strong>${safeProduct}</strong>.</p><p style="margin:0">The payment is confirmed and <strong>${escapeHtml(money)}</strong> is held in escrow. You can now begin work and submit the finished delivery from My Orders.</p>`,
        'Buyer identity remains private. Use the order workspace for order activity.',
      ),
    },
  };
}

async function getOrderNotificationContext(admin, reference) {
  const match = typeof reference === 'string' ? reference.match(REFERENCE) : null;
  if (!match) return { ok: false, reason: 'invalid_reference' };

  const { data: order, error } = await admin
    .from('orders')
    .select('id, amount, buyer_id, gigs(title), seller_profiles!orders_seller_id_fkey(user_id)')
    .eq('id', match[1])
    .maybeSingle();

  if (error || !order) return { ok: false, reason: 'order_lookup_failed' };

  const sellerProfile = first(order.seller_profiles);
  const sellerUserId = sellerProfile?.user_id;
  if (!order.buyer_id || !sellerUserId) {
    return { ok: false, reason: 'recipient_lookup_failed' };
  }

  const [buyerLookup, sellerLookup] = await Promise.all([
    admin.auth.admin.getUserById(order.buyer_id),
    admin.auth.admin.getUserById(sellerUserId),
  ]);

  const buyerEmail = buyerLookup?.data?.user?.email;
  const sellerEmail = sellerLookup?.data?.user?.email;
  if (!buyerEmail || !sellerEmail) {
    return { ok: false, reason: 'recipient_email_unavailable' };
  }

  return {
    ok: true,
    order,
    buyerEmail,
    sellerEmail,
    title: first(order.gigs)?.title || 'your order',
  };
}

export async function sendPaymentSettledEmails({
  admin,
  reference,
  mailer = createResendMailer(),
}) {
  const context = await getOrderNotificationContext(admin, reference);
  if (!context.ok) return context;

  const { order, buyerEmail, sellerEmail, title } = context;
  const templates = paymentSettledTemplates({ title, amount: order.amount });

  const { error: queueError } = await admin
    .from('email_notifications')
    .upsert([
      {
        order_id: order.id,
        event: 'payment_settled',
        recipient_role: 'buyer',
        recipient_email: buyerEmail,
        status: 'pending',
      },
      {
        order_id: order.id,
        event: 'payment_settled',
        recipient_role: 'seller',
        recipient_email: sellerEmail,
        status: 'pending',
      },
    ], {
      onConflict: 'order_id,event,recipient_role',
      ignoreDuplicates: true,
    });

  if (queueError) return { ok: false, reason: 'notification_queue_failed' };

  const { data: queued, error: queuedError } = await admin
    .from('email_notifications')
    .select('id, recipient_role, recipient_email, status, attempts')
    .eq('order_id', order.id)
    .eq('event', 'payment_settled')
    .in('status', ['pending', 'failed']);

  if (queuedError) return { ok: false, reason: 'notification_queue_read_failed' };

  const results = [];
  for (const item of queued ?? []) {
    const template = templates[item.recipient_role];
    if (!template) continue;

    const { error: lockError } = await admin
      .from('email_notifications')
      .update({
        status: 'sending',
        attempts: Number(item.attempts || 0) + 1,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .in('status', ['pending', 'failed']);

    if (lockError) {
      results.push({ role: item.recipient_role, ok: false, reason: 'notification_claim_failed' });
      continue;
    }

    const sent = await mailer.send({
      to: item.recipient_email,
      ...template,
    });

    if (sent.ok) {
      await admin
        .from('email_notifications')
        .update({
          status: 'sent',
          provider_message_id: sent.id,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    } else {
      await admin
        .from('email_notifications')
        .update({
          status: 'failed',
          last_error: sent.error || 'Email delivery failed.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }

    results.push({ role: item.recipient_role, ok: Boolean(sent.ok) });
  }

  const { data: finalRows } = await admin
    .from('email_notifications')
    .select('recipient_role, status')
    .eq('order_id', order.id)
    .eq('event', 'payment_settled');

  const buyerSent = finalRows?.some((row) => row.recipient_role === 'buyer' && row.status === 'sent');
  const sellerSent = finalRows?.some((row) => row.recipient_role === 'seller' && row.status === 'sent');

  return {
    ok: Boolean(buyerSent && sellerSent),
    buyerSent: Boolean(buyerSent),
    sellerSent: Boolean(sellerSent),
    attempted: results,
  };
}
