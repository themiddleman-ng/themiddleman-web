import { authenticatedUser, privateJson, serviceClient, uuidPattern } from '@/lib/server/marketplace';
import { ENQUIRY_DAILY_THREAD_LIMIT } from '@/lib/server/enquiry-limits.mjs';
import { prePurchaseEnquiryEnabled } from '@/lib/server/messaging-config.mjs';
import { sameOriginMutation } from '@/lib/server/same-origin.mjs';

export const runtime = 'nodejs';

const paidOrderStatuses = ['in_escrow', 'delivered', 'approved', 'disputed'];

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: 'Sign in first.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Messages are not configured.' }, 503);

  const { data: sellerProfile, error: profileError } = await db.from('seller_profiles')
    .select('id').eq('user_id', user.id).maybeSingle();
  if (profileError) return privateJson({ error: 'Could not load conversations.' }, 500);

  // conversations.seller_id is the seller auth user id. Older rows may store
  // seller_profiles.id. Orders always store seller_profiles.id, so the filters differ.
  const conversationFilter = [`buyer_id.eq.${user.id}`, `seller_id.eq.${user.id}`];
  if (sellerProfile?.id) conversationFilter.push(`seller_id.eq.${sellerProfile.id}`);
  const orderFilter = sellerProfile?.id
    ? `buyer_id.eq.${user.id},seller_id.eq.${sellerProfile.id}`
    : `buyer_id.eq.${user.id}`;
  const [conversationsResult, ordersResult] = await Promise.all([
    db.from('conversations')
      .select('id,buyer_id,seller_id,gig_id,buyer_last_read_at,seller_last_read_at,gigs(title),messages(sender_id,created_at)')
      .or(conversationFilter.join(',')),
    db.from('orders')
      .select('buyer_id,seller_id,gig_id,seller_profiles!orders_seller_id_fkey(user_id)')
      .or(orderFilter)
      .in('status', paidOrderStatuses),
  ]);
  if (conversationsResult.error || ordersResult.error) return privateJson({ error: 'Could not load conversations.' }, 500);

  const paidOrderKeys = new Set<string>();
  for (const order of ordersResult.data ?? []) {
    const profile = Array.isArray(order.seller_profiles) ? order.seller_profiles[0] : order.seller_profiles;
    const sellerUserId = profile && typeof profile === 'object' && 'user_id' in profile ? String(profile.user_id) : '';
    paidOrderKeys.add(`${order.buyer_id}:${order.seller_id}:${order.gig_id}`);
    if (sellerUserId) paidOrderKeys.add(`${order.buyer_id}:${sellerUserId}:${order.gig_id}`);
  }
  const enquiryEnabled = prePurchaseEnquiryEnabled();
  const visibleConversations = (conversationsResult.data ?? []).filter(row =>
    enquiryEnabled || paidOrderKeys.has(`${row.buyer_id}:${row.seller_id}:${row.gig_id}`)
  );

  const sellerKeys = [...new Set(visibleConversations.map(row => row.seller_id).filter(Boolean))];
  const sellerNames = new Map<string, string>();
  if (sellerKeys.length) {
    const { data: publicSellers, error: sellerNameError } = await db
      .from('public_seller_profiles')
      .select('id, user_id, display_name')
      .or(`id.in.(${sellerKeys.join(',')}),user_id.in.(${sellerKeys.join(',')})`);
    if (sellerNameError) return privateJson({ error: 'Could not load conversations.' }, 500);
    for (const seller of publicSellers ?? []) {
      if (seller.display_name) {
        sellerNames.set(seller.id, seller.display_name);
        sellerNames.set(seller.user_id, seller.display_name);
      }
    }
  }

  let unreadCount = 0;
  const conversations = visibleConversations.map(row => {
    const lastReadAt = row.buyer_id === user.id ? row.buyer_last_read_at : row.seller_last_read_at;
    if ((row.messages ?? []).some(message => message.sender_id !== user.id &&
      (!lastReadAt || Date.parse(message.created_at) > Date.parse(lastReadAt)))) unreadCount++;
    const gig = Array.isArray(row.gigs) ? row.gigs[0] : row.gigs;
    return {
      id: row.id, gig_id: row.gig_id, role: row.buyer_id === user.id ? 'buyer' : 'seller',
      counterpartName: row.buyer_id === user.id ? sellerNames.get(row.seller_id) ?? 'Seller' : 'Private buyer',
      gigTitle: gig?.title ?? null,
      lastReadAt,
    };
  });
  return privateJson({ conversations, unreadCount });
}

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) return privateJson({ error: 'Invalid request origin.' }, 403);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: 'Sign in first.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Messages are not configured.' }, 503);
  let body: { gigId?: string };
  try { body = await request.json(); } catch { return privateJson({ error: 'Invalid request.' }, 400); }
  if (!uuidPattern.test(body.gigId ?? '')) return privateJson({ error: 'Invalid product.' }, 400);
  const { data: gig } = await db.from('gigs').select('id,seller_id,status,seller_profiles(user_id)')
    .eq('id', body.gigId).maybeSingle();
  const sellerProfileRow = Array.isArray(gig?.seller_profiles) ? gig.seller_profiles[0] : gig?.seller_profiles;
  const seller = sellerProfileRow && typeof sellerProfileRow === 'object' && 'user_id' in sellerProfileRow
    ? sellerProfileRow.user_id
    : undefined;
  if (!gig || gig.status !== 'active' || !seller || seller === user.id) {
    return privateJson({ error: 'This seller is not available.' }, 409);
  }

  const { data: paidOrder, error: orderError } = await db.from('orders').select('id')
    .eq('buyer_id', user.id).eq('seller_id', gig.seller_id).eq('gig_id', gig.id)
    .in('status', paidOrderStatuses).limit(1).maybeSingle();
  if (orderError) return privateJson({ error: 'Could not verify the order.' }, 500);
  if (!paidOrder && !prePurchaseEnquiryEnabled()) {
    return privateJson({ error: 'Messaging is available only after a paid order for this product.' }, 403);
  }

  if (user.id === seller) {
    return privateJson({ error: 'You cannot message yourself about this product.' }, 409);
  }

  if (!paidOrder) {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const [{ data: todayConversations, error: limitError }, { data: paidOrderRows, error: paidListError }] = await Promise.all([
      db.from('conversations')
        .select('id,buyer_id,seller_id,gig_id,created_at')
        .eq('buyer_id', user.id)
        .gte('created_at', dayStart.toISOString()),
      db.from('orders')
        .select('gig_id, seller_id, seller_profiles!orders_seller_id_fkey(user_id)')
        .eq('buyer_id', user.id)
        .in('status', paidOrderStatuses),
    ]);
    if (limitError || paidListError) return privateJson({ error: 'Could not verify enquiry limits.' }, 500);
    const paidKeys = new Set<string>();
    for (const order of paidOrderRows ?? []) {
      const profile = Array.isArray(order.seller_profiles) ? order.seller_profiles[0] : order.seller_profiles;
      const sellerUserId = profile && typeof profile === 'object' && 'user_id' in profile ? String(profile.user_id) : '';
      if (sellerUserId) paidKeys.add(`${user.id}:${sellerUserId}:${order.gig_id}`);
      if (order.seller_id) paidKeys.add(`${user.id}:${order.seller_id}:${order.gig_id}`);
    }
    const enquiryThreadsToday = (todayConversations ?? []).filter((row) =>
      !paidKeys.has(`${row.buyer_id}:${row.seller_id}:${row.gig_id}`),
    ).length;
    if (enquiryThreadsToday >= ENQUIRY_DAILY_THREAD_LIMIT) {
      return privateJson({ error: `You can start up to ${ENQUIRY_DAILY_THREAD_LIMIT} new product conversations per day.` }, 429);
    }
  }

  // One thread per buyer per product. Buying after an enquiry must reuse that
  // row: order creation does not insert a conversation. Match (buyer_id, gig_id),
  // which is what conversations_enquiry_one_per_buyer_gig enforces.
  const { data: existingRows, error: existingError } = await db.from('conversations').select('id')
    .eq('buyer_id', user.id).eq('gig_id', gig.id).limit(1);
  if (existingError) return privateJson({ error: 'Could not open your existing conversation.' }, 500);
  if (existingRows?.[0]) return privateJson({ id: existingRows[0].id });
  // seller_id is the seller auth user id (messages FK and the paid-order trigger).
  // gig.seller_id is seller_profiles.id and must not be stored here.
  const { data: created, error } = await db.from('conversations')
    .insert({ buyer_id: user.id, seller_id: seller, gig_id: gig.id }).select('id').single();
  if (error?.code === '23505') {
    const { data: racedRows } = await db.from('conversations').select('id')
      .eq('buyer_id', user.id).eq('gig_id', gig.id).limit(1);
    if (racedRows?.[0]) {
      return privateJson({
        id: racedRows[0].id,
        message: 'You already have a conversation about this product.',
      });
    }
    return privateJson({
      error: 'You already have a conversation about this product. Open Messages to continue it.',
    }, 409);
  }
  return error || !created ? privateJson({ error: 'Could not start conversation.' }, 500)
    : privateJson({ id: created.id }, 201);
}
