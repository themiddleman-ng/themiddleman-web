import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Order creation is not configured on the server.' }, 503);
  }

  const idempotencyKey = request.headers.get('idempotency-key')?.trim() ?? '';
  if (!UUID_PATTERN.test(idempotencyKey)) {
    return json({ error: 'A valid idempotency key is required.' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'The request body must be valid JSON.' }, 400);
  }

  const gigId = typeof body === 'object' && body !== null && 'gigId' in body
    ? String(body.gigId)
    : '';
  if (!UUID_PATTERN.test(gigId)) {
    return json({ error: 'A valid product ID is required.' }, 400);
  }

  const cookieStore = await cookies();
  const sessionClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
  const { data: { user }, error: userError } = await sessionClient.auth.getUser();
  if (userError || !user) {
    return json({ error: 'Sign in before creating an order.' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: existingError } = await admin
    .from('orders')
    .select('id, gig_id, amount, status')
    .eq('buyer_id', user.id)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (existingError) return json({ error: 'Could not check the order request.' }, 500);
  if (existing) {
    if (existing.gig_id !== gigId) {
      return json({ error: 'This idempotency key belongs to another product.' }, 409);
    }
    return json({ order: existing, reused: true });
  }

  const { data: gig, error: gigError } = await admin
    .from('gigs')
    .select('id, seller_id, price_ngn, status, seller_profiles ( user_id, verification_status )')
    .eq('id', gigId)
    .maybeSingle();
  if (gigError) return json({ error: 'Could not load this product.' }, 500);
  if (!gig || gig.status !== 'active') {
    return json({ error: 'This product is not available for purchase.' }, 409);
  }

  const sellerProfile = Array.isArray(gig.seller_profiles)
    ? gig.seller_profiles[0]
    : gig.seller_profiles;
  if (!sellerProfile?.user_id) {
    return json({ error: 'This product does not have a valid seller account.' }, 409);
  }
  if (sellerProfile.user_id === user.id) {
    return json({ error: 'You cannot buy your own product.' }, 409);
  }

  const amount = Number(gig.price_ngn);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return json({ error: 'This product has an invalid price.' }, 409);
  }

  const { data: order, error: insertError } = await admin
    .from('orders')
    .insert({
      buyer_id: user.id,
      seller_id: gig.seller_id,
      gig_id: gig.id,
      amount,
      status: 'pending_payment',
      idempotency_key: idempotencyKey,
    })
    .select('id, gig_id, amount, status')
    .single();

  if (insertError?.code === '23505') {
    const { data: racedOrder } = await admin
      .from('orders')
      .select('id, gig_id, amount, status')
      .eq('buyer_id', user.id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (racedOrder?.gig_id === gigId) {
      return json({ order: racedOrder, reused: true });
    }
    return json({ error: 'This order request conflicts with an earlier request.' }, 409);
  }
  if (insertError || !order) {
    return json({ error: 'Could not create the order.' }, 500);
  }

  return json({ order, reused: false }, 201);
}
