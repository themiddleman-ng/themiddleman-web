import { authenticatedUser, privateJson, serviceClient, uuidPattern } from '@/lib/server/marketplace';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: 'Invalid order.' }, 400);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: 'Sign in first.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Orders are not configured.' }, 503);
  let body: { action?: string; reason?: string };
  try { body = await request.json(); } catch { return privateJson({ error: 'Invalid request.' }, 400); }
  if (body.action === 'accept') {
    const { error } = await db.rpc('accept_order_delivery', { p_order_id: id, p_buyer_uid: user.id });
    return error ? privateJson({ error: error.message }, 409) : privateJson({ status: 'approved' });
  }
  if (body.action === 'dispute') {
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (reason.length < 10 || reason.length > 2000) return privateJson({ error: 'Explain the issue in 10-2000 characters.' }, 400);
    const { error } = await db.rpc('raise_order_dispute', { p_order_id: id, p_buyer_uid: user.id, p_reason: reason });
    return error ? privateJson({ error: error.message }, 409) : privateJson({ status: 'disputed' });
  }
  return privateJson({ error: 'Unknown action.' }, 400);
}
