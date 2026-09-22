import { authenticatedUser, privateJson, serviceClient, uuidPattern } from '@/lib/server/marketplace';

export const runtime = 'nodejs';

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: 'Sign in first.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Messages are not configured.' }, 503);
  const { data, error } = await db.from('conversations')
    .select('id,buyer_id,seller_id,gig_id,buyer_last_read_at,seller_last_read_at,gigs(title),seller:seller_profiles!conversations_seller_id_fkey(display_name),messages(sender_id,created_at)')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
  if (error) return privateJson({ error: 'Could not load conversations.' }, 500);
  let unreadCount = 0;
  const conversations = (data ?? []).map(row => {
    const lastReadAt = row.buyer_id === user.id ? row.buyer_last_read_at : row.seller_last_read_at;
    if ((row.messages ?? []).some(message => message.sender_id !== user.id &&
      (!lastReadAt || Date.parse(message.created_at) > Date.parse(lastReadAt)))) unreadCount++;
    return {
    id: row.id, gig_id: row.gig_id, role: row.buyer_id === user.id ? 'buyer' : 'seller',
    counterpartName: row.buyer_id === user.id ? row.seller?.[0]?.display_name ?? 'Seller' : 'Private buyer',
    gigTitle: row.gigs?.[0]?.title ?? null,
    lastReadAt,
  }; });
  return privateJson({ conversations, unreadCount });
}

export async function POST(request: Request) {
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
  const { data: existing } = await db.from('conversations').select('id')
    .eq('buyer_id', user.id).eq('seller_id', seller).eq('gig_id', gig.id).maybeSingle();
  if (existing) return privateJson({ id: existing.id });
  const { data: created, error } = await db.from('conversations')
    .insert({ buyer_id: user.id, seller_id: seller, gig_id: gig.id }).select('id').single();
  if (error?.code === '23505') {
    const { data: raced } = await db.from('conversations').select('id')
      .eq('buyer_id', user.id).eq('seller_id', seller).eq('gig_id', gig.id).maybeSingle();
    if (raced) return privateJson({ id: raced.id });
  }
  return error || !created ? privateJson({ error: 'Could not start conversation.' }, 500)
    : privateJson({ id: created.id }, 201);
}
