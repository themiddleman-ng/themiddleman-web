import { createResendMailer } from './email.mjs';
import { escrowV2Enabled } from './escrow-config.mjs';

const REFERENCE = /^mm_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const SUPPORT_EMAIL = 'support@themiddleman.com.ng';
const GENERAL_EMAIL = 'hello@themiddleman.com.ng';
const BRAND_LOGO_PATH = '/brand/app-icon.png';

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

function appUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_APP_URL || 'https://www.themiddleman.com.ng';
}

function brandedEmail({ eyebrow, title, intro, rows, body, ctaLabel, ctaPath, footer }) {
  const summaryRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;color:#667085;font-size:13px;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#101828;font-size:14px;font-weight:700;text-align:right;vertical-align:top">${escapeHtml(value)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3f5f8;font-family:Inter,Arial,sans-serif;color:#101828">
    <div style="padding:36px 14px">
      <div style="max-width:620px;margin:0 auto">
        <div style="padding:0 4px 18px;display:flex;align-items:center">
          <img src="cid:middleman-logo" width="46" height="46" alt="The Middleman" style="display:block;border-radius:10px">
          <div style="margin-left:12px">
            <div style="font-size:17px;line-height:1.1;font-weight:800;color:#0b3d91">THE MIDDLEMAN</div>
            <div style="font-size:12px;line-height:1.4;color:#667085;margin-top:3px">Buy and sell digital work safely</div>
          </div>
        </div>

        <div style="background:#ffffff;border:1px solid #e4e7ec;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(16,24,40,.06)">
          <div style="height:5px;background:#ff8a00"></div>
          <div style="padding:34px 34px 30px">
            <div style="font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff7a00">${escapeHtml(eyebrow)}</div>
            <h1 style="font-size:30px;line-height:1.18;margin:12px 0 12px;color:#101828">${escapeHtml(title)}</h1>
            <p style="font-size:16px;line-height:1.7;color:#475467;margin:0">${escapeHtml(intro)}</p>

            <div style="margin:26px 0;background:#f8fafc;border:1px solid #eaecf0;border-radius:14px;padding:12px 18px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                ${summaryRows}
              </table>
            </div>

            <div style="font-size:15px;line-height:1.75;color:#344054">${body}</div>

            <div style="margin-top:28px">
              <a href="${appUrl()}${ctaPath}" style="display:inline-block;background:#0b3d91;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 20px;font-size:14px;font-weight:800">${escapeHtml(ctaLabel)}</a>
            </div>
          </div>

          <div style="background:#0b3d91;padding:22px 34px;color:#dbe7ff">
            <p style="margin:0;font-size:13px;line-height:1.65">${escapeHtml(footer)}</p>
            <p style="margin:12px 0 0;font-size:12px;line-height:1.65;color:#b9cae8">
              Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#ffffff">${SUPPORT_EMAIL}</a>
              &nbsp;•&nbsp; General: <a href="mailto:${GENERAL_EMAIL}" style="color:#ffffff">${GENERAL_EMAIL}</a>
            </p>
          </div>
        </div>

        <p style="text-align:center;margin:18px 0 0;color:#98a2b3;font-size:11px;line-height:1.6">
          Transactional notice from The Middleman. Please keep this email for your records.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function logoAttachment() {
  return [{
    path: `${appUrl()}${BRAND_LOGO_PATH}`,
    filename: 'the-middleman-logo.png',
    content_id: 'middleman-logo',
  }];
}

export function paymentSettledTemplates({ title, amount, sellerAmount = amount, orderId, buyerEmail, sellerEmail, sellerName }) {
  const product = String(title || 'your order');
  const money = formatNaira(amount);
  const sellerMoney = formatNaira(sellerAmount);
  const shortOrder = String(orderId || '').slice(0, 8).toUpperCase();
  const attachments = logoAttachment();

  return {
    buyer: {
      subject: `Payment secured — ${product}`,
      text: `Your payment for ${product} has been confirmed. ${money} is held in escrow. Order ${shortOrder}. The seller can now begin work. Support: ${SUPPORT_EMAIL}`,
      html: brandedEmail({
        eyebrow: 'Payment secured',
        title: 'Your order is protected',
        intro: `Your payment for ${product} has been confirmed and the order is now active.`,
        rows: [['Product', product], ['Amount protected', money], ['Order', shortOrder], ['Status', 'In escrow']],
        body: '<p style="margin:0">The seller can now begin work. Your funds remain held in escrow while the order is in progress. You do not need to pay again.</p>',
        ctaLabel: 'View my order',
        ctaPath: '/orders',
        footer: 'We will notify you again when there is a delivery or another important order update.',
      }),
      attachments,
    },
    seller: {
      subject: `New paid order — ${product}`,
      text: `A private buyer placed a new paid order for ${product}. Your expected payout is ${sellerMoney}, held in escrow. Order ${shortOrder}. Start work and submit the delivery from My Orders.`,
      html: brandedEmail({
        eyebrow: 'New paid order',
        title: 'You can start work',
        intro: `A buyer has paid for ${product}. The order is confirmed and ready for fulfilment.`,
        rows: [['Product', product], ['Expected payout', sellerMoney], ['Order', shortOrder], ['Payment', 'Secured in escrow']],
        body: '<p style="margin:0">Begin work when ready and submit the completed digital product through My Orders. Buyer identity remains private; keep order activity inside The Middleman.</p>',
        ctaLabel: 'Open seller orders',
        ctaPath: '/orders',
        footer: 'Deliver only through the platform so the order remains protected and auditable.',
      }),
      attachments,
    },
    admin: {
      subject: `Escrow order secured — ${product} [${shortOrder}]`,
      text: `A new paid order entered escrow. Product: ${product}. Amount: ${money}. Buyer: ${buyerEmail}. Seller: ${sellerName || sellerEmail}. Order: ${shortOrder}.`,
      html: brandedEmail({
        eyebrow: 'Operations alert',
        title: 'A new order entered escrow',
        intro: 'Payment verification completed and the order has moved into the active fulfilment pipeline.',
        rows: [
          ['Product', product],
          ['Amount', money],
          ['Order', shortOrder],
          ['Buyer', buyerEmail],
          ['Seller', sellerName || sellerEmail],
          ['State', 'In escrow'],
        ],
        body: '<p style="margin:0">No manual payment action is required. Monitor fulfilment, delivery review, disputes, notification delivery and payout readiness from the admin workspace.</p>',
        ctaLabel: 'Open admin operations',
        ctaPath: '/admin',
        footer: 'This admin notice contains operational information. Do not forward it outside authorised support or operations work.',
      }),
      attachments,
    },
  };
}

async function getOrderNotificationContext(admin, reference) {
  const match = typeof reference === 'string' ? reference.match(REFERENCE) : null;
  if (!match) return { ok: false, reason: 'invalid_reference', statuses: undefined };

  const { data: order, error } = await admin
    .from('orders')
    .select('id, amount, buyer_id, status, gigs(title), seller_profiles!orders_seller_id_fkey(user_id,display_name)')
    .eq('id', match[1])
    .maybeSingle();

  if (error || !order) return { ok: false, reason: 'order_lookup_failed', statuses: undefined };

  const { data: settledPayment, error: paymentError } = await admin
    .from('payments')
    .select('id')
    .eq('order_id', order.id)
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (paymentError || !settledPayment || order.status === 'pending_payment') {
    return { ok: false, reason: 'payment_not_settled', statuses: undefined };
  }

  const sellerProfile = first(order.seller_profiles);
  const sellerUserId = sellerProfile?.user_id;
  if (!order.buyer_id || !sellerUserId) {
    return { ok: false, reason: 'recipient_lookup_failed', statuses: undefined };
  }

  const [buyerLookup, sellerLookup, adminSetting] = await Promise.all([
    admin.auth.admin.getUserById(order.buyer_id),
    admin.auth.admin.getUserById(sellerUserId),
    admin.from('platform_settings').select('value').eq('key', 'admin_notification_email').maybeSingle(),
  ]);

  const buyerEmail = buyerLookup?.data?.user?.email;
  const sellerEmail = sellerLookup?.data?.user?.email;
  const adminEmail = adminSetting?.data?.value;
  if (!buyerEmail || !sellerEmail || !adminEmail) {
    return { ok: false, reason: 'recipient_email_unavailable', statuses: undefined };
  }

  return {
    ok: true,
    order,
    buyerEmail,
    sellerEmail,
    adminEmail,
    sellerName: sellerProfile?.display_name || 'Seller',
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

  const { order, buyerEmail, sellerEmail, adminEmail, sellerName, title } = context;
  let buyerAmount = order.amount, sellerAmount = order.amount;
  if (escrowV2Enabled()) {
    const snapshot = await admin.from('order_fee_snapshots').select('buyer_total_kobo,seller_payout_kobo').eq('order_id', order.id).maybeSingle();
    if (snapshot.error) return { ok: false, reason: 'fee_snapshot_unavailable' };
    if (snapshot.data) {
      buyerAmount = snapshot.data.buyer_total_kobo / 100;
      sellerAmount = snapshot.data.seller_payout_kobo / 100;
    }
  }
  const templates = paymentSettledTemplates({
    title,
    amount: buyerAmount,
    sellerAmount,
    orderId: order.id,
    buyerEmail,
    sellerEmail,
    sellerName,
  });

  const recipients = [
    { role: 'buyer', email: buyerEmail },
    { role: 'seller', email: sellerEmail },
    { role: 'admin', email: adminEmail },
  ];

  const { error: queueError } = await admin
    .from('email_notifications')
    .upsert(recipients.map(item => ({
      order_id: order.id,
      event: 'payment_settled',
      recipient_role: item.role,
      recipient_email: item.email,
      status: 'pending',
    })), {
      onConflict: 'order_id,event,recipient_role',
      ignoreDuplicates: true,
    });

  if (queueError) return { ok: false, reason: 'notification_queue_failed', statuses: undefined };

  const { data: queued, error: queuedError } = await admin
    .from('email_notifications')
    .select('id, recipient_role, recipient_email, status, attempts')
    .eq('order_id', order.id)
    .eq('event', 'payment_settled')
    .in('status', ['pending', 'failed']);

  if (queuedError) return { ok: false, reason: 'notification_queue_read_failed', statuses: undefined };

  const attempted = [];
  for (const item of queued ?? []) {
    const template = templates[item.recipient_role];
    if (!template) continue;

    const { data: claimed, error: claimError } = await admin
      .from('email_notifications')
      .update({
        status: 'sending',
        attempts: Number(item.attempts || 0) + 1,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .in('status', ['pending', 'failed'])
      .select('id')
      .maybeSingle();

    if (claimError || !claimed) {
      attempted.push({ role: item.recipient_role, ok: false, reason: 'already_claimed' });
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

    attempted.push({ role: item.recipient_role, ok: Boolean(sent.ok) });
  }

  const { data: finalRows } = await admin
    .from('email_notifications')
    .select('recipient_role, status')
    .eq('order_id', order.id)
    .eq('event', 'payment_settled');

  const statusFor = role => finalRows?.find(row => row.recipient_role === role)?.status;
  return {
    ok: ['buyer', 'seller', 'admin'].every(role => statusFor(role) === 'sent'),
    statuses: {
      buyer: statusFor('buyer') || 'missing',
      seller: statusFor('seller') || 'missing',
      admin: statusFor('admin') || 'missing',
    },
    attempted,
    reason: undefined,
  };
}
