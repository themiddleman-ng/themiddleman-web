import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This route is the only place an order is allowed to move from
// 'pending_payment' to 'in_escrow'. It never trusts the client — the
// browser only tells us a Paystack reference exists; this route calls
// Paystack directly with the secret key to confirm it actually succeeded
// and that the amount matches the order, before touching the database.
//
// Uses the Supabase service role key (server-only — never exposed to the
// browser, never prefixed NEXT_PUBLIC_) to bypass RLS for this one verified
// write. That's intentional and safe here because the write only happens
// after Paystack itself has confirmed the transaction server-to-server.

export async function POST(request) {
  const { reference, orderId } = await request.json();

  if (!reference || !orderId) {
    return NextResponse.json({ error: 'Missing reference or orderId.' }, { status: 400 });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json(
      { error: 'Payments are not configured yet (missing PAYSTACK_SECRET_KEY on the server).' },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Payments are not configured yet (missing SUPABASE_SERVICE_ROLE_KEY on the server).' },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Look up the order first so we know the exact amount to check against —
  // never trust an amount sent from the browser.
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, amount, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (order.status !== 'pending_payment') {
    return NextResponse.json({ error: `Order is already ${order.status}.` }, { status: 409 });
  }

  const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecret}` },
  });
  const verifyResult = await verifyResponse.json();

  if (!verifyResponse.ok || !verifyResult?.data) {
    return NextResponse.json({ error: 'Could not verify payment with Paystack.' }, { status: 502 });
  }

  const paystackData = verifyResult.data;
  const paidKobo = paystackData.amount; // Paystack amounts are in kobo
  const expectedKobo = order.amount * 100;

  if (paystackData.status !== 'success' || paidKobo !== expectedKobo) {
    return NextResponse.json({ error: 'Payment could not be confirmed for the correct amount.' }, { status: 402 });
  }

  const { error: paymentInsertError } = await admin.from('payments').insert({
    order_id: order.id,
    amount: order.amount,
    provider: 'paystack',
    reference,
    status: 'successful',
  });
  if (paymentInsertError) {
    // Reference is unique — a duplicate here likely means this was already processed.
    return NextResponse.json({ error: paymentInsertError.message }, { status: 409 });
  }

  const { error: orderUpdateError } = await admin
    .from('orders')
    .update({ status: 'in_escrow' })
    .eq('id', order.id);
  if (orderUpdateError) {
    return NextResponse.json({ error: orderUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
