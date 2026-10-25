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

  const participantFilter = sellerProfile?.id
    ? `buyer_id.eq.${user.id},seller_id.eq.${sellerProfile.id}`
    : `buyer_id.eq.${user.id}`;
  const [conversationsResult, ordersResult] = await Promise.all([
    db.from('conversations')
      .select('id,buyer_id,seller_id,gig_id,buyer_last_read_at,seller_last_read_at,gigs(title),seller:seller_profiles!conversations_seller_id_fkey(display_name),messages(sender_id,created_at)')
      .or(participantFilter),
    db.from('orders')
      .select('buyer_id,seller_id,gig_id')
      .or(participantFilter)
      .in('status', paidOrderStatuses),
  ]);
  if (conversationsResult.error || ordersResult.error) return privateJson({ error: 'Could not load conversations.' }, 500);

  const paidOrderKeys = new Set((ordersResult.data ?? []).map(order => `${order.buyer_id}:${order.seller_id}:${order.gig_id}`));
  const enquiryEnabled = prePurchaseEnquiryEnabled();
  const visibleConversations = (conversationsResult.data ?? []).filter(row =>
    enquiryEnabled || paidOrderKeys.has(`${row.buyer_id}:${row.seller_id}:${row.gig_id}`)
  );

  let unreadCount = 0;
  const conversations = visibleConversations.map(row => {
    const lastReadAt = row.buyer_id === user.id ? row.buyer_last_read_at : row.seller_last_read_at;
    if ((row.messages ?? []).some(message => message.sender_id !== user.id &&
      (!lastReadAt || Date.parse(message.created_at) > Date.parse(lastReadAt)))) unreadCount++;
    return {
      id: row.id, gig_id: row.gig_id, role: row.buyer_id === user.id ? 'buyer' : 'seller',
      counterpartName: row.buyer_id === user.id ? row.seller?.[0]?.display_name ?? 'Seller' : 'Private buyer',
      gigTitle: row.gigs?.[0]?.title ?? null,
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
  const seller = gig?.seller_profiles?.[0]?.user_id;
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
        .select('gig_id, seller_profiles!orders_seller_id_fkey(user_id)')
        .eq('buyer_id', user.id)
        .in('status', paidOrderStatuses),
    ]);
    if (limitError || paidListError) return privateJson({ error: 'Could not verify enquiry limits.' }, 500);
    const paidKeys = new Set((paidOrderRows ?? []).map((order) => {
      const profile = Array.isArray(order.seller_profiles) ? order.seller_profiles[0] : order.seller_profiles;
      const sellerUserId = profile && typeof profile === 'object' && 'user_id' in profile ? String(profile.user_id) : '';
      return `${user.id}:${sellerUserId}:${order.gig_id}`;
    }));
    const enquiryThreadsToday = (todayConversations ?? []).filter((row) =>
      !paidKeys.has(`${row.buyer_id}:${row.seller_id}:${row.gig_id}`),
    ).length;
    if (enquiryThreadsToday >= ENQUIRY_DAILY_THREAD_LIMIT) {
      return privateJson({ error: `You can start up to ${ENQUIRY_DAILY_THREAD_LIMIT} new product conversations per day.` }, 429);
    }
  }

  const { data: existing } = await db.from('conversations').select('id')
    .eq('buyer_id', user.id).eq('seller_id', gig.seller_id).eq('gig_id', gig.id).maybeSingle();
  if (existing) return privateJson({ id: existing.id });
  const { data: created, error } = await db.from('conversations')
    .insert({ buyer_id: user.id, seller_id: gig.seller_id, gig_id: gig.id }).select('id').single();
  if (error?.code === '23505') {
    const { data: raced } = await db.from('conversations').select('id')
      .eq('buyer_id', user.id).eq('seller_id', gig.seller_id).eq('gig_id', gig.id).maybeSingle();
    if (raced) return privateJson({ id: raced.id });
  }
  return error || !created ? privateJson({ error: 'Could not start conversation.' }, 500)
    : privateJson({ id: created.id }, 201);
}
